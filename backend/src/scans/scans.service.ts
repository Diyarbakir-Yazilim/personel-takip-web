import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { CreateBatchScanDto, SingleScanDto } from './dto/create-batch-scan.dto';

@Injectable()
export class ScansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async processBatchScans(dto: CreateBatchScanDto) {
    const processedScans: SingleScanDto[] = [];
    const skippedClientEventIds: string[] = [];

    for (const scan of dto.scans) {
      const cacheKey = `scan_event:${scan.clientEventId}`;

      const isSet = await this.redis.setNx(cacheKey, 'PROCESSED', 86400);

      if (!isSet) {
        skippedClientEventIds.push(scan.clientEventId);
        continue;
      }

      processedScans.push(scan);
    }

    if (processedScans.length > 0) {
      await this.prisma.$transaction(
        processedScans.map((scan) =>
          this.prisma.scanEvent.create({
            data: {
              idempotencyKey: scan.idempotencyKey,
              clientEventId: scan.clientEventId,
              userId: scan.userId,
              taskId: scan.taskId || null,
              token: scan.token,
              requestedAction: scan.requestedAction || 'AUTO',
              resolvedAction: scan.resolvedAction,
              method: scan.method,
              clientScannedAt: new Date(scan.clientScannedAt),
              riskScore: scan.riskScore || 0,
              riskFlags: scan.riskFlags || [],
              location: scan.location
                ? {
                    create: {
                      lat: scan.location.lat,
                      lng: scan.location.lng,
                      accuracy: scan.location.accuracy,
                    },
                  }
                : undefined,
              deviceIntegrity: scan.deviceIntegrity
                ? {
                    create: {
                      isRooted: scan.deviceIntegrity.isRooted ?? false,
                      isEmulator: scan.deviceIntegrity.isEmulator ?? false,
                      isMockLocation: scan.deviceIntegrity.isMockLocation ?? false,
                    },
                  }
                : undefined,
            },
          }),
        ),
      );
    }

    return {
      message: 'Batch processing completed',
      totalReceived: dto.scans.length,
      processedCount: processedScans.length,
      skippedCount: skippedClientEventIds.length,
      skippedClientEventIds,
    };
  }

  async findAll(skip: number = 0, take: number = 50) {
    const [scans, total] = await Promise.all([
      this.prisma.scanEvent.findMany({
        skip,
        take,
        orderBy: { clientScannedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
          task: {
            include: {
              zone: {
                select: {
                  name: true,
                  code: true,
                }
              }
            }
          },
          location: true,
          deviceIntegrity: true,
        },
      }),
      this.prisma.scanEvent.count(),
    ]);

    const scansWithDuration = await Promise.all(
      scans.map(async (scan) => {
        let durationMinutes: number | null = null;

        if (scan.resolvedAction === 'CHECK_OUT') {
          const lastCheckIn = await this.prisma.scanEvent.findFirst({
            where: {
              userId: scan.userId,
              resolvedAction: 'CHECK_IN',
              clientScannedAt: {
                lt: scan.clientScannedAt,
              },
            },
            orderBy: {
              clientScannedAt: 'desc',
            },
          });

          if (lastCheckIn) {
            const diffMs = scan.clientScannedAt.getTime() - lastCheckIn.clientScannedAt.getTime();
            durationMinutes = Math.round(diffMs / 60000);
          }
        }

        return {
          ...scan,
          durationMinutes,
        };
      })
    );

    return {
      data: scansWithDuration,
      meta: {
        total,
        skip,
        take,
      },
    };
  }
}

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

      // 1. Redis'te clientEventId var mı kontrol et
      const exists = await this.redis.get(cacheKey);

      if (exists) {
        // Mükerrer istek: Pas geçiliyor
        skippedClientEventIds.push(scan.clientEventId);
        continue;
      }

      // 2. Redis'e ekle (TTL: 24 Saat / 86400 sn)
      await this.redis.set(cacheKey, 'PROCESSED', 86400);

      processedScans.push(scan);
    }

    // 3. Redis'e yeni eklenen (mükerrer olmayan) verileri Veritabanına kaydet
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
}
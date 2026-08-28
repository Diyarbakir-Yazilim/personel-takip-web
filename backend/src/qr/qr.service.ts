import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { GenerateQrDto } from './dto/generate-qr.dto';
import { ValidateScanDto } from './dto/validate-scan.dto';

@Injectable()
export class QrService {
  private readonly secretKey: string;
  private readonly DRIFT_TOLERANCE_SECONDS = 60; // Allowed clock skew tolerance for dynamic QR

  constructor(private readonly configService: ConfigService) {
    const secret = this.configService.get<string>('QR_SECRET_KEY');

    if (!secret) {
      throw new InternalServerErrorException(
        'Critical Security Error: QR_SECRET_KEY is not defined in environment variables!',
      );
    }
    this.secretKey = secret;
  }

  /**
   * Generates QR Payload (Omits timestamp for static printed QR tags by default)
   */
  generatePayload(dto: GenerateQrDto, isDynamic = false) {
    if (isDynamic) {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = this.createSignature(dto.locationId, timestamp);
      return { locationId: dto.locationId, timestamp, signature };
    }

    // STATIC PRINTED QR: Generate a persistent timestamp-less signature
    const signature = this.createSignature(dto.locationId);
    return {
      locationId: dto.locationId,
      signature,
    };
  }

  /**
   * Validates incoming scan request (Supports both Static Printed & Dynamic QR codes)
   */
  validateScan(dto: ValidateScanDto): { success: boolean; message: string } {
    // A) DYNAMIC QR VALIDATION (when timestamp is provided)
    if (dto.timestamp) {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const qrTimestamp =
        dto.timestamp > 9999999999
          ? Math.floor(dto.timestamp / 1000)
          : dto.timestamp;

      const timeDiff = Math.abs(nowSeconds - qrTimestamp);
      if (timeDiff > this.DRIFT_TOLERANCE_SECONDS) {
        throw new UnauthorizedException(
          `Dynamic QR code expired or clock unsynchronized. Skew: ${timeDiff}s (Max: ${this.DRIFT_TOLERANCE_SECONDS}s)`,
        );
      }

      const expectedDynamicSignature = this.createSignature(
        dto.locationId,
        qrTimestamp,
      );

      if (!this.safeCompare(dto.signature, expectedDynamicSignature)) {
        throw new BadRequestException('Invalid dynamic QR signature.');
      }

      return {
        success: true,
        message: 'Dynamic QR scan successfully validated.',
      };
    }

    // B) STATIC PRINTED QR VALIDATION (when timestamp is omitted)
    const expectedStaticSignature = this.createSignature(dto.locationId);

    if (!this.safeCompare(dto.signature, expectedStaticSignature)) {
      throw new BadRequestException('Invalid static QR code signature.');
    }

    return {
      success: true,
      message: 'Static QR scan successfully validated.',
    };
  }

  /**
   * Generates HMAC-SHA256 Signature (Timestamp is optional)
   */
  private createSignature(locationId: string, timestamp?: number): string {
    const dataToSign = timestamp ? `${locationId}:${timestamp}` : locationId;
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(dataToSign)
      .digest('hex');
  }

  /**
   * Timing-attack safe hex string comparison
   */
  private safeCompare(a: string, b: string): boolean {
    if (typeof a !== 'string' || typeof b !== 'string') {
      return false;
    }

    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');

    if (bufA.length !== bufB.length || bufA.length === 0) {
      return false;
    }

    return crypto.timingSafeEqual(bufA, bufB);
  }
}

import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { GenerateQrDto } from './dto/generate-qr.dto';
import { ValidateScanDto } from './dto/validate-scan.dto';

@Injectable()
export class QrService {
  private readonly secretKey: string;
  private readonly DRIFT_TOLERANCE_SECONDS = 30; // ±30s tolerans

  constructor(private readonly configService: ConfigService) {
    // .env dosyasından QR_SECRET_KEY alınır, yoksa fallback bir secret kullanılır
    this.secretKey =
      this.configService.get<string>('QR_SECRET_KEY') || 'default-secret-key-change-it';
  }

  /**
   * Dinamik QR Payload Üretir
   */
  generatePayload(dto: GenerateQrDto) {
    const timestamp = Math.floor(Date.now() / 1000); // Saniye cinsinden
    const signature = this.createSignature(dto.locationId, timestamp);

    return {
      locationId: dto.locationId,
      timestamp,
      signature,
    };
  }

  /**
   * Gelen QR Tarama İsteğini Doğrular (±30s Drift Tolerance ile)
   */
  validateScan(dto: ValidateScanDto): { success: boolean; message: string } {
    const nowSeconds = Math.floor(Date.now() / 1000);
    // Eğer timestamp ms gelmişse saniyeye çevirelim
    const qrTimestamp =
      dto.timestamp > 9999999999
        ? Math.floor(dto.timestamp / 1000)
        : dto.timestamp;

    // 1. ±30s Drift Tolerance Kontrolü
    const timeDiff = Math.abs(nowSeconds - qrTimestamp);
    if (timeDiff > this.DRIFT_TOLERANCE_SECONDS) {
      throw new UnauthorizedException(
        `QR kodun süresi dolmuş veya cihaz saati senkronize değil. Sapma: ${timeDiff}s (Maks: ${this.DRIFT_TOLERANCE_SECONDS}s)`,
      );
    }

    // 2. Imza (Signature) Doğrulaması
    const expectedSignature = this.createSignature(dto.locationId, qrTimestamp);

    const isSignatureValid = this.safeCompare(
      dto.signature,
      expectedSignature,
    );

    if (!isSignatureValid) {
      throw new BadRequestException('Geçersiz QR koda ait imza (HMAC mühür eşleşmedi).');
    }

    return {
      success: true,
      message: 'QR başarıyla doğrulandı.',
    };
  }

  /**
   * LocationId ve Timestamp kullanarak HMAC-SHA256 İmzası Üretir
   */
  private createSignature(locationId: string, timestamp: number): string {
    const dataToSign = `${locationId}:${timestamp}`;
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(dataToSign)
      .digest('hex');
  }

  /**
   * Timing Attack korumalı güvenli metin karşılaştırması
   */
  private safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }
}
import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  onModuleInit() {
    const redisUrl = process.env.REDIS_URL;

    if (redisUrl) {
      this.client = new Redis(redisUrl, { maxRetriesPerRequest: 3 });
    } else {
      this.client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6380,
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: 3,
      });
    }

    this.client.on('error', (err) => {
      this.logger.error('Redis connection error:', err.message);
    });

    this.client.on('connect', () => {
      this.logger.log('Redis client connected successfully.');
    });
  }

  onModuleDestroy() {
    this.client.quit();
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<'OK'> {
    if (ttlSeconds) {
      return this.client.set(key, value, 'EX', ttlSeconds);
    }
    return this.client.set(key, value);
  }
  async setNx(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    const result = await this.client.set(key, value, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }
}

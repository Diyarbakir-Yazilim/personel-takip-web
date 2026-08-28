import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions, Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { Logger } from '@nestjs/common';

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor!: ReturnType<typeof createAdapter>;

  connectToRedis(): void {
    const redisUrl = process.env.REDIS_URL;

    const pubClient = redisUrl
      ? new Redis(redisUrl, { maxRetriesPerRequest: 3 })
      : new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: Number(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD || undefined,
          maxRetriesPerRequest: 3,
        });

    pubClient.on('error', (err: Error) => {
      this.logger.error('Redis Adapter PubClient hatası:', err.message);
    });

    const subClient = pubClient.duplicate();

    subClient.on('error', (err: Error) => {
      this.logger.error('Redis Adapter SubClient hatası:', err.message);
    });

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  override createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, options) as Server;
    server.adapter(this.adapterConstructor);
    return server;
  }
}

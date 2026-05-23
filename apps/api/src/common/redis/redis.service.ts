import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const host = this.config.get<string>('redis.host', 'localhost');
    const port = this.config.get<number>('redis.port', 6379);
    const password = this.config.get<string>('redis.password');

    this.client = new Redis({
      host,
      port,
      password,
      keyPrefix: 'brandflow:',
    });
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async incrBy(key: string, value: number): Promise<number> {
    return this.client.incrby(key, value);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  getClient(): Redis {
    return this.client;
  }
}

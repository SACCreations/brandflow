import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: { status: string; latencyMs?: number };
    redis: { status: string; latencyMs?: number };
    memory: { heapUsedMB: number; heapTotalMB: number; rss: number };
  };
}

@Injectable()
export class HealthService {
  private redis: Redis | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const redisUrl = this.config.get<string>('REDIS_URL', 'redis://localhost:6379');
    try {
      this.redis = new Redis(redisUrl, { maxRetriesPerRequest: 1, connectTimeout: 3000 });
    } catch {
      this.redis = null;
    }
  }

  async check(): Promise<HealthStatus> {
    const [dbCheck, redisCheck] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const dbResult = dbCheck.status === 'fulfilled' ? dbCheck.value : { status: 'unhealthy' };
    const redisResult = redisCheck.status === 'fulfilled' ? redisCheck.value : { status: 'unhealthy' };

    const allHealthy = dbResult.status === 'connected' && redisResult.status === 'connected';
    const anyUnhealthy = dbResult.status === 'unhealthy' || redisResult.status === 'unhealthy';

    const memory = process.memoryUsage();

    return {
      status: allHealthy ? 'ok' : anyUnhealthy ? 'unhealthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: dbResult,
        redis: redisResult,
        memory: {
          heapUsedMB: Math.round(memory.heapUsed / 1024 / 1024),
          heapTotalMB: Math.round(memory.heapTotal / 1024 / 1024),
          rss: Math.round(memory.rss / 1024 / 1024),
        },
      },
    };
  }

  async checkReady(): Promise<HealthStatus> {
    const health = await this.check();
    if (health.status === 'unhealthy') {
      throw new Error('Service not ready');
    }
    return health;
  }

  private async checkDatabase(): Promise<{ status: string; latencyMs: number }> {
    const start = Date.now();
    try {
      await this.prisma.client.$queryRaw`SELECT 1`;
      return { status: 'connected', latencyMs: Date.now() - start };
    } catch {
      return { status: 'unhealthy', latencyMs: Date.now() - start };
    }
  }

  private async checkRedis(): Promise<{ status: string; latencyMs: number }> {
    const start = Date.now();
    try {
      if (!this.redis) return { status: 'unhealthy', latencyMs: 0 };
      await this.redis.ping();
      return { status: 'connected', latencyMs: Date.now() - start };
    } catch {
      return { status: 'unhealthy', latencyMs: Date.now() - start };
    }
  }
}

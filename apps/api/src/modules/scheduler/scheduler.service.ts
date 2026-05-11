import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { prisma } from '@brandflow/db';
import { QUEUES, type CreateScheduleDto } from '@brandflow/shared';

@Injectable()
export class SchedulerService {
  constructor(@InjectQueue(QUEUES.PUBLISH) private readonly publishQueue: Queue) {}

  async findAll(businessId: string, campaignId?: string) {
    return prisma.schedule.findMany({
      where: { businessId, ...(campaignId ? { campaignId } : {}) },
      include: {
        content: { select: { id: true, platform: true, type: true, body: true } },
        publishJobs: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async findById(id: string, businessId: string) {
    const schedule = await prisma.schedule.findFirst({
      where: { id, businessId },
      include: {
        content: true,
        publishJobs: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!schedule) throw new NotFoundException('Schedule not found');
    return schedule;
  }

  async create(businessId: string, dto: CreateScheduleDto) {
    const content = await prisma.content.findFirst({ where: { id: dto.contentId, businessId } });
    if (!content) throw new NotFoundException('Content not found');
    if (content.status !== 'approved') {
      throw new BadRequestException('Content must be approved before scheduling');
    }

    if (new Date(dto.scheduledAt) <= new Date()) {
      throw new BadRequestException('scheduledAt must be in the future');
    }

    const schedule = await prisma.schedule.create({
      data: {
        businessId,
        contentId: dto.contentId,
        campaignId: dto.campaignId,
        socialAccountId: dto.socialAccountId,
        scheduledAt: new Date(dto.scheduledAt),
        type: dto.type ?? 'one_time',
        recurringRule: dto.recurringRule,
      },
    });

    // Enqueue the publish job with delay
    const delay = new Date(dto.scheduledAt).getTime() - Date.now();
    await this.publishQueue.add(
      'publish',
      { scheduleId: schedule.id, businessId, contentId: dto.contentId },
      { delay: Math.max(delay, 0), jobId: schedule.id, attempts: 3, backoff: { type: 'exponential', delay: 60000 } },
    );

    return schedule;
  }

  async cancel(id: string, businessId: string) {
    await this.findById(id, businessId);
    await this.publishQueue.remove(id);
    return prisma.schedule.update({ where: { id }, data: { status: 'cancelled' } });
  }
}

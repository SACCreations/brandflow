import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { prisma } from '@brandflow/db';
import { QUEUES, type CreateScheduleDto } from '@brandflow/shared';

@Injectable()
export class SchedulerService {
  constructor(@InjectQueue(QUEUES.PUBLISH) private readonly publishQueue: Queue) {}

  async findAll(
    businessId: string,
    filters: { campaignId?: string; contentId?: string } = {},
  ) {
    return prisma.schedule.findMany({
      where: {
        businessId,
        ...(filters.campaignId ? { campaignId: filters.campaignId } : {}),
        ...(filters.contentId ? { contentId: filters.contentId } : {}),
      },
      include: {
        content: { select: { id: true, platform: true, type: true, body: true, status: true } },
        campaign: { select: { id: true, name: true } },
        socialAccount: { select: { id: true, platform: true, name: true } },
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
        campaign: { select: { id: true, name: true } },
        socialAccount: { select: { id: true, platform: true, name: true } },
        publishJobs: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!schedule) throw new NotFoundException('Schedule not found');
    return schedule;
  }

  async create(businessId: string, dto: CreateScheduleDto) {
    if (!dto.contentId) throw new BadRequestException('contentId is required');
    const content = await prisma.content.findFirst({
      where: { id: dto.contentId, businessId },
      select: { id: true, status: true, campaignId: true },
    });
    if (!content) throw new NotFoundException('Content not found');
    if (content.status !== 'approved') {
      throw new BadRequestException('Content must be approved before scheduling');
    }

    const socialAccount = await prisma.socialAccount.findFirst({
      where: { id: dto.socialAccountId, businessId },
      select: { id: true },
    });
    if (!socialAccount) {
      throw new NotFoundException('Social account not found');
    }

    if (dto.campaignId && content.campaignId && dto.campaignId !== content.campaignId) {
      throw new BadRequestException('Selected campaign does not match the content campaign.');
    }

    if (new Date(dto.scheduledAt) <= new Date()) {
      throw new BadRequestException('scheduledAt must be in the future');
    }

    const existingPendingSchedule = await prisma.schedule.findFirst({
      where: {
        businessId,
        contentId: dto.contentId,
        status: 'pending',
      },
      select: { id: true },
    });
    if (existingPendingSchedule) {
      throw new BadRequestException('This content already has a pending schedule.');
    }

    const schedule = await prisma.$transaction(async (tx) => {
      const created = await tx.schedule.create({
        data: {
          businessId,
          contentId: dto.contentId,
          campaignId: dto.campaignId ?? content.campaignId ?? null,
          socialAccountId: dto.socialAccountId,
          scheduledAt: new Date(dto.scheduledAt),
          type: dto.type ?? 'one_time',
          recurringRule: dto.recurringRule,
          timezone: dto.timezone ?? 'UTC',
        },
      });

      await tx.content.update({
        where: { id: dto.contentId! },
        data: { status: 'scheduled' },
      });

      return created;
    });

    // Enqueue the publish job with delay
    const delay = new Date(dto.scheduledAt).getTime() - Date.now();
    await this.publishQueue.add(
      'publish',
      { scheduleId: schedule.id, businessId, contentId: dto.contentId! },
      { delay: Math.max(delay, 0), jobId: schedule.id, attempts: 3, backoff: { type: 'exponential', delay: 60000 } },
    );

    return schedule;
  }

  async cancel(id: string, businessId: string) {
    const schedule = await this.findById(id, businessId);

    try {
      await this.publishQueue.remove(id);
    } catch {
      // Ignore missing queue jobs; the schedule can still be cancelled.
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.schedule.update({
        where: { id },
        data: { status: 'cancelled' },
      });

      if (schedule.contentId) {
        const remainingPendingSchedules = await tx.schedule.count({
          where: {
            businessId,
            contentId: schedule.contentId,
            status: 'pending',
            NOT: { id },
          },
        });

        if (remainingPendingSchedules === 0) {
          await tx.content.update({
            where: { id: schedule.contentId },
            data: { status: 'approved' },
          });
        }
      }

      return updated;
    });
  }

  async retry(id: string, businessId: string) {
    const schedule = await this.findById(id, businessId);

    if (schedule.status !== 'failed') {
      throw new BadRequestException('Only failed schedules can be retried.');
    }

    if (!schedule.contentId) {
      throw new BadRequestException('This schedule is not linked to a content item.');
    }

    if (!schedule.socialAccountId) {
      throw new BadRequestException('This schedule is not linked to a social account.');
    }

    const contentId = schedule.contentId;

    try {
      await this.publishQueue.remove(id);
    } catch {
      // Ignore queue state mismatch; we are rebuilding the job intentionally.
    }

    const retriedSchedule = await prisma.$transaction(async (tx) => {
      const updated = await tx.schedule.update({
        where: { id },
        data: {
          status: 'pending',
          scheduledAt: new Date(),
        },
      });

      await tx.content.update({
        where: { id: contentId },
        data: { status: 'scheduled' },
      });

      return updated;
    });

    await this.publishQueue.add(
      'publish',
      { scheduleId: retriedSchedule.id, businessId, contentId },
      {
        jobId: retriedSchedule.id,
        attempts: 3,
        backoff: { type: 'exponential', delay: 60000 },
      },
    );

    return this.findById(retriedSchedule.id, businessId);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { prisma } from '@brandflow/db';
import { QUEUES, type CreateAutomationDto } from '@brandflow/shared';

@Injectable()
export class AutomationService {
  constructor(@InjectQueue(QUEUES.AUTOMATION) private readonly automationQueue: Queue) {}

  async findAll(businessId: string) {
    return prisma.automation.findMany({
      where: { businessId },
      include: { _count: { select: { runs: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, businessId: string) {
    const automation = await prisma.automation.findFirst({
      where: { id, businessId },
      include: {
        runs: { orderBy: { startedAt: 'desc' }, take: 10 },
      },
    });
    if (!automation) throw new NotFoundException('Automation not found');
    return automation;
  }

  async create(businessId: string, dto: CreateAutomationDto) {
    return prisma.automation.create({
      data: {
        businessId,
        name: dto.name,
        triggerType: dto.triggerType,
        triggerConfig: dto.triggerConfig ?? {},
        steps: dto.steps,
        errorPolicy: dto.errorPolicy ?? { onFailure: 'stop' },
        isActive: true,
      },
    });
  }

  async toggle(id: string, businessId: string) {
    const automation = await this.findById(id, businessId);
    return prisma.automation.update({
      where: { id },
      data: { isActive: !automation.isActive },
    });
  }

  async delete(id: string, businessId: string) {
    await this.findById(id, businessId);
    return prisma.automation.delete({ where: { id } });
  }

  /**
   * Trigger an automation manually or via event — enqueues a run.
   */
  async trigger(id: string, businessId: string, payload: Record<string, unknown> = {}) {
    const automation = await this.findById(id, businessId);
    if (!automation.isActive) throw new NotFoundException('Automation is inactive');

    const run = await prisma.automationRun.create({
      data: { automationId: id, businessId, status: 'queued', trigger: payload },
    });

    await this.automationQueue.add(
      'run',
      { runId: run.id, automationId: id, businessId },
      { attempts: 1, jobId: run.id },
    );

    return run;
  }
}

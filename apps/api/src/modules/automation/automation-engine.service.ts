import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { prisma } from '@brandflow/db';
import { PrismaService } from '../../common/database/prisma.service';
import { QUEUES } from '@brandflow/shared';
import fetch from 'node-fetch';

@Injectable()
export class AutomationEngineService {
  private readonly logger = new Logger(AutomationEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUES.AUTOMATION_EXECUTION) private readonly executionQueue: Queue,
  ) {}

  /**
   * Main entry point to process a system event through active automations.
   */
  async processEvent(businessId: string, triggerType: string, context: any) {
    const activeAutomations = await this.prisma.client.automation.findMany({
      where: { businessId, triggerType, isActive: true }
    });

    for (const automation of activeAutomations) {
      this.logger.log(`Evaluating automation "${automation.name}" for trigger ${triggerType}`);
      
      const shouldRun = this.evaluateConditions(automation.triggerConfig as any, context);
      
      if (shouldRun) {
        await this.runAutomation(automation, context);
      }
    }
  }

  private evaluateConditions(config: any, context: any): boolean {
    if (!config || !config.conditions) return true;

    // Simplified logic: Check if all conditions are met (AND logic)
    return config.conditions.every((cond: any) => {
      const actualValue = context[cond.field];
      switch (cond.operator) {
        case '==': return actualValue === cond.value;
        case '!=': return actualValue !== cond.value;
        case 'contains': return actualValue?.includes(cond.value);
        default: return false;
      }
    });
  }

  private async runAutomation(automation: any, context: any) {
    const run = await this.prisma.client.automationRun.create({
      data: {
        automationId: automation.id,
        businessId: automation.businessId,
        status: 'running',
        triggerEvent: context,
        isDryRun: automation.isDryRun
      }
    });

    // Enqueue for async processing
    await this.executionQueue.add('execute', {
      runId: run.id,
      automationId: automation.id,
      businessId: automation.businessId,
      context,
      steps: automation.steps,
      isDryRun: automation.isDryRun
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 }
    });

    return run;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@brandflow/db';

@Injectable()
export class AutomationEngineService {
  private readonly logger = new Logger(AutomationEngineService.name);

  /**
   * Main entry point to process a system event through active automations.
   */
  async processEvent(businessId: string, triggerType: string, context: any) {
    const activeAutomations = await prisma.automation.findMany({
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
        case '>': return actualValue > cond.value;
        case '<': return actualValue < cond.value;
        case 'contains': return actualValue?.includes(cond.value);
        default: return false;
      }
    });
  }

  private async runAutomation(automation: any, context: any) {
    const run = await prisma.automationRun.create({
      data: {
        automationId: automation.id,
        businessId: automation.businessId,
        status: 'running',
        triggerEvent: context,
        isDryRun: automation.isDryRun
      }
    });

    try {
      const steps = automation.steps as any[];
      const stepResults = [];

      for (const step of steps) {
        if (automation.isDryRun) {
          stepResults.push({ step: step.type, result: 'dry_run_success' });
          continue;
        }

        const result = await this.executeStep(step, context, automation.businessId);
        stepResults.push({ step: step.type, result });
      }

      await prisma.automationRun.update({
        where: { id: run.id },
        data: {
          status: 'completed',
          stepResults: stepResults as any,
          completedAt: new Date()
        }
      });
    } catch (error: any) {
      this.logger.error(`Automation run ${run.id} failed`, error);
      await prisma.automationRun.update({
        where: { id: run.id },
        data: {
          status: 'failed',
          stepResults: { error: error.message || 'Unknown error' } as any,
          completedAt: new Date()
        }
      });
    }
  }

  private async executeStep(step: any, context: any, businessId: string) {
    switch (step.type) {
      case 'update_status':
        return prisma.content.update({
          where: { id: context.contentId },
          data: { status: step.params.status }
        });

      case 'send_notification':
        return prisma.notification.create({
          data: {
            businessId,
            userId: context.authorId || context.userId,
            type: 'automation',
            channel: 'in_app',
            title: step.params.title,
            body: step.params.body
          }
        });

      case 'auto_schedule':
        // Logic to find next available slot or fixed time
        const scheduledAt = new Date();
        scheduledAt.setDate(scheduledAt.getDate() + 1); // Tomorrow
        scheduledAt.setHours(9, 0, 0, 0); // 9 AM

        return prisma.schedule.create({
          data: {
            businessId,
            contentId: context.contentId,
            socialAccountId: step.params.socialAccountId,
            scheduledAt,
            status: 'pending'
          }
        });

      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }
}

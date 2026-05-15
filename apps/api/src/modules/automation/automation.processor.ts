import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { prisma } from '@brandflow/db';
import { QUEUES } from '@brandflow/shared';
import { PublishService } from '../social/publish.service';
import fetch from 'node-fetch';

@Processor(QUEUES.AUTOMATION_EXECUTION)
export class AutomationProcessor extends WorkerHost {
  private readonly logger = new Logger(AutomationProcessor.name);

  constructor(private readonly publishService: PublishService) {
    super();
  }

  async process(job: Job<any>): Promise<void> {
    const { runId, automationId, businessId, context, steps, isDryRun } = job.data;
    this.logger.debug(`[AUTOMATION] Executing run ${runId} for automation ${automationId}`);

    const stepResults = [];
    
    try {
      for (const step of steps) {
        if (isDryRun) {
          stepResults.push({ step: step.type, result: 'dry_run_success' });
          continue;
        }

        const result = await this.executeStep(step, context, businessId);
        stepResults.push({ step: step.type, result });
      }

      await prisma.automationRun.update({
        where: { id: runId },
        data: {
          status: 'completed',
          stepResults: stepResults as any,
          completedAt: new Date()
        }
      });
    } catch (err: any) {
      this.logger.error(`Automation run ${runId} failed at step: ${err.message}`);
      await prisma.automationRun.update({
        where: { id: runId },
        data: {
          status: 'failed',
          stepResults: [...stepResults, { error: err.message }] as any,
          completedAt: new Date()
        }
      });
      throw err;
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

      case 'publish_to_social':
        this.logger.log(`Executing social publish for business ${businessId}`);
        return this.publishService.publishContent(
          context.contentId,
          step.params.socialAccountId,
          businessId
        );

      case 'webhook':
        this.logger.log(`Executing webhook: ${step.params.url}`);
        const response = await fetch(step.params.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Brandflow-Automation-Id': step.params.automationId || 'none',
          },
          body: JSON.stringify({
            event: context,
            timestamp: new Date().toISOString(),
            businessId,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
        }
        return { status: response.status, statusText: response.statusText };

      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }
}

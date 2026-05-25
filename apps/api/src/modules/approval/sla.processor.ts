import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../common/database/prisma.service';
import { Logger } from '@nestjs/common';

@Processor('sla-monitor')
export class SlaProcessor extends WorkerHost {
  private readonly logger = new Logger(SlaProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing SLA Monitor job ${job.id}`);

    // Find approvals where status is 'pending' and slaDeadline is in the past
    const overdueApprovals = await this.prisma.client.approval.findMany({
      where: {
        status: 'pending',
        slaDeadline: {
          lt: new Date(),
        },
        // In a real app we might want a flag to ensure we don't alert multiple times
      },
      include: {
        content: true,
      },
    });

    if (overdueApprovals.length === 0) {
      this.logger.log('No overdue approvals found.');
      return { breached: 0 };
    }

    this.logger.warn(`Found ${overdueApprovals.length} overdue approvals! Initiating mock email dispatch...`);

    // In a production system, we would push to a notification queue here.
    for (const approval of overdueApprovals) {
      this.logger.log(`[MOCK ALERT] Content ID ${approval.contentId} in Business ${approval.businessId} has breached its SLA.`);
    }

    return { breached: overdueApprovals.length };
  }
}

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { APPROVAL_STATUSES, ApprovalStatus, ReviewType } from '@brandflow/shared';

@Injectable()
export class ApprovalService {
  constructor(private readonly prisma: PrismaService) {}
  /**
   * Retrieves the pending approval queue for a specific business/user.
   */
  async getQueue(businessId: string, status = 'pending', source?: string) {
    const normalizedStatus = APPROVAL_STATUSES.includes(status as ApprovalStatus)
      ? (status as ApprovalStatus)
      : 'pending';

    const where: any = {
      businessId,
      status: normalizedStatus,
    };

    // Filter by route source (auto-routed vs manual)
    if (source === 'auto') {
      where.routeReason = { not: null };
    } else if (source === 'manual') {
      where.routeReason = null;
    }

    return this.prisma.client.approval.findMany({
      where,
      include: {
        content: {
          include: {
            brand: true,
            brief: {
              select: {
                id: true,
                objective: true,
                audience: true,
                cta: true,
              },
            },
            campaign: { select: { id: true, name: true, status: true } },
            qualityChecks: {
              orderBy: { checkedAt: 'desc' },
              take: 1
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  /**
   * Returns the count of pending approvals.
   */
  async getQueueCount(businessId: string): Promise<number> {
    return this.prisma.client.approval.count({
      where: { businessId, status: 'pending' },
    });
  }

  /**
   * Initiates an approval request for a piece of content.
   */
  async requestApproval(businessId: string, contentId: string, reviewType: ReviewType = 'internal') {
    const content = await this.prisma.client.content.findFirst({
      where: { id: contentId, businessId },
      include: {
        approvals: {
          where: { status: 'pending' },
          select: { id: true },
        },
      },
    });
    if (!content) throw new NotFoundException('Content not found');

    if (['published', 'archived', 'scheduled'].includes(content.status)) {
      throw new BadRequestException(`Content in ${content.status} status cannot enter review.`);
    }

    if (content.approvals.length > 0) {
      throw new ConflictException('This content already has a pending approval request.');
    }

    return this.prisma.client.$transaction(async (tx) => {
      await tx.content.update({
        where: { id: contentId },
        data: { status: 'in_review' },
      });

      return tx.approval.create({
        data: {
          businessId,
          contentId,
          reviewType,
          status: 'pending',
          slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    });
  }

  /**
   * Submits a decision (Approve/Reject) on an approval item.
   */
  async submitDecision(
    id: string,
    businessId: string,
    status: 'approved' | 'rejected' | 'revision_requested',
    note?: string,
    reason?: string,
  ) {
    const approval = await this.prisma.client.approval.findFirst({
      where: { id, businessId },
      include: {
        content: { select: { id: true } },
      },
    });

    if (!approval) throw new NotFoundException('Approval not found');
    if (approval.status !== 'pending') {
      throw new ConflictException('This approval has already been decided.');
    }

    // Enterprise Safety: Check for high-severity brand violations before approval
    if (status === 'approved') {
      const latestCheck = await this.prisma.client.qualityCheck.findFirst({
        where: { contentId: approval.contentId },
        include: { violations: true },
        orderBy: { checkedAt: 'desc' },
      });


      if (latestCheck && !latestCheck.passed) {
        const violations = (latestCheck.violations as any[]) || [];
        const hasHighSeverity = violations.some((v: any) => v.severity === 'high');
        
        if (hasHighSeverity) {
          throw new BadRequestException(
            'Cannot approve content with high-severity brand violations. Please request revisions.',
          );
        }
      }
    }

    const contentStatus = status === 'approved' ? 'approved' : 'revision_requested';

    const [updatedApproval] = await this.prisma.client.$transaction([
      this.prisma.client.approval.update({
        where: { id },
        data: {
          status,
          note,
          reason,
          decidedAt: new Date(),
        },
      }),
      this.prisma.client.content.update({
        where: { id: approval.contentId },
        data: { 
          status: contentStatus,
        },
      }),
    ]);

    return updatedApproval;
  }

  /**
   * Performs bulk approval actions.
   */
  async bulkApprove(ids: string[], businessId: string, note?: string) {
    const results = [];
    for (const id of ids) {
      results.push(await this.submitDecision(id, businessId, 'approved', note ?? 'Bulk approved by manager'));
    }
    return results;
  }
}

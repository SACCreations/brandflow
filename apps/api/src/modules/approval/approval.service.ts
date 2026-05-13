import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma } from '@brandflow/db';
import { APPROVAL_STATUSES, type ApprovalStatus, type ReviewType } from '@brandflow/shared';

@Injectable()
export class ApprovalService {
  /**
   * Retrieves the pending approval queue for a specific business/user.
   */
  async getQueue(businessId: string, status = 'pending') {
    const normalizedStatus = APPROVAL_STATUSES.includes(status as ApprovalStatus)
      ? (status as ApprovalStatus)
      : 'pending';

    return prisma.approval.findMany({
      where: { 
        businessId,
        status: normalizedStatus,
      },
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
   * Initiates an approval request for a piece of content.
   */
  async requestApproval(businessId: string, contentId: string, reviewType: ReviewType = 'internal') {
    const content = await prisma.content.findFirst({
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

    return prisma.$transaction(async (tx) => {
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
    const approval = await prisma.approval.findFirst({
      where: { id, businessId },
      include: {
        content: { select: { id: true } },
      },
    });

    if (!approval) throw new NotFoundException('Approval not found');
    if (approval.status !== 'pending') {
      throw new ConflictException('This approval has already been decided.');
    }

    const contentStatus = status === 'approved' ? 'approved' : 'revision_requested';

    const [updatedApproval] = await prisma.$transaction([
      prisma.approval.update({
        where: { id },
        data: {
          status,
          note,
          reason,
          decidedAt: new Date(),
        },
      }),
      prisma.content.update({
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

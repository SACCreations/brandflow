import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@brandflow/db';

@Injectable()
export class ApprovalService {
  /**
   * Retrieves the pending approval queue for a specific business/user.
   */
  async getQueue(businessId: string, status = 'pending') {
    return prisma.approval.findMany({
      where: { 
        businessId,
        status
      },
      include: {
        content: {
          include: {
            brand: true,
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
  async requestApproval(businessId: string, contentId: string, reviewType: string = 'brand_check') {
    const content = await prisma.content.findUnique({ where: { id: contentId } });
    if (!content) throw new NotFoundException('Content not found');

    // Update content status to pending_approval
    await prisma.content.update({
      where: { id: contentId },
      data: { status: 'pending_approval' }
    });

    return prisma.approval.create({
      data: {
        businessId,
        contentId,
        reviewType,
        status: 'pending',
        slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h SLA
      }
    });
  }

  /**
   * Submits a decision (Approve/Reject) on an approval item.
   */
  async submitDecision(id: string, businessId: string, status: 'approved' | 'rejected', note?: string) {
    const approval = await prisma.approval.findFirst({
      where: { id, businessId }
    });

    if (!approval) throw new NotFoundException('Approval not found');

    const updatedApproval = await prisma.approval.update({
      where: { id },
      data: {
        status,
        note,
        decidedAt: new Date()
      }
    });

    // Update the content status based on the decision
    await prisma.content.update({
      where: { id: approval.contentId },
      data: { 
        status: status === 'approved' ? 'approved' : 'rejected',
        // In rejection, we might want to record the reason/note on the content itself or a version
      }
    });

    return updatedApproval;
  }

  /**
   * Performs bulk approval actions.
   */
  async bulkApprove(ids: string[], businessId: string) {
    const results = [];
    for (const id of ids) {
      results.push(await this.submitDecision(id, businessId, 'approved', 'Bulk approved by manager'));
    }
    return results;
  }
}

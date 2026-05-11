import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@brandflow/db';
import type { Prisma } from '@brandflow/db';
import type { SubmitApprovalDecisionDto } from '@brandflow/shared';

@Injectable()
export class ApprovalService {
  async findPending(businessId: string) {
    return prisma.approval.findMany({
      where: { businessId, status: 'pending' },
      include: {
        content: { select: { id: true, platform: true, type: true, body: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id: string, businessId: string) {
    const approval = await prisma.approval.findFirst({
      where: { id, businessId },
      include: { content: true },
    });
    if (!approval) throw new NotFoundException('Approval not found');
    return approval;
  }

  async requestApproval(
    contentId: string,
    businessId: string,
    reviewerId?: string,
    slaHours = 24,
  ) {
    const content = await prisma.content.findFirst({ where: { id: contentId, businessId } });
    if (!content) throw new NotFoundException('Content not found');
    if (!['draft', 'revision_requested'].includes(content.status)) {
      throw new BadRequestException('Content must be in draft or revision_requested status');
    }

    const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const approval = await tx.approval.create({
        data: {
          businessId,
          contentId,
          reviewerId,
          reviewType: reviewerId ? 'internal' : 'owner',
          status: 'pending',
          slaDeadline,
        },
      });

      await tx.content.update({ where: { id: contentId }, data: { status: 'in_review' } });

      return approval;
    });
  }

  async decide(id: string, businessId: string, reviewerId: string, dto: SubmitApprovalDecisionDto) {
    const approval = await this.findById(id, businessId);
    if (approval.status !== 'pending') {
      throw new BadRequestException('Approval has already been decided');
    }

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.approval.update({
        where: { id },
        data: {
          status: dto.status,
          note: dto.note,
          reason: dto.reason,
          reviewerId,
          decidedAt: new Date(),
        },
      });

      // Update content status based on decision
      const contentStatus =
        dto.status === 'approved'
          ? 'approved'
          : dto.status === 'rejected'
            ? 'draft'
            : 'revision_requested';

      await tx.content.update({
        where: { id: approval.contentId },
        data: { status: contentStatus },
      });

      return updated;
    });
  }
}

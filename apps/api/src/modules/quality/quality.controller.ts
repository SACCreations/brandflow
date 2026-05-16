import { Controller, Get, Post, Param, Body, UseGuards, Query } from '@nestjs/common';
import { QualityService } from './quality.service';
import { prisma } from '@brandflow/db';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { type JwtPayload } from '@brandflow/shared';



@ApiTags('quality')
@ApiBearerAuth()
@Controller('quality')
export class QualityControllerInternal {
  constructor(private readonly qualityService: QualityService) {}

  @Get('reviews')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List pending quality review tasks' })
  async getReviews(
    @CurrentUser() user: JwtPayload,
    @Query('priority') priority?: string,
  ) {
    return prisma.reviewTask.findMany({
      where: {
        businessId: user.businessId,
        status: 'pending',
        ...(priority ? { priority: priority as any } : {}),
      },
      include: {
        content: { select: { id: true, body: true, type: true } },
        qualityCheck: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('reviews/:taskId/resolve')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Resolve a quality review task' })
  async resolveReview(
    @Param('taskId') taskId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: { action: 'approve' | 'reject'; notes?: string },
  ) {
    const task = await prisma.reviewTask.findFirst({
      where: { id: taskId, businessId: user.businessId },
    });

    if (!task) throw new Error('Review task not found');

    return prisma.$transaction(async (tx) => {
      await tx.reviewTask.update({
        where: { id: taskId },
        data: {
          status: dto.action === 'approve' ? 'resolved' : 'rejected',
          resolvedAt: new Date(),
          resolvedById: user.sub,
          resolutionNotes: dto.notes,
        },
      });

      if (dto.action === 'approve') {
        await tx.content.update({
          where: { id: task.contentId },
          data: { status: 'approved' },
        });
      } else {
        await tx.content.update({
          where: { id: task.contentId },
          data: { status: 'draft' }, // Move back to draft for fixing
        });
      }

      return { success: true, action: dto.action };
    });
  }

  @Get('content/:contentId')
  @UseGuards(JwtAuthGuard)
  async getLatestCheck(@Param('contentId') contentId: string, @CurrentUser() user: JwtPayload) {
    return prisma.qualityCheck.findFirst({
      where: { contentId, businessId: user.businessId },
      include: {
        violations: true,
        citations: {
          include: {
            entry: {
              select: {
                content: true,
                source: {
                  select: { name: true, type: true }
                }
              }
            }
          }
        }
      },
      orderBy: { checkedAt: 'desc' }
    });
  }

  @Get('citations/:checkId')
  async getCitations(@Param('checkId') checkId: string) {
    return prisma.knowledgeCitation.findMany({
      where: { qualityCheckId: checkId },
      include: {
        entry: true
      }
    });
  }
}

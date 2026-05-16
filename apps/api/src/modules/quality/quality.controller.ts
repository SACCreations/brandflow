import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { QualityService } from './quality.service';
import { prisma } from '@brandflow/db';



@Controller('quality')
export class QualityControllerInternal {
  constructor(private readonly qualityService: QualityService) {}

  @Get('content/:contentId')
  async getLatestCheck(@Param('contentId') contentId: string) {
    return prisma.qualityCheck.findFirst({
      where: { contentId },
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

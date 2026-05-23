import {
  Controller, Get, Post, Param, UseGuards, ParseUUIDPipe, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { prisma } from '@brandflow/db';
import { ResilientPublishService } from './resilient-publish.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { type JwtPayload, type PublishJobStatus } from '@brandflow/shared';

@ApiTags('publish-jobs')
@ApiBearerAuth()
@Controller('publish/jobs')
@UseGuards(JwtAuthGuard)
export class PublishJobController {
  constructor(private readonly resilientPublishService: ResilientPublishService) {}

  @Get()
  @ApiOperation({ summary: 'List all publish jobs for the business' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: PublishJobStatus,
    @Query('platform') platform?: string,
  ) {
    return prisma.publishJob.findMany({
      where: {
        businessId: user.businessId,
        ...(status ? { status } : {}),
        ...(platform ? { socialAccount: { platform } } : {}),
      },
      include: {
        content: { select: { body: true, type: true } },
        socialAccount: { select: { name: true, platform: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific publish job' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return prisma.publishJob.findFirst({
      where: { id, businessId: user.businessId },
      include: {
        content: true,
        socialAccount: true,
        schedule: true,
      }
    });
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Manually retry a failed publish job' })
  async retry(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.resilientPublishService.retryFailedJob(id, user.businessId);
  }
}

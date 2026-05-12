import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApprovalService } from './approval.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@brandflow/shared';

@Controller('approvals')
@UseGuards(JwtAuthGuard)
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  @Get('queue')
  getQueue(
    @CurrentUser() user: JwtPayload,
    @Query('status') status: string
  ) {
    return this.approvalService.getQueue(user.businessId, status);
  }

  @Post(':id/decide')
  submitDecision(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body('status') status: 'approved' | 'rejected',
    @Body('note') note: string
  ) {
    return this.approvalService.submitDecision(id, user.businessId, status, note);
  }

  @Post('request')
  requestApproval(
    @CurrentUser() user: JwtPayload,
    @Body('contentId') contentId: string,
    @Body('reviewType') reviewType: string
  ) {
    return this.approvalService.requestApproval(user.businessId, contentId, reviewType);
  }

  @Post('bulk-approve')
  bulkApprove(
    @CurrentUser() user: JwtPayload,
    @Body('ids') ids: string[]
  ) {
    return this.approvalService.bulkApprove(ids, user.businessId);
  }
}

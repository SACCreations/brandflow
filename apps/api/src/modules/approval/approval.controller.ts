import {
  Controller, Get, Post, Body, Param, UseGuards, ParseUUIDPipe, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApprovalService } from './approval.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { submitApprovalDecisionSchema, type SubmitApprovalDecisionDto, type JwtPayload } from '@brandflow/shared';

@ApiTags('approval')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('approvals')
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  @Get()
  @ApiOperation({ summary: 'List pending approvals' })
  findPending(@CurrentUser() user: JwtPayload) {
    return this.approvalService.findPending(user.businessId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an approval record' })
  findById(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.approvalService.findById(id, user.businessId);
  }

  @Post()
  @ApiOperation({ summary: 'Request approval for content' })
  request(
    @CurrentUser() user: JwtPayload,
    @Body('contentId') contentId: string,
    @Body('reviewerId') reviewerId?: string,
    @Body('slaHours') slaHours?: number,
  ) {
    return this.approvalService.requestApproval(contentId, user.businessId, reviewerId, slaHours);
  }

  @Post(':id/decide')
  @ApiOperation({ summary: 'Approve, reject, or request revision' })
  decide(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(submitApprovalDecisionSchema)) dto: SubmitApprovalDecisionDto,
  ) {
    return this.approvalService.decide(id, user.businessId, user.sub, dto);
  }
}

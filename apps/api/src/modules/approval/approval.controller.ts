import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApprovalService } from './approval.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  bulkApprovalSchema,
  requestApprovalSchema,
  submitApprovalDecisionSchema,
  type BulkApprovalDto,
  type JwtPayload,
  type RequestApprovalDto,
  type SubmitApprovalDecisionDto,
} from '@brandflow/shared';

@ApiTags('approval')
@ApiBearerAuth()
@Controller('approvals')
@UseGuards(JwtAuthGuard)
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  @Get('queue')
  @ApiOperation({ summary: 'List approval queue items' })
  getQueue(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
  ) {
    return this.approvalService.getQueue(user.businessId, status);
  }

  @Post(':id/decide')
  @ApiOperation({ summary: 'Submit an approval decision' })
  submitDecision(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(submitApprovalDecisionSchema)) dto: SubmitApprovalDecisionDto,
  ) {
    return this.approvalService.submitDecision(
      id,
      user.businessId,
      dto.status,
      dto.note ?? undefined,
      dto.reason ?? undefined,
    );
  }

  @Post('request')
  @ApiOperation({ summary: 'Request approval for a content item' })
  requestApproval(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(requestApprovalSchema)) dto: RequestApprovalDto,
  ) {
    return this.approvalService.requestApproval(user.businessId, dto.contentId, dto.reviewType);
  }

  @Post('bulk-approve')
  @ApiOperation({ summary: 'Bulk approve review items' })
  bulkApprove(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(bulkApprovalSchema)) dto: BulkApprovalDto,
  ) {
    return this.approvalService.bulkApprove(dto.ids, user.businessId, dto.note ?? undefined);
  }
}

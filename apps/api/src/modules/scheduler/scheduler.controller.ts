import {
  Controller, Get, Post, Delete, Body, Param, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SchedulerService } from './scheduler.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { createScheduleSchema, type CreateScheduleDto, type JwtPayload } from '@brandflow/shared';

@ApiTags('scheduler')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('schedules')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Get()
  @ApiOperation({ summary: 'List scheduled posts' })
  findAll(@CurrentUser() user: JwtPayload, @Query('campaignId') campaignId?: string) {
    return this.schedulerService.findAll(user.businessId, campaignId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get schedule details' })
  findById(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.schedulerService.findById(id, user.businessId);
  }

  @Post()
  @ApiOperation({ summary: 'Schedule a post' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(createScheduleSchema)) dto: CreateScheduleDto,
  ) {
    return this.schedulerService.create(user.businessId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel a scheduled post' })
  cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.schedulerService.cancel(id, user.businessId);
  }
}

import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AutomationService } from './automation.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { createAutomationSchema, type CreateAutomationDto, type JwtPayload } from '@brandflow/shared';

@ApiTags('automation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('automations')
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Get()
  @ApiOperation({ summary: 'List automations' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.automationService.findAll(user.businessId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get automation with run history' })
  findById(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.automationService.findById(id, user.businessId);
  }

  @Post()
  @ApiOperation({ summary: 'Create an automation' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(createAutomationSchema)) dto: CreateAutomationDto,
  ) {
    return this.automationService.create(user.businessId, dto);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Toggle automation active state' })
  toggle(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.automationService.toggle(id, user.businessId);
  }

  @Post(':id/trigger')
  @ApiOperation({ summary: 'Manually trigger an automation' })
  trigger(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() payload: Record<string, unknown>,
  ) {
    return this.automationService.trigger(id, user.businessId, payload);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an automation' })
  delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.automationService.delete(id, user.businessId);
  }
}

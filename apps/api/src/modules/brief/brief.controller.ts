import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { BriefService } from './brief.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@brandflow/shared';

@Controller('briefs')
@UseGuards(JwtAuthGuard)
export class BriefController {
  constructor(private readonly briefService: BriefService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.briefService.findAll(user.businessId);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: any) {
    return this.briefService.create(user.businessId, dto);
  }

  @Post('template/:type')
  createFromTemplate(
    @CurrentUser() user: JwtPayload,
    @Param('type') type: string,
  ) {
    return this.briefService.createFromTemplate(user.businessId, type);
  }

  @Get('suggestions')
  getAiSuggestions(
    @CurrentUser() user: JwtPayload,
    @Query('field') field: string,
    @Query('context') context: string,
  ) {
    const parsedContext = context ? JSON.parse(context) : {};
    return this.briefService.getAiSuggestions(user.businessId, field, parsedContext);
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.briefService.findById(id, user.businessId);
  }

  @Get(':id/validate')
  validate(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.briefService.validate(id, user.businessId);
  }
}

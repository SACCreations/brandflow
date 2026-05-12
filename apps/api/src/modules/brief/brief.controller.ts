import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { BriefService } from './brief.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('briefs')
@UseGuards(JwtAuthGuard)
export class BriefController {
  constructor(private readonly briefService: BriefService) {}

  @Get()
  findAll(@GetUser('businessId') businessId: string) {
    return this.briefService.findAll(businessId);
  }

  @Post()
  create(@GetUser('businessId') businessId: string, @Body() dto: any) {
    return this.briefService.create(businessId, dto);
  }

  @Post('template/:type')
  createFromTemplate(
    @GetUser('businessId') businessId: string,
    @Param('type') type: string,
  ) {
    return this.briefService.createFromTemplate(businessId, type);
  }

  @Get('suggestions')
  getAiSuggestions(
    @GetUser('businessId') businessId: string,
    @Query('field') field: string,
    @Query('context') context: string,
  ) {
    const parsedContext = context ? JSON.parse(context) : {};
    return this.briefService.getAiSuggestions(businessId, field, parsedContext);
  }

  @Get(':id')
  findOne(@GetUser('businessId') businessId: string, @Param('id') id: string) {
    return this.briefService.findById(id, businessId);
  }

  @Get(':id/validate')
  validate(@GetUser('businessId') businessId: string, @Param('id') id: string) {
    return this.briefService.validate(id, businessId);
  }
}

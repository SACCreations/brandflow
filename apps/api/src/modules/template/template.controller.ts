import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TemplateService } from './template.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@brandflow/shared';

@ApiTags('template')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('templates')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Get()
  @ApiOperation({ summary: 'List templates (platform + workspace)' })
  findAll(@CurrentUser() user: JwtPayload, @Query('platform') platform?: string) {
    return this.templateService.findAll(user.businessId, platform);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a template' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.templateService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a template' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() data: { name: string; type: string; body: string; placeholders?: Record<string, unknown> },
  ) {
    return this.templateService.create(user.businessId, data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a template' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() data: { name?: string; structure?: Record<string, unknown>; isActive?: boolean },
  ) {
    return this.templateService.update(id, user.businessId, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate a template' })
  delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.templateService.delete(id, user.businessId);
  }
}

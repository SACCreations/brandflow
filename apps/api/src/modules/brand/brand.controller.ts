import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BrandService } from './brand.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  createBrandSchema,
  updateBrandSchema,
  connectSocialAccountSchema,
  type CreateBrandDto,
  type UpdateBrandDto,
  type ConnectSocialAccountDto,
  type JwtPayload,
} from '@brandflow/shared';

@ApiTags('brand')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('brands')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Get()
  @ApiOperation({ summary: 'List all brands in the workspace' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.brandService.findAll(user.businessId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a brand by ID' })
  findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.brandService.findById(id, user.businessId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new brand' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(createBrandSchema)) dto: CreateBrandDto,
  ) {
    try {
      return await this.brandService.create(user.businessId, dto);
    } catch (error: any) {
      require('fs').writeFileSync('error.log', String(error) + '\\n' + (error.stack || ''));
      throw error;
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a brand' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(updateBrandSchema)) dto: UpdateBrandDto,
  ) {
    return this.brandService.update(id, user.businessId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a brand (soft delete)' })
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.brandService.delete(id, user.businessId);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted brand' })
  restore(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.brandService.restore(id, user.businessId);
  }

  @Get(':id/context')
  @ApiOperation({ summary: 'Get brand context including knowledge entries (for AI)' })
  getContext(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.brandService.getBrandContext(id, user.businessId);
  }

  @Post('connect-social')
  @ApiOperation({ summary: 'Connect a social account (simulated for demo)' })
  connectSocial(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(connectSocialAccountSchema)) dto: ConnectSocialAccountDto,
  ) {
    return this.brandService.connectSocial(user.businessId, dto.platform);
  }

  @Post('ai/generate-tagline')
  @ApiOperation({ summary: 'Generate a tagline using AI' })
  async generateTagline(@Body() data: any) {
    return this.brandService.generateTagline(data);
  }

  @Post('ai/expand-description')
  @ApiOperation({ summary: 'Expand description using AI' })
  async expandDescription(@Body() data: any) {
    return this.brandService.expandDescription(data);
  }
}

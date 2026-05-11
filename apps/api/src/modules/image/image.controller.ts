import {
  Controller, Get, Post, Body, UseGuards, Query, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ImageService } from './image.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@brandflow/shared';

@ApiTags('image')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('images')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Get()
  @ApiOperation({ summary: 'List uploaded assets' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.imageService.findAll(user.businessId);
  }

  @Post('upload-url')
  @ApiOperation({ summary: 'Get presigned URL for direct upload' })
  getUploadUrl(
    @CurrentUser() user: JwtPayload,
    @Body('filename') filename: string,
    @Body('contentType') contentType: string,
  ) {
    return this.imageService.getPresignedUploadUrl(user.businessId, filename, contentType);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register an uploaded asset' })
  register(
    @CurrentUser() user: JwtPayload,
    @Body() data: { key: string; fileName: string; mimeType: string },
  ) {
    return this.imageService.registerAsset(user.businessId, data);
  }
}

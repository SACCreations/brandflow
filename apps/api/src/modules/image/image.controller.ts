import {
  Controller, Get, Post, Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ImageService } from './image.service';
import { CreativeGenerationService } from './creative-generation.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@brandflow/shared';

@ApiTags('image')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('images')
export class ImageController {
  constructor(
    private readonly imageService: ImageService,
    private readonly creativeGenService: CreativeGenerationService,
  ) {}

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

  @Post('generate')
  @ApiOperation({ summary: 'Schedule an asynchronous background image generation job' })
  async generateImage(
    @CurrentUser() user: JwtPayload,
    @Body() data: {
      brandId: string;
      campaignId?: string;
      prompt: string;
      category: string;
      settings?: {
        width?: number;
        height?: number;
        aspectRatio?: string;
        style?: string;
        quality?: 'standard' | 'hd';
        provider?: string;
      };
    },
  ) {
    const width = data.settings?.width ?? 1024;
    const height = data.settings?.height ?? 1024;
    const aspectRatio = data.settings?.aspectRatio ?? '1:1';
    const style = data.settings?.style ?? 'modern-creative';
    const quality = data.settings?.quality ?? 'standard';
    const provider = data.settings?.provider ?? 'stability';

    return this.creativeGenService.createGenerationJob(
      user.businessId,
      data.brandId,
      data.campaignId,
      data.prompt,
      data.category,
      {
        width,
        height,
        aspectRatio,
        style,
        quality,
        provider,
      },
    );
  }

  @Get('jobs')
  @ApiOperation({ summary: 'List background image generation jobs' })
  async listJobs(@CurrentUser() user: JwtPayload) {
    return this.creativeGenService.findAllJobs(user.businessId);
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get details and status of a background generation job' })
  async getJob(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.creativeGenService.getJobStatus(user.businessId, id);
  }
}

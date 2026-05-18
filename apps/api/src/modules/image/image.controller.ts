import {
  Controller, Get, Post, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ImageService } from './image.service';
import { CreativeGenerationService } from './creative-generation.service';
import { CanvasService } from './canvas.service';
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
    private readonly canvasService: CanvasService,
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

  // ─── CANVAS LAYOUT TEMPLATES ─────────────────────────────────────
  @Post('templates')
  @ApiOperation({ summary: 'Save or update a canvas layout template' })
  saveTemplate(
    @CurrentUser() user: JwtPayload,
    @Body() data: {
      id?: string;
      name: string;
      category: string;
      dimensions: { width: number; height: number };
      canvasLayers: any[];
      brandId?: string;
      previewUrl?: string;
    },
  ) {
    return this.canvasService.saveTemplate(user.businessId, data);
  }

  @Get('templates')
  @ApiOperation({ summary: 'List all layout templates' })
  getTemplates(
    @CurrentUser() user: JwtPayload,
    @Query('brandId') brandId?: string,
  ) {
    return this.canvasService.getTemplates(user.businessId, brandId);
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get details of a specific layout template' })
  getTemplate(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.canvasService.getTemplate(user.businessId, id);
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Delete a layout template' })
  deleteTemplate(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.canvasService.deleteTemplate(user.businessId, id);
  }

  // ─── AUTOSAVES & LAYER HISTORY SESSIONS ─────────────────────────
  @Post('edits')
  @ApiOperation({ summary: 'Autosave layers snapshot for active canvas design' })
  saveImageEdit(
    @CurrentUser() user: JwtPayload,
    @Body() data: {
      imageId: string;
      layersSnapshot: any[];
      historyIndex: number;
    },
  ) {
    return this.canvasService.saveImageEdit(user.businessId, user.sub, data);
  }

  @Get('edits/:imageId')
  @ApiOperation({ summary: 'Get saved layer snapshot and edit history for canvas' })
  getImageEdit(
    @CurrentUser() user: JwtPayload,
    @Param('imageId') imageId: string,
  ) {
    return this.canvasService.getImageEdit(user.businessId, imageId);
  }

  // ─── CANVAS EXPORT & DELIVERABLE REGISTER ───────────────────────
  @Post('export')
  @ApiOperation({ summary: 'Compile flat canvas layers and upload/register CDN deliverable' })
  exportCanvas(
    @CurrentUser() user: JwtPayload,
    @Body() data: {
      imageId: string;
      layers: any[];
      format: 'png' | 'webp' | 'jpeg';
      quality?: 'standard' | 'high';
      filename?: string;
    },
  ) {
    return this.canvasService.exportCanvas(user.businessId, data);
  }
}

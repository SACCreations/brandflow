import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../common/database/prisma.service';
import type { GeneratePosterDto } from './dto/generate-poster.dto';
import { PlatformDimensionService } from './services/platform-dimension.service';

const IMAGE_GENERATION_QUEUE = 'image-generation';

@Injectable()
export class CreativeGenerationService {
  private readonly logger = new Logger(CreativeGenerationService.name);

  constructor(
    @InjectQueue(IMAGE_GENERATION_QUEUE) private readonly imageQueue: Queue,
    private readonly prisma: PrismaService,
    private readonly platformDimensionService: PlatformDimensionService,
  ) {}

  /**
   * Creates a brand-aware poster generation job.
   * This is the new primary entry point for AI image generation.
   * Accepts structured marketing data (platform, headline, CTA) instead of a raw prompt.
   */
  async createPosterJob(businessId: string, dto: GeneratePosterDto) {
    const brand = await this.prisma.client.brand.findFirst({
      where: { id: dto.brandId, businessId, deletedAt: null },
    });
    if (!brand) throw new NotFoundException('Brand not found');

    // Resolve official platform dimensions
    const platformSpec = this.platformDimensionService.getDimensions(dto.platform);

    // Poster context: structured marketing fields passed through to the queue processor
    const posterContext = {
      headline:          dto.headline,
      subheadline:       dto.subheadline,
      cta:               dto.cta,
      additionalContext: dto.additionalContext,
    };

    // Human-readable rawPrompt (shown in the UI job list)
    const rawPrompt = dto.headline
      ? `${dto.category} for ${platformSpec.label}: "${dto.headline}"`
      : `${dto.category} for ${platformSpec.label}`;

    const job = await this.prisma.client.imageGenerationJob.create({
      data: {
        businessId,
        brandId:    dto.brandId,
        campaignId: dto.campaignId ?? null,
        contentId:  dto.contentId  ?? null,
        category:   dto.category,
        platform:   dto.platform,
        rawPrompt,
        posterContext: posterContext as any,
        settings: {
          width:              platformSpec.width,
          height:             platformSpec.height,
          aspectRatio:        platformSpec.aspectRatio,
          style:              dto.settings?.style,
          quality:            dto.settings?.quality || 'standard',
          provider:           dto.settings?.provider || 'openai',
          negativePromptExtra: dto.settings?.negativePromptExtra,
        } as any,
        status:   'PENDING',
        progress: 0,
      },
    });

    this.logger.log(
      `[CreativeGenerationService] Created poster job ${job.id} for business ${businessId} ` +
      `(platform=${dto.platform}, category=${dto.category}). Queuing...`
    );

    await this.imageQueue.add(
      'generate-poster',
      {
        jobId:         job.id,
        businessId,
        brandId:       dto.brandId,
        contentId:     dto.contentId,
        campaignId:    dto.campaignId,
        platform:      dto.platform,
        category:      dto.category,
        posterContext,
        settings:      job.settings,
      },
      {
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );

    return job;
  }

  /**
   * @deprecated Use createPosterJob() instead.
   * Legacy method kept for backward compatibility with older queue jobs.
   */
  async createGenerationJob(
    businessId: string,
    brandId: string,
    campaignId: string | undefined,
    rawPrompt: string,
    category: string,
    settings: {
      width: number;
      height: number;
      aspectRatio: string;
      style?: string;
      quality?: 'standard' | 'hd';
      provider?: string;
    },
  ) {
    const brand = await this.prisma.client.brand.findFirst({
      where: { id: brandId, businessId },
    });
    if (!brand) throw new NotFoundException('Brand not found');

    const job = await this.prisma.client.imageGenerationJob.create({
      data: {
        businessId,
        brandId,
        campaignId,
        category,
        rawPrompt,
        settings: settings as any,
        status:   'PENDING',
        progress: 0,
      },
    });

    this.logger.log(`[CreativeGenerationService] Created legacy job ${job.id} for business ${businessId}. Queuing...`);

    await this.imageQueue.add(
      'generate-image',
      { jobId: job.id, businessId, brandId, campaignId, rawPrompt, category, settings },
      { attempts: 2, backoff: { type: 'exponential', delay: 5000 } },
    );

    return job;
  }

  /** Retrieves the current status and progress of a generation job. */
  async getJobStatus(businessId: string, jobId: string) {
    const job = await this.prisma.client.imageGenerationJob.findFirst({
      where: { id: jobId, businessId },
      include: { images: { include: { asset: true } } },
    });
    if (!job) throw new NotFoundException('Generation job not found');
    return job;
  }

  /** Lists all generation jobs for a business workspace. */
  async findAllJobs(businessId: string) {
    return this.prisma.client.imageGenerationJob.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      include: { images: { include: { asset: true } } },
    });
  }

  /** Deletes a specific generation job. */
  async deleteJob(businessId: string, jobId: string) {
    const job = await this.prisma.client.imageGenerationJob.findFirst({
      where: { id: jobId, businessId },
    });
    if (!job) throw new NotFoundException('Generation job not found');

    await this.prisma.client.imageGenerationJob.delete({
      where: { id: jobId },
    });
    return { success: true };
  }
}

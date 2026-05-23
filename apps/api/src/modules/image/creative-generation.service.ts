import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../common/database/prisma.service';

const IMAGE_GENERATION_QUEUE = 'image-generation';

@Injectable()
export class CreativeGenerationService {
  private readonly logger = new Logger(CreativeGenerationService.name);

  constructor(
    @InjectQueue(IMAGE_GENERATION_QUEUE) private readonly imageQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Creates a background image generation job and queues it.
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
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    const job = await this.prisma.client.imageGenerationJob.create({
      data: {
        businessId,
        brandId,
        campaignId,
        category,
        rawPrompt,
        settings: settings as any,
        status: 'PENDING',
        progress: 0,
      },
    });

    this.logger.log(`[CreativeGenerationService] Created job ${job.id} for business ${businessId}. Queueing...`);

    await this.imageQueue.add(
      'generate-image',
      {
        jobId: job.id,
        businessId,
        brandId,
        campaignId,
        rawPrompt,
        category,
        settings,
      },
      {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );

    return job;
  }

  /**
   * Retrieves the current status and progress of a generation job.
   */
  async getJobStatus(businessId: string, jobId: string) {
    const job = await this.prisma.client.imageGenerationJob.findFirst({
      where: { id: jobId, businessId },
      include: {
        images: {
          include: {
            asset: true,
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Generation job not found');
    }

    return job;
  }

  /**
   * Lists all generation jobs for a business workspace.
   */
  async findAllJobs(businessId: string) {
    return this.prisma.client.imageGenerationJob.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      include: {
        images: {
          include: {
            asset: true,
          },
        },
      },
    });
  }
}

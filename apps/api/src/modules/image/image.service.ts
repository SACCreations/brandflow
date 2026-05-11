import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { prisma } from '@brandflow/db';
import * as crypto from 'node:crypto';

@Injectable()
export class ImageService {
  private readonly bucket: string;
  private readonly endpoint: string;
  private readonly accessKey: string;
  private readonly secretKey: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = config.get<string>('s3.bucket', 'brandflow');
    this.endpoint = config.get<string>('s3.endpoint', '');
    this.accessKey = config.get<string>('s3.accessKeyId', '');
    this.secretKey = config.get<string>('s3.secretAccessKey', '');
  }

  /**
   * Phase 2: Full image generation pipeline (DALL-E / Stable Diffusion).
   * MVP: returns a presigned upload URL for direct-to-S3 uploads.
   */
  async getPresignedUploadUrl(businessId: string, filename: string, contentType: string) {
    if (!this.endpoint) {
      throw new ServiceUnavailableException('S3/MinIO is not configured');
    }

    // Sanitize filename and generate a unique key
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `${businessId}/${crypto.randomUUID()}/${safeFilename}`;

    // For MVP: return the key — actual presigned URL generation requires @aws-sdk/s3-request-presigner
    // This will be wired in Phase 2 when image generation is implemented
    return { key, uploadUrl: `${this.endpoint}/${this.bucket}/${key}` };
  }

  async findAll(businessId: string) {
    return prisma.asset.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async registerAsset(businessId: string, data: { key: string; fileName: string; mimeType: string }) {
    return prisma.asset.create({
      data: {
        businessId,
        fileName: data.fileName,
        s3Key: data.key,
        type: data.mimeType.startsWith('image/') ? 'image' : 'file',
        mimeType: data.mimeType,
      },
    });
  }
}

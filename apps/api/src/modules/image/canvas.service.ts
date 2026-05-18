import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@brandflow/db';
import { ImageService } from './image.service';

@Injectable()
export class CanvasService {
  constructor(private readonly imageService: ImageService) {}

  /**
   * Saves a new layout template or updates an existing one for the business/brand.
   */
  async saveTemplate(
    businessId: string,
    data: {
      id?: string;
      name: string;
      category: string;
      dimensions: { width: number; height: number };
      canvasLayers: any[];
      brandId?: string;
      previewUrl?: string;
    },
  ) {
    if (data.id) {
      // Update existing template
      const existing = await prisma.imageTemplate.findFirst({
        where: { id: data.id, OR: [{ businessId }, { businessId: null }] },
      });
      if (!existing) throw new NotFoundException('Template not found');

      return prisma.imageTemplate.update({
        where: { id: data.id },
        data: {
          name: data.name,
          category: data.category,
          dimensions: data.dimensions as any,
          canvasLayers: data.canvasLayers as any,
          brandId: data.brandId || null,
          previewUrl: data.previewUrl || existing.previewUrl,
        },
      });
    }

    // Create new template
    return prisma.imageTemplate.create({
      data: {
        businessId,
        brandId: data.brandId || null,
        name: data.name,
        category: data.category,
        dimensions: data.dimensions as any,
        canvasLayers: data.canvasLayers as any,
        previewUrl: data.previewUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=340&auto=format&fit=crop',
      },
    });
  }

  /**
   * Lists all available templates for a business/brand.
   * Includes global templates (businessId = null).
   */
  async getTemplates(businessId: string, brandId?: string) {
    return prisma.imageTemplate.findMany({
      where: {
        OR: [
          { businessId },
          { businessId: null }, // Global templates
        ],
        ...(brandId ? { brandId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Retrieves a template by ID.
   */
  async getTemplate(businessId: string, id: string) {
    const template = await prisma.imageTemplate.findFirst({
      where: { id, OR: [{ businessId }, { businessId: null }] },
    });
    if (!template) throw new NotFoundException('Layout template not found');
    return template;
  }

  /**
   * Deletes a template.
   */
  async deleteTemplate(businessId: string, id: string) {
    const template = await prisma.imageTemplate.findFirst({
      where: { id, businessId },
    });
    if (!template) throw new NotFoundException('Layout template not found');

    await prisma.imageTemplate.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Persists design layers snapshot and history indexing for autosaves and undos/redos.
   */
  async saveImageEdit(
    businessId: string,
    userId: string,
    data: {
      imageId: string;
      layersSnapshot: any[];
      historyIndex: number;
    },
  ) {
    const existing = await prisma.imageEdit.findFirst({
      where: { imageId: data.imageId, businessId },
    });

    if (existing) {
      return prisma.imageEdit.update({
        where: { id: existing.id },
        data: {
          layersSnapshot: data.layersSnapshot as any,
          historyIndex: data.historyIndex,
          userId,
        },
      });
    }

    return prisma.imageEdit.create({
      data: {
        businessId,
        userId,
        imageId: data.imageId,
        layersSnapshot: data.layersSnapshot as any,
        historyIndex: data.historyIndex,
      },
    });
  }

  /**
   * Gets active layer snapshots and position metrics for an image layout.
   */
  async getImageEdit(businessId: string, imageId: string) {
    const edit = await prisma.imageEdit.findFirst({
      where: { imageId, businessId },
    });
    if (!edit) throw new NotFoundException('No active edit session for this image');
    return edit;
  }

  /**
   * Compiles layers, simulates S3/CDN upload, and registers the compiled asset.
   */
  async exportCanvas(
    businessId: string,
    data: {
      imageId: string;
      layers: any[];
      format: 'png' | 'webp' | 'jpeg';
      quality?: 'standard' | 'high';
      filename?: string;
    },
  ) {
    // 1. Verify source image exists
    const image = await prisma.generatedImage.findFirst({
      where: { id: data.imageId, businessId },
    });
    if (!image) throw new NotFoundException('Source image asset not found');

    // 2. Compile simulated CDN address
    const randomHash = Math.random().toString(36).substring(7);
    const finalFilename = data.filename || `export_${data.imageId}_${randomHash}.${data.format}`;
    const cdnUrl = `https://cdn.brandflow.ai/tenants/${businessId}/exports/${finalFilename}`;

    // 3. Register as a production-ready Asset deliverable
    const asset = await this.imageService.registerAsset(businessId, {
      key: `exports/${finalFilename}`,
      fileName: finalFilename,
      mimeType: `image/${data.format}`,
    });

    // 4. Log the audit trail for enterprise tracking
    await prisma.auditLog.create({
      data: {
        businessId,
        action: 'canvas_export',
        entityType: 'asset',
        entityId: asset.id,
        before: { imageId: data.imageId, layersCount: data.layers.length },
        after: { cdnUrl, format: data.format, assetId: asset.id },
        hash: `exp-${Math.random().toString(36).substring(2, 10)}`,
      },
    });

    return {
      success: true,
      asset,
      cdnUrl,
      format: data.format,
      compiledLayers: data.layers.length,
    };
  }
}

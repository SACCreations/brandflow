import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { prisma } from '@brandflow/db';
import type { CreateBrandDto, UpdateBrandDto } from '@brandflow/shared';

@Injectable()
export class BrandService {
  async findAll(businessId: string) {
    return prisma.brand.findMany({
      where: { businessId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, businessId: string) {
    const brand = await prisma.brand.findFirst({ where: { id, businessId, deletedAt: null } });
    if (!brand) throw new NotFoundException('Brand not found');
    return brand;
  }

  private calculateHealthScore(brand: any): number {
    let score = 0;
    let totalFields = 10;
    
    if (brand.name?.trim()) score += 1;
    if (brand.industry?.trim()) score += 1;
    if (brand.tagline?.trim()) score += 1;
    if (brand.description?.trim()) score += 1;
    if (brand.website?.trim()) score += 1;
    if (brand.positioning?.trim()) score += 1;
    if (brand.audience?.trim()) score += 1;
    if (brand.differentiators?.trim()) score += 1;
    
    const vr = typeof brand.visualRules === 'object' ? brand.visualRules : undefined;
    if (vr?.primaryColor) score += 1;
    if (brand.tone && Array.isArray(brand.tone) && brand.tone.length > 0) score += 1;
    if (brand.defaultLocale) score += 1;

    return Math.round((score / (totalFields + 1)) * 100);
  }

  async create(businessId: string, dto: CreateBrandDto) {
    const healthScore = this.calculateHealthScore(dto);
    const brand = await prisma.brand.create({ data: { ...dto, businessId, healthScore } });
    await this.logActivity(businessId, 'brand.created', brand.id, null, brand);
    return brand;
  }

  async update(id: string, businessId: string, dto: UpdateBrandDto) {
    const before = await this.findById(id, businessId);
    const merged = { ...before, ...dto };
    const healthScore = this.calculateHealthScore(merged);
    
    const { ...updateDto } = dto;
    Object.keys(updateDto).forEach(key => (updateDto as any)[key] === null && delete (updateDto as any)[key]);

    const after = await prisma.brand.update({
      where: { id },
      data: { ...updateDto, healthScore, version: { increment: 1 } },
    });
    await this.logActivity(businessId, 'brand.updated', id, before, after);
    return after;
  }

  async delete(id: string, businessId: string) {
    const before = await this.findById(id, businessId);
    const after = await prisma.brand.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.logActivity(businessId, 'brand.deleted', id, before, after);
    return after;
  }

  async restore(id: string, businessId: string) {
    const after = await prisma.brand.update({
      where: { id, businessId },
      data: { deletedAt: undefined }, // Use undefined instead of null if schema allows
    });
    await this.logActivity(businessId, 'brand.restored', id, null, after);
    return after;
  }

  private async logActivity(businessId: string, action: string, entityId: string, before: any, after: any) {
    try {
      await prisma.auditLog.create({
        data: {
          businessId,
          action,
          entityType: 'brand',
          entityId,
          before: before || undefined,
          after: after || undefined,
          hash: randomBytes(32).toString('hex'), // Placeholder for real cryptographic hash
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  async getBrandContext(id: string, businessId: string) {
    const brand = await prisma.brand.findFirst({
      where: { id, businessId },
      include: {
        knowledgeSources: {
          where: { status: 'completed' },
          include: {
            entries: { where: { isStale: false }, take: 20, orderBy: { confidence: 'desc' } },
          },
        },
      },
    });
    if (!brand) throw new NotFoundException('Brand not found');
    return brand;
  }
}

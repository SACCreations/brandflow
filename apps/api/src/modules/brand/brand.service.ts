import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { AuditService } from '../business/audit.service';
import type { CreateBrandDto, UpdateBrandDto } from '@brandflow/shared';

@Injectable()
export class BrandService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}
  async findAll(businessId: string) {
    return this.prisma.client.brand.findMany({
      where: { businessId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, businessId: string) {
    const brand = await this.prisma.client.brand.findFirst({ where: { id, businessId, deletedAt: null } });
    if (!brand) throw new NotFoundException('Brand not found');
    return brand;
  }

  private calculateHealthScore(brand: any): number {
    let score = 0;
    const weights = {
      basic: 1,      // name, industry, tagline, description, website
      strategy: 2,   // positioning, audience, strategy object
      visuals: 2,    // visualRules, tone
      competitors: 1,
      contact: 1
    };

    let totalPossible = 0;

    // Basic Details (5 points)
    if (brand.name?.trim()) score += weights.basic; totalPossible += weights.basic;
    if (brand.industry?.trim()) score += weights.basic; totalPossible += weights.basic;
    if (brand.tagline?.trim()) score += weights.basic; totalPossible += weights.basic;
    if (brand.description?.trim()) score += weights.basic; totalPossible += weights.basic;
    if (brand.website?.trim()) score += weights.basic; totalPossible += weights.basic;

    // Strategy & Intelligence (6 points)
    if (brand.positioning?.trim()) score += weights.strategy; totalPossible += weights.strategy;
    if (brand.audience?.trim()) score += weights.strategy; totalPossible += weights.strategy;
    
    const strategy = typeof brand.strategy === 'object' ? brand.strategy : undefined;
    if (strategy?.targetLocation || strategy?.interests) score += weights.strategy;
    totalPossible += weights.strategy;

    // Visuals & Voice (4 points)
    const vr = typeof brand.visualRules === 'object' ? brand.visualRules : undefined;
    if (vr?.primaryColor && vr?.fontFamily) score += weights.visuals;
    totalPossible += weights.visuals;

    if (brand.tone && (Array.isArray(brand.tone) ? brand.tone.length > 0 : !!brand.tone)) score += weights.visuals;
    totalPossible += weights.visuals;

    // Market context (1 point)
    if (brand.competitors && Array.isArray(brand.competitors) && brand.competitors.length > 0) score += weights.competitors;
    totalPossible += weights.competitors;

    // Contact info (1 point)
    if (brand.contactInfo?.personName || brand.contactInfo?.email) score += weights.contact;
    totalPossible += weights.contact;

    return Math.round((score / totalPossible) * 100);
  }

  async create(businessId: string, dto: CreateBrandDto) {
    const healthScore = this.calculateHealthScore(dto);
    const slug = dto.slug?.trim() || dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const brand = await this.prisma.client.brand.create({
      data: {
        ...dto,
        slug: slug || null,
        businessId,
        healthScore
      } as any
    });
    await this.logActivity(businessId, 'brand.created', brand.id, null, brand);
    return brand;
  }

  async update(id: string, businessId: string, dto: UpdateBrandDto) {
    const before = await this.findById(id, businessId);
    const merged = { ...before, ...dto };
    const healthScore = this.calculateHealthScore(merged);
    
    const { ...updateDto } = dto;
    Object.keys(updateDto).forEach(key => (updateDto as any)[key] === null && delete (updateDto as any)[key]);

    if (updateDto.slug !== undefined) {
      const nameForSlug = updateDto.name || before.name;
      updateDto.slug = updateDto.slug?.trim() || nameForSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (!updateDto.slug) {
        updateDto.slug = null;
      }
    }

    const after = await this.prisma.client.brand.update({
      where: { id },
      data: { ...updateDto, healthScore, version: { increment: 1 } } as any,
    });
    await this.logActivity(businessId, 'brand.updated', id, before, after);
    return after;
  }

  async delete(id: string, businessId: string) {
    const before = await this.findById(id, businessId);
    const after = await this.prisma.client.brand.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.logActivity(businessId, 'brand.deleted', id, before, after);
    return after;
  }

  async restore(id: string, businessId: string) {
    const after = await this.prisma.client.brand.update({
      where: { id, businessId },
      data: { deletedAt: undefined }, // Use undefined instead of null if schema allows
    });
    await this.logActivity(businessId, 'brand.restored', id, null, after);
    return after;
  }

  private async logActivity(businessId: string, action: string, entityId: string, before: any, after: any) {
    await this.auditService.log({
      businessId,
      action,
      entityType: 'brand',
      entityId,
      before,
      after,
    });
  }

  async getBrandContext(id: string, businessId: string) {
    const brand = await this.prisma.client.brand.findFirst({
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

  async connectSocial(businessId: string, platform: string) {
    return this.prisma.client.socialAccount.create({
      data: {
        businessId,
        platform,
        accountType: 'business',
        externalId: `ext_${platform}_${Math.random().toString(36).substring(7)}`,
        name: `Connected ${platform} Account`,
        accessToken: 'simulated_token',
      },
    });
  }
}

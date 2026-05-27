import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@brandflow/db';
import { PrismaService } from '../../common/database/prisma.service';
import { AuditService } from '../business/audit.service';
import type { CreateBrandDto, UpdateBrandDto } from '@brandflow/shared';

@Injectable()
export class BrandService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}
  private mapBrandToDto(brand: any) {
    if (brand && typeof brand.visualRules === 'object' && brand.visualRules !== null) {
      if (brand.visualRules.assetCatalog) {
        brand.assetCatalog = brand.visualRules.assetCatalog;
        delete brand.visualRules.assetCatalog;
      }
      if (brand.visualRules.brandIntelligenceScore) {
        brand.brandIntelligenceScore = brand.visualRules.brandIntelligenceScore;
        delete brand.visualRules.brandIntelligenceScore;
      }
    }
    return brand;
  }

  async findAll(businessId: string) {
    const brands = await this.prisma.client.brand.findMany({
      where: { businessId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return brands.map(b => this.mapBrandToDto(b));
  }

  async findById(id: string, businessId: string) {
    const brand = await this.prisma.client.brand.findFirst({ where: { id, businessId, deletedAt: null } });
    if (!brand) throw new NotFoundException('Brand not found');
    return this.mapBrandToDto(brand);
  }

  private calculateHealthScore(brand: any): number {
    let score = 0;
    const weights = {
      basic: 1,      // name, industry, tagline, description, website
      strategy: 2,   // positioning, audience, strategy object
      visuals: 2,    // visualRules, tone
      competitors: 1,
      contact: 1,
      knowledge: 2   // has linked knowledge sources with entries
    };

    let totalPossible = 0;

    // Basic Details (5 points)
    totalPossible += weights.basic;
    if (brand.name?.trim()) score += weights.basic;
    totalPossible += weights.basic;
    if (brand.industry?.trim()) score += weights.basic;
    totalPossible += weights.basic;
    if (brand.tagline?.trim()) score += weights.basic;
    totalPossible += weights.basic;
    if (brand.description?.trim()) score += weights.basic;
    totalPossible += weights.basic;
    if (brand.website?.trim()) score += weights.basic;

    // Strategy & Intelligence (6 points)
    totalPossible += weights.strategy;
    if (brand.positioning && typeof brand.positioning === 'string' && brand.positioning.trim()) score += weights.strategy;
    totalPossible += weights.strategy;
    if (brand.audience) {
      if (typeof brand.audience === 'string' && brand.audience.trim()) score += weights.strategy;
      else if (typeof brand.audience === 'object' && Object.keys(brand.audience).length > 0) score += weights.strategy;
    }
    
    const strategy = typeof brand.strategy === 'object' ? brand.strategy : undefined;
    totalPossible += weights.strategy;
    if (strategy?.targetLocation || strategy?.interests) score += weights.strategy;

    // Visuals & Voice (4 points)
    const vr = typeof brand.visualRules === 'object' ? brand.visualRules : undefined;
    totalPossible += weights.visuals;
    if (vr?.primaryColor && vr?.fontFamily) score += weights.visuals;

    totalPossible += weights.visuals;
    if (brand.tone && (Array.isArray(brand.tone) ? brand.tone.length > 0 : !!brand.tone)) score += weights.visuals;

    // Market context (1 point)
    totalPossible += weights.competitors;
    if (brand.competitors && Array.isArray(brand.competitors) && brand.competitors.length > 0) score += weights.competitors;

    // Contact info (1 point)
    totalPossible += weights.contact;
    if (brand.contactInfo?.personName || brand.contactInfo?.email) score += weights.contact;

    // Knowledge dimension (2 points) — awarded if brand has linked knowledge
    totalPossible += weights.knowledge;
    if (brand._knowledgeEntryCount && brand._knowledgeEntryCount >= 5) score += weights.knowledge;

    return Math.round((score / totalPossible) * 100);
  }

  async create(businessId: string, dto: CreateBrandDto) {
    const healthScore = this.calculateHealthScore(dto);
    const slug = dto.slug?.trim() || dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const { slug: _slug, assetCatalog, brandIntelligenceScore, ...rest } = dto as any;
    
    if (rest.audience && typeof rest.audience === 'object') {
      rest.audience = JSON.stringify(rest.audience);
    }
    
    if (assetCatalog || brandIntelligenceScore) {
      rest.visualRules = typeof rest.visualRules === 'object' && rest.visualRules !== null ? rest.visualRules : {};
      if (assetCatalog) rest.visualRules.assetCatalog = assetCatalog;
      if (brandIntelligenceScore) rest.visualRules.brandIntelligenceScore = brandIntelligenceScore;
    }
    
    // Ensure slug uniqueness
    let finalSlug = slug;
    if (finalSlug) {
      let counter = 1;
      let existing = await this.prisma.client.brand.findUnique({
        where: { businessId_slug: { businessId, slug: finalSlug } }
      });
      while (existing) {
        finalSlug = `${slug}-${Math.floor(Math.random() * 10000)}`;
        existing = await this.prisma.client.brand.findUnique({
          where: { businessId_slug: { businessId, slug: finalSlug } }
        });
        counter++;
        if (counter > 10) break;
      }
    }

    const brand = await this.prisma.client.brand.create({
      data: {
        ...rest,
        slug: finalSlug || null,
        businessId,
        healthScore,
      } as Prisma.BrandUncheckedCreateInput
    });
    await this.logActivity(businessId, 'brand.created', brand.id, null, brand);
    return brand;
  }

  async update(id: string, businessId: string, dto: UpdateBrandDto) {
    const before = await this.findById(id, businessId);
    // Fetch knowledge entry count for health score calculation
    const knowledgeEntryCount = await this.prisma.client.knowledgeEntry.count({
      where: { source: { brandId: id, businessId }, isStale: false },
    });
    const merged = { ...before, ...dto, _knowledgeEntryCount: knowledgeEntryCount };
    const healthScore = this.calculateHealthScore(merged);
    
    const { assetCatalog, brandIntelligenceScore, ...updateDto } = dto as any;
    Object.keys(updateDto).forEach(key => {
      if ((updateDto as Record<string, unknown>)[key] === null) {
        delete (updateDto as Record<string, unknown>)[key];
      }
    });

    if (updateDto.audience && typeof updateDto.audience === 'object') {
      updateDto.audience = JSON.stringify(updateDto.audience);
    }

    if (assetCatalog || brandIntelligenceScore) {
      updateDto.visualRules = typeof updateDto.visualRules === 'object' && updateDto.visualRules !== null ? updateDto.visualRules : (before.visualRules || {});
      if (assetCatalog) (updateDto.visualRules as any).assetCatalog = assetCatalog;
      if (brandIntelligenceScore) (updateDto.visualRules as any).brandIntelligenceScore = brandIntelligenceScore;
    }

    if (updateDto.slug !== undefined) {
      const nameForSlug = updateDto.name || before.name;
      updateDto.slug = updateDto.slug?.trim() || nameForSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (!updateDto.slug) {
        updateDto.slug = null;
      }
    }

    const after = await this.prisma.client.brand.update({
      where: { id },
      data: { ...updateDto, healthScore, version: { increment: 1 } } as Prisma.BrandUncheckedUpdateInput,
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
      data: { deletedAt: null },
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
    
    // Map entries so the UI can easily display them under brandContext.knowledgeEntries
    const knowledgeEntries = brand.knowledgeSources.flatMap(ks => ks.entries);
    
    return {
      ...brand,
      knowledgeEntries,
    };
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

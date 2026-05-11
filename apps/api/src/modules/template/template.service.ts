import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@brandflow/db';

@Injectable()
export class TemplateService {
  async findAll(businessId: string, platform?: string) {
    return prisma.template.findMany({
      where: {
        OR: [{ businessId }, { businessId: null }], // platform-level + workspace templates
        ...(platform ? { platform } : {}),
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const template = await prisma.template.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async create(
    businessId: string,
    data: { name: string; platform?: string; structure: Record<string, unknown>; brandId?: string },
  ) {
    return prisma.template.create({
      data: {
        businessId,
        name: data.name,
        platform: data.platform,
        structure: data.structure,
        brandId: data.brandId,
        isActive: true,
      },
    });
  }

  async update(id: string, businessId: string, data: { name?: string; structure?: Record<string, unknown>; isActive?: boolean }) {
    const template = await prisma.template.findFirst({ where: { id, businessId } });
    if (!template) throw new NotFoundException('Template not found');
    return prisma.template.update({ where: { id }, data });
  }

  async delete(id: string, businessId: string) {
    const template = await prisma.template.findFirst({ where: { id, businessId } });
    if (!template) throw new NotFoundException('Template not found');
    return prisma.template.update({ where: { id }, data: { isActive: false } });
  }
}

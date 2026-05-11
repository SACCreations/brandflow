import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@brandflow/db';
import type { CreateBrandDto, UpdateBrandDto } from '@brandflow/shared';

@Injectable()
export class BrandService {
  async findAll(businessId: string) {
    return prisma.brand.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, businessId: string) {
    const brand = await prisma.brand.findFirst({ where: { id, businessId } });
    if (!brand) throw new NotFoundException('Brand not found');
    return brand;
  }

  async create(businessId: string, dto: CreateBrandDto) {
    return prisma.brand.create({ data: { ...dto, businessId } });
  }

  async update(id: string, businessId: string, dto: UpdateBrandDto) {
    await this.findById(id, businessId);
    return prisma.brand.update({
      where: { id },
      data: { ...dto, version: { increment: 1 } },
    });
  }

  async delete(id: string, businessId: string) {
    await this.findById(id, businessId);
    await prisma.brand.delete({ where: { id } });
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

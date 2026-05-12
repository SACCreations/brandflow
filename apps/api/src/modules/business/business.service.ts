import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { prisma } from '@brandflow/db';
import type { CreateBusinessDto, UpdateBusinessDto } from '@brandflow/shared';

@Injectable()
export class BusinessService {
  async findById(id: string) {
    const business = await prisma.business.findUnique({
      where: { id },
      include: {
        subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { memberships: true, brands: true } },
      },
    });
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  async update(id: string, dto: UpdateBusinessDto) {
    if (dto.slug) {
      const existing = await prisma.business.findFirst({
        where: { slug: dto.slug, NOT: { id } },
      });
      if (existing) throw new ConflictException('Slug is already taken');
    }
    const { ...updateDto } = dto;
    Object.keys(updateDto).forEach(key => (updateDto as any)[key] === null && delete (updateDto as any)[key]);
    return prisma.business.update({ where: { id }, data: updateDto });
  }

  async getMembers(businessId: string) {
    return prisma.membership.findMany({
      where: { businessId },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true } },
        role: true,
      },
    });
  }

  async removeMember(businessId: string, userId: string) {
    await prisma.membership.delete({
      where: { userId_businessId: { userId, businessId } },
    });
  }

  async getHealthScore(businessId: string): Promise<number> {
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    return business?.healthScore ?? 0;
  }
}

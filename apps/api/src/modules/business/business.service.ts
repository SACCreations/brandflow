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
    return prisma.business.update({ where: { id }, data: updateDto as any });
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

  async inviteMember(businessId: string, email: string, roleName: string) {
    // Check if user exists
    let user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      // In a real app, send an email invite. Here we create a placeholder user.
      user = await prisma.user.create({
        data: {
          email,
          firstName: email.split('@')[0],
          lastName: 'Guest',
          // Random password for guest
          passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$unusable',
        }
      });
    }

    // Check if already a member
    const existing = await prisma.membership.findUnique({
      where: { userId_businessId: { userId: user.id, businessId } }
    });
    if (existing) throw new ConflictException('User is already a member of this workspace');

    // Find role
    let role = await prisma.role.findFirst({
      where: { businessId: null, name: roleName }
    });
    
    if (!role) {
      // Default to viewer if role not found
      role = await prisma.role.findFirst({
        where: { businessId: null, name: 'viewer' }
      });
    }

    if (!role) {
       // Create viewer role if it doesn't exist at all
       role = await prisma.role.create({
        data: { name: 'viewer', permissions: ['read:*'], isCustom: false },
      });
    }

    return prisma.membership.create({
      data: {
        userId: user.id,
        businessId,
        roleId: role.id
      },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        role: true
      }
    });
  }
}

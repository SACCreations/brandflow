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

  async getDashboardSummary(businessId: string) {
    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);

    const [
      business,
      contentCreated,
      pendingApprovals,
      postsScheduled,
      usedThisPeriod,
      recentContent,
      recentApprovals,
      recentSchedules,
      recentBrands,
      recentCampaigns,
    ] = await Promise.all([
      prisma.business.findUnique({
        where: { id: businessId },
        include: {
          subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 },
          _count: { select: { memberships: true, brands: true } },
        },
      }),
      prisma.content.count({ where: { businessId } }),
      prisma.approval.count({ where: { businessId, status: 'pending' } }),
      prisma.schedule.count({
        where: {
          businessId,
          status: 'pending',
          scheduledAt: { gte: new Date() },
        },
      }),
      prisma.costEvent.aggregate({
        where: {
          businessId,
          createdAt: { gte: periodStart },
        },
        _sum: { inputTokens: true, outputTokens: true },
      }),
      prisma.content.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        take: 4,
        select: {
          id: true,
          createdAt: true,
          platform: true,
          type: true,
          status: true,
          brand: { select: { name: true } },
        },
      }),
      prisma.approval.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        take: 4,
        select: {
          id: true,
          createdAt: true,
          status: true,
          reviewType: true,
          content: { select: { id: true, platform: true, type: true } },
        },
      }),
      prisma.schedule.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        take: 4,
        select: {
          id: true,
          createdAt: true,
          scheduledAt: true,
          status: true,
          content: { select: { id: true, platform: true, type: true } },
        },
      }),
      prisma.brand.findMany({
        where: { businessId, deletedAt: null },
        orderBy: { updatedAt: 'desc' },
        take: 3,
        select: {
          id: true,
          name: true,
          updatedAt: true,
          healthScore: true,
        },
      }),
      prisma.campaign.findMany({
        where: { businessId },
        orderBy: { updatedAt: 'desc' },
        take: 3,
        select: {
          id: true,
          name: true,
          status: true,
          updatedAt: true,
        },
      }),
    ]);

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const tokenUsageUsed = (usedThisPeriod._sum.inputTokens ?? 0) + (usedThisPeriod._sum.outputTokens ?? 0);
    const tokenUsageLimit = business.subscriptions[0]?.tokenBudget ?? 0;
    const tokenUsagePercentage = tokenUsageLimit > 0
      ? Math.min(100, Math.round((tokenUsageUsed / tokenUsageLimit) * 100))
      : 0;

    const recentActivity = [
      ...recentContent.map((item) => ({
        id: `content-${item.id}`,
        type: 'content',
        title: `${item.platform} ${item.type} created`,
        description: item.brand?.name
          ? `Draft content for ${item.brand.name}`
          : `Content moved to ${item.status}`,
        timestamp: item.createdAt,
        href: `/create/content/${item.id}`,
      })),
      ...recentApprovals.map((item) => ({
        id: `approval-${item.id}`,
        type: 'approval',
        title: `${item.reviewType} approval ${item.status}`,
        description: item.content
          ? `${item.content.platform} ${item.content.type} is in the review queue`
          : 'Approval workflow updated',
        timestamp: item.createdAt,
        href: '/review/approvals',
      })),
      ...recentSchedules.map((item) => ({
        id: `schedule-${item.id}`,
        type: 'schedule',
        title: item.status === 'published' ? 'Post published' : 'Post scheduled',
        description: item.content
          ? `${item.content.platform} ${item.content.type} set for ${new Date(item.scheduledAt).toLocaleString()}`
          : `Scheduled for ${new Date(item.scheduledAt).toLocaleString()}`,
        timestamp: item.createdAt,
        href: '/publish/calendar',
      })),
      ...recentBrands.map((item) => ({
        id: `brand-${item.id}`,
        type: 'brand',
        title: 'Brand updated',
        description: `${item.name} is now at ${item.healthScore}% health`,
        timestamp: item.updatedAt,
        href: `/intelligence/brands/${item.id}`,
      })),
      ...recentCampaigns.map((item) => ({
        id: `campaign-${item.id}`,
        type: 'campaign',
        title: 'Campaign updated',
        description: `${item.name} is currently ${item.status}`,
        timestamp: item.updatedAt,
        href: `/campaigns/${item.id}`,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);

    return {
      stats: {
        contentCreated,
        pendingApprovals,
        postsScheduled,
        tokenUsage: {
          used: tokenUsageUsed,
          limit: tokenUsageLimit,
          percentage: tokenUsagePercentage,
        },
        brands: business._count.brands,
        teamMembers: business._count.memberships,
        workspaceHealth: business.healthScore,
      },
      recentActivity,
    };
  }

  async getBillingSummary(businessId: string) {
    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);

    const [business, usageTotals, contentCreatedThisPeriod] = await Promise.all([
      prisma.business.findUnique({
        where: { id: businessId },
        include: {
          subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 },
          _count: { select: { memberships: true, brands: true, customers: true, projects: true } },
        },
      }),
      prisma.costEvent.aggregate({
        where: {
          businessId,
          createdAt: { gte: periodStart },
        },
        _sum: {
          inputTokens: true,
          outputTokens: true,
          costCents: true,
        },
      }),
      prisma.content.count({
        where: {
          businessId,
          createdAt: { gte: periodStart },
        },
      }),
    ]);

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const subscription = business.subscriptions[0] ?? null;
    const tokensUsed = (usageTotals._sum.inputTokens ?? 0) + (usageTotals._sum.outputTokens ?? 0);
    const tokenBudget = subscription?.tokenBudget ?? 0;
    const seatLimit = subscription?.seatLimit ?? 0;
    const seatsUsed = business._count.memberships;

    return {
      workspace: {
        id: business.id,
        name: business.name,
        slug: business.slug,
      },
      subscription: subscription
        ? {
            plan: subscription.plan,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
            seatLimit: subscription.seatLimit,
            tokenBudget: subscription.tokenBudget,
            stripeCustomerId: subscription.stripeCustomerId,
            stripeSubscriptionId: subscription.stripeSubscriptionId,
          }
        : null,
      usage: {
        tokensUsed,
        tokenBudget,
        tokenUsagePercentage: tokenBudget > 0 ? Math.min(100, Math.round((tokensUsed / tokenBudget) * 100)) : 0,
        costCents: usageTotals._sum.costCents ?? 0,
        inputTokens: usageTotals._sum.inputTokens ?? 0,
        outputTokens: usageTotals._sum.outputTokens ?? 0,
        seatsUsed,
        seatLimit,
        seatUsagePercentage: seatLimit > 0 ? Math.min(100, Math.round((seatsUsed / seatLimit) * 100)) : 0,
        contentCreatedThisPeriod,
      },
      resources: {
        brands: business._count.brands,
        customers: business._count.customers,
        projects: business._count.projects,
      },
    };
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

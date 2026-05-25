import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/database/prisma.service';
import Stripe from 'stripe';


export interface PlanEntitlements {
  tokenLimit: number;
  brandLimit: number;
  seatLimit: number;
  features: string[];
}

export const PLAN_ENTITLEMENTS: Record<string, PlanEntitlements> = {
  free: {
    tokenLimit: 5000, // 5,000 token credits
    brandLimit: 1,
    seatLimit: 1,
    features: ['basic_content'],
  },
  growth: {
    tokenLimit: 100000, // 100,000 token credits
    brandLimit: 5,
    seatLimit: 5,
    features: ['basic_content', 'image_generation', 'analytics', 'social_publishing'],
  },
  enterprise: {
    tokenLimit: 1000000, // 1,000,000 token credits
    brandLimit: 100,
    seatLimit: 100,
    features: ['basic_content', 'image_generation', 'analytics', 'social_publishing', 'custom_gateway', 'advanced_brand_hub'],
  },
};

@Injectable()
export class BillingService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const secretKey = this.config.get<string>('stripe.secretKey') || 'sk_test_dummy';
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-02-24.acacia',
    });
  }

  async getSubscriptionDetails(businessId: string) {
    const business = await this.prisma.client.business.findUnique({
      where: { id: businessId },
      select: {
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        plan: true,
        trialEndsAt: true,
      },
    });

    if (!business?.stripeCustomerId) {
      return {
        plan: business?.plan || 'free',
        status: 'none',
        usage: await this.getUsageStats(businessId),
      };
    }

    try {
      let subscription = null;
      if (business.stripeSubscriptionId) {
        subscription = await this.stripe.subscriptions.retrieve(business.stripeSubscriptionId);
      }

      return {
        plan: business.plan,
        status: subscription?.status || 'inactive',
        currentPeriodEnd: subscription?.current_period_end 
          ? new Date(subscription.current_period_end * 1000) 
          : null,
        usage: await this.getUsageStats(businessId),
      };
    } catch (err: any) {
      this.logger.error(`Failed to fetch Stripe subscription for ${businessId}:`, err);
      return {
        plan: business.plan,
        status: 'error',
        usage: await this.getUsageStats(businessId),
      };
    }
  }

  async checkEntitlement(businessId: string, feature: string): Promise<boolean> {
    const business = await this.prisma.client.business.findUnique({
      where: { id: businessId },
      select: { plan: true },
    });
    const planName = (business?.plan || 'free').toLowerCase();
    const entitlements = PLAN_ENTITLEMENTS[planName] ?? PLAN_ENTITLEMENTS['free']!;
    return entitlements.features.includes(feature);
  }

  async checkBrandLimit(businessId: string): Promise<void> {
    const stats = await this.getUsageStats(businessId);
    if (stats.brandsUsed >= stats.brandLimit) {
      throw new BadRequestException(`Brand limit reached. Your plan allows up to ${stats.brandLimit} brands.`);
    }
  }

  async checkTokenLimit(businessId: string, estimatedCostCents: number): Promise<void> {
    const stats = await this.getUsageStats(businessId);
    const estimatedTokens = Math.ceil(estimatedCostCents / 10);
    if (stats.tokensUsed + estimatedTokens > stats.tokenLimit) {
      throw new BadRequestException(`Token budget exceeded. Your plan limit is ${stats.tokenLimit} tokens.`);
    }
  }

  private async getUsageStats(businessId: string) {
    const business = await this.prisma.client.business.findUnique({
      where: { id: businessId },
      select: { plan: true },
    });

    const planName = (business?.plan || 'free').toLowerCase();
    const entitlements = PLAN_ENTITLEMENTS[planName] ?? PLAN_ENTITLEMENTS['free']!;

    const [tokenCount, brandCount] = await Promise.all([
      this.prisma.client.costEvent.aggregate({
        where: { 
          businessId,
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        },
        _sum: { costCents: true },
      }),
      this.prisma.client.brand.count({ where: { businessId } }),
    ]);

    return {
      tokensUsed: Math.ceil((tokenCount._sum.costCents || 0) / 10),
      tokenLimit: entitlements.tokenLimit,
      brandsUsed: brandCount,
      brandLimit: entitlements.brandLimit,
      seatLimit: entitlements.seatLimit,
      features: entitlements.features,
    };
  }

  async createCheckoutSession(businessId: string, priceId: string) {
    const business = await this.prisma.client.business.findUnique({
      where: { id: businessId },
    });

    if (!business) throw new Error('Business not found');

    let customerId = business.stripeCustomerId;

    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: business.ownerId || '', // In real app, join with User for email
        metadata: { businessId },
      });
      customerId = customer.id;
      await this.prisma.client.business.update({
        where: { id: businessId },
        data: { stripeCustomerId: customerId },
      });
    }

    // If we're using the dummy key, return a mock checkout session URL to prevent crashes
    if (this.config.get<string>('stripe.secretKey') === undefined) {
      this.logger.warn('No Stripe Secret Key found. Returning mock checkout URL.');
      
      // Simulate upgrading plan in DB directly for mock purposes
      await this.prisma.client.business.update({
        where: { id: businessId },
        data: { plan: this.mapPriceToPlan(priceId), status: 'active' }
      });
      
      return { url: `${this.config.get('app.webUrl')}/settings/billing?success=true&mock=1` };
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${this.config.get('app.webUrl')}/settings/billing?success=true`,
      cancel_url: `${this.config.get('app.webUrl')}/settings/billing?canceled=true`,
      subscription_data: {
        metadata: { businessId },
      },
    });

    return { url: session.url };
  }

  private mapPriceToPlan(priceId: string): string {
    const prices = this.config.get<Record<string, string>>('stripe.prices');
    if (!prices) {
      // Mock mappings
      if (priceId.includes('pro')) return 'pro';
      if (priceId.includes('elite')) return 'elite';
      return 'free';
    }

    for (const [plan, id] of Object.entries(prices)) {
      if (id === priceId) return plan;
    }

    return 'custom';
  }
}

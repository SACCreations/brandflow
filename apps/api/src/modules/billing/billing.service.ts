import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/database/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class BillingService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const secretKey = this.config.get<string>('stripe.secretKey');
    this.stripe = new Stripe(secretKey || '', {
      apiVersion: '2024-11-20.acacia',
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
    } catch (err) {
      this.logger.error(`Failed to fetch Stripe subscription for ${businessId}:`, err);
      return {
        plan: business.plan,
        status: 'error',
        usage: await this.getUsageStats(businessId),
      };
    }
  }

  private async getUsageStats(businessId: string) {
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
      tokensUsed: Math.ceil((tokenCount._sum.costCents || 0) / 10), // Example conversion
      tokenLimit: 100, // Should be based on plan
      brandsUsed: brandCount,
      brandLimit: 1, // Should be based on plan
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
        email: business.ownerId, // In real app, join with User for email
        metadata: { businessId },
      });
      customerId = customer.id;
      await this.prisma.client.business.update({
        where: { id: businessId },
        data: { stripeCustomerId: customerId },
      });
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
}

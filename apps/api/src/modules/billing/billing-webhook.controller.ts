import { Controller, Post, Headers, Req, BadRequestException, RawBodyRequest, Logger } from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/database/prisma.service';
import Stripe from 'stripe';

@Controller('billing/webhooks')
export class BillingWebhookController {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(BillingWebhookController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.stripe = new Stripe(this.config.get<string>('stripe.secretKey') || 'sk_test_dummy', {
      apiVersion: '2025-02-24.acacia',
    });
  }

  @Post()
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ) {
    if (!signature) throw new BadRequestException('Missing stripe-signature header');

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        request.rawBody!,
        signature,
        this.config.get<string>('stripe.webhookSecret') || '',
      );
    } catch (err: any) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    this.logger.log(`Received Stripe event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      default:
        this.logger.warn(`Unhandled Stripe event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const businessId = session.metadata?.['businessId'];
    const subscriptionId = session.subscription as string;

    if (!businessId || !subscriptionId) {
      this.logger.error('Missing businessId or subscriptionId in checkout session metadata');
      return;
    }

    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    
    await this.prisma.client.business.update({
      where: { id: businessId },
      data: {
        stripeSubscriptionId: subscriptionId,
        plan: this.mapPriceToPlan(subscription.items.data[0]?.price.id || ''),
        status: 'active',
      },
    });

    this.logger.log(`Subscription active for business ${businessId}`);
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const businessId = subscription.metadata?.['businessId'];

    if (!businessId) {
      // Find business by customer ID if metadata is missing
      const business = await this.prisma.client.business.findFirst({
        where: { stripeCustomerId: subscription.customer as string },
      });
      if (!business) {
        this.logger.error(`Could not find business for customer ${subscription.customer}`);
        return;
      }
      await this.updateBusinessSubscription(business.id, subscription);
    } else {
      await this.updateBusinessSubscription(businessId, subscription);
    }
  }

  private async updateBusinessSubscription(businessId: string, subscription: Stripe.Subscription) {
    const statusMap: Record<string, string> = {
      active: 'active',
      past_due: 'past_due',
      unpaid: 'unpaid',
      canceled: 'inactive',
      incomplete: 'incomplete',
      trialing: 'trialing',
    };

    await this.prisma.client.business.update({
      where: { id: businessId },
      data: {
        plan: this.mapPriceToPlan(subscription.items.data[0]?.price.id || ''),
        status: statusMap[subscription.status] || 'unknown',
      },
    });

    this.logger.log(`Updated subscription status for business ${businessId}: ${subscription.status}`);
  }

  private mapPriceToPlan(priceId: string): string {
    const prices = this.config.get<Record<string, string>>('stripe.prices');
    if (!prices) return 'free';

    for (const [plan, id] of Object.entries(prices)) {
      if (id === priceId) return plan;
    }

    return 'custom';
  }
}

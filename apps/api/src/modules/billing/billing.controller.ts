import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@brandflow/shared';

@ApiTags('billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('subscription')
  @ApiOperation({ summary: 'Get current subscription and usage details' })
  getSubscription(@CurrentUser() user: JwtPayload) {
    return this.billingService.getSubscriptionDetails(user.businessId);
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Create a Stripe checkout session' })
  createCheckout(@CurrentUser() user: JwtPayload, @Body('priceId') priceId: string) {
    return this.billingService.createCheckoutSession(user.businessId, priceId);
  }
}

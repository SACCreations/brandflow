import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { BillingWebhookController } from './billing-webhook.controller';

@Module({
  controllers: [BillingController, BillingWebhookController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}

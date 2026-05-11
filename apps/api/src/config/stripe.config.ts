import { registerAs } from '@nestjs/config';

export default registerAs('stripe', () => ({
  secretKey: process.env['STRIPE_SECRET_KEY'] ?? '',
  webhookSecret: process.env['STRIPE_WEBHOOK_SECRET'] ?? '',
  prices: {
    starter: process.env['STRIPE_STARTER_PRICE_ID'] ?? '',
    growth: process.env['STRIPE_GROWTH_PRICE_ID'] ?? '',
    agency: process.env['STRIPE_AGENCY_PRICE_ID'] ?? '',
    enterprise: process.env['STRIPE_ENTERPRISE_PRICE_ID'] ?? '',
  },
}));

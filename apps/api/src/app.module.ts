import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import s3Config from './config/s3.config';
import stripeConfig from './config/stripe.config';
import llmConfig from './config/llm.config';
import { AuthModule } from './modules/auth/auth.module';
import { BusinessModule } from './modules/business/business.module';
import { BrandModule } from './modules/brand/brand.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { PromptModule } from './modules/prompt/prompt.module';
import { ContentModule } from './modules/content/content.module';
import { CampaignModule } from './modules/campaign/campaign.module';
import { ApprovalModule } from './modules/approval/approval.module';
import { SocialModule } from './modules/social/social.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { AutomationModule } from './modules/automation/automation.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ImageModule } from './modules/image/image.module';
import { TemplateModule } from './modules/template/template.module';
import { LlmSettingsModule } from './modules/llm-settings/llm-settings.module';
import { QualityModule } from './modules/quality/quality.module';
import { BriefModule } from './modules/brief/brief.module';
import { CustomerModule } from './modules/customer/customer.module';

@Module({
  imports: [
    // ─── Config ────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, s3Config, stripeConfig, llmConfig],
      expandVariables: true,
    }),

    // ─── Rate Limiting ──────────────────────────────────────────
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 50,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),

    // ─── Queue ──────────────────────────────────────────────────
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          url: process.env['REDIS_URL'] ?? 'redis://localhost:6379',
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 500 },
        },
      }),
    }),

    // ─── Feature Modules ────────────────────────────────────────
    AuthModule,
    BusinessModule,
    BrandModule,
    KnowledgeModule,
    PromptModule,
    ContentModule,
    CampaignModule,
    ApprovalModule,
    SocialModule,
    SchedulerModule,
    AutomationModule,
    AnalyticsModule,
    ImageModule,
    TemplateModule,
    LlmSettingsModule,
    QualityModule,
    BriefModule,
    CustomerModule,
  ],
})
export class AppModule {}

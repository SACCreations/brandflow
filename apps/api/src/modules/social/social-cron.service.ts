import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { prisma } from '@brandflow/db';
import { SocialService } from './social.service';

@Injectable()
export class SocialCronService {
  private readonly logger = new Logger(SocialCronService.name);

  constructor(private readonly socialService: SocialService) {}

  /**
   * Proactive Token Refresh: Runs every 6 hours.
   * Finds tokens expiring in the next 24 hours and refreshes them.
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async handleProactiveRefresh() {
    this.logger.log('Starting proactive social token refresh cycle...');

    // Find accounts expiring soon (next 24 hours)
    const soon = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const expiringAccounts = await prisma.socialAccount.findMany({
      where: {
        platform: 'linkedin',
        tokenExpiresAt: {
          lte: soon,
          gt: new Date(), // Only refresh non-expired ones proactively
        },
      },
    });

    if (expiringAccounts.length === 0) {
      this.logger.log('No social accounts require proactive refresh.');
      return;
    }

    this.logger.log(`Found ${expiringAccounts.length} accounts requiring refresh.`);

    for (const account of expiringAccounts) {
      try {
        await this.socialService.refreshLinkedInToken(account.id, account.businessId);
        this.logger.log(`Successfully refreshed token for ${account.platform} account: ${account.name} (${account.id})`);
      } catch (error: any) {
        this.logger.error(`Failed to proactively refresh token for account ${account.id}: ${error.message}`);
        
        // Emit alert event for manual intervention if refresh fails
        await prisma.analyticsEvent.create({
          data: {
            businessId: account.businessId,
            source: 'system.cron.social',
            eventType: 'token_refresh_failed',
            entityType: 'social_account',
            entityId: account.id,
            payload: { error: error.message, accountName: account.name },
          }
        });
      }
    }

    this.logger.log('Proactive social token refresh cycle complete.');
  }

  /**
   * Health Check: Logs the current token health status once a day.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async logTokenHealthReport() {
    const total = await prisma.socialAccount.count();
    const expired = await prisma.socialAccount.count({
      where: { tokenExpiresAt: { lte: new Date() } }
    });

    this.logger.log(`[Token Health Report] Total: ${total}, Expired: ${expired}, Health: ${total > 0 ? ((total - expired) / total * 100).toFixed(1) : 100}%`);
  }
}

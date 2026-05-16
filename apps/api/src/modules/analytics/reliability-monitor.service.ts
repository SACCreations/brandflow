import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { prisma } from '@brandflow/db';
import { AnalyticsService } from './analytics.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ReliabilityMonitorService {
  private readonly logger = new Logger(ReliabilityMonitorService.name);

  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Monitor Reliability: Runs every 15 minutes.
   * Checks for SLA breaches and high failure rates.
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async monitorReliability() {
    this.logger.log('Starting reliability health check...');

    // 1. Check all businesses with recent activity
    const activeBusinesses = await prisma.business.findMany({
      where: { status: 'active' },
      select: { id: true, name: true, ownerId: true }
    });

    for (const business of activeBusinesses) {
      const reliability = await this.analyticsService.getReliabilityMetrics(business.id);
      
      // Alert if success rate is low (and there are enough jobs to be statistically significant)
      if (reliability.totalJobs > 5 && reliability.successRate < 90) {
        this.logger.error(`Reliability Alert: Business ${business.name} (${business.id}) success rate at ${reliability.successRate.toFixed(1)}%`);
        
        await prisma.analyticsEvent.create({
          data: {
            businessId: business.id,
            source: 'system.monitor.reliability',
            eventType: 'reliability_critical_alert',
            payload: { 
              successRate: reliability.successRate, 
              totalJobs: reliability.totalJobs,
              failedJobs: reliability.failedJobs
            }
          }
        });

        // Send real notification to owner
        if (business.ownerId) {
          await this.notificationsService.createNotification({
            businessId: business.id,
            userId: business.ownerId,
            type: 'reliability_critical',
            title: '⚠️ Critical Publishing Reliability Alert',
            body: `Your publishing success rate has dropped to ${reliability.successRate.toFixed(1)}%. Please check your Failed Jobs queue.`,
            channel: 'in_app'
          });
        }
      }

      // 2. Check SLA Compliance
      const sla = await this.analyticsService.getSlaCompliance(business.id);
      if (sla.slaComplianceRate < 95) {
        this.logger.warn(`SLA Warning: Business ${business.name} (${business.id}) SLA compliance at ${sla.slaComplianceRate.toFixed(1)}%`);
        
        await prisma.analyticsEvent.create({
          data: {
            businessId: business.id,
            source: 'system.monitor.sla',
            eventType: 'sla_compliance_warning',
            payload: { 
              complianceRate: sla.slaComplianceRate,
              avgDelay: sla.averageDelayMinutes
            }
          }
        });

        // Send warning notification to owner
        if (business.ownerId) {
          await this.notificationsService.createNotification({
            businessId: business.id,
            userId: business.ownerId,
            type: 'sla_warning',
            title: '📈 SLA Compliance Warning',
            body: `SLA compliance is currently ${sla.slaComplianceRate.toFixed(1)}%. Average publishing delay is ${sla.averageDelayMinutes.toFixed(1)} minutes.`,
            channel: 'in_app'
          });
        }
      }
    }

    this.logger.log('Reliability health check complete.');
  }

  /**
   * Dead Letter Recovery Suggester: Runs daily.
   * Identifies common failure patterns and suggests fixes.
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async analyzeFailures() {
    const commonFailures = await prisma.publishJob.groupBy({
      by: ['failureClass', 'businessId'],
      where: { status: 'dead_letter' },
      _count: true,
      orderBy: { _count: { failureClass: 'desc' } },
      take: 20
    });

    for (const failure of commonFailures) {
      if (failure._count > 10) {
        this.logger.log(`High frequency failure pattern detected: ${failure.failureClass} for business ${failure.businessId}`);
        // In a real app, send this to an AI for diagnosis or to the engineering team
      }
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createNotification(data: {
    businessId: string;
    userId: string;
    type: string;
    title: string;
    body?: string;
    channel?: string;
  }) {
    return this.prisma.client.notification.create({
      data: {
        businessId: data.businessId,
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        channel: data.channel || 'in_app',
      },
    });
  }

  async getNotifications(userId: string, businessId: string) {
    return this.prisma.client.notification.findMany({
      where: { userId, businessId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.client.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string, businessId: string) {
    return this.prisma.client.notification.updateMany({
      where: { userId, businessId, isRead: false },
      data: { isRead: true },
    });
  }
}

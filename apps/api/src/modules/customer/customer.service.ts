import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@brandflow/db';

@Injectable()
export class CustomerService {
  async findAll(businessId: string) {
    return prisma.customer.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, businessId: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
    });
    if (!customer || customer.businessId !== businessId) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async create(businessId: string, data: any) {
    return prisma.customer.create({
      data: {
        ...data,
        businessId,
      },
    });
  }

  async update(id: string, businessId: string, data: any) {
    await this.findOne(id, businessId);
    return prisma.customer.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, businessId: string) {
    await this.findOne(id, businessId);
    return prisma.customer.delete({
      where: { id },
    });
  }
}

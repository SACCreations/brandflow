import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@brandflow/db';

@Injectable()
export class ProjectService {
  async findAll(businessId: string) {
    return prisma.project.findMany({
      where: { businessId },
      include: { customer: { select: { id: true, name: true, company: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, businessId: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: { customer: { select: { id: true, name: true, company: true } } },
    });
    if (!project || project.businessId !== businessId) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async create(businessId: string, data: any) {
    return prisma.project.create({
      data: {
        ...data,
        businessId,
      },
    });
  }

  async update(id: string, businessId: string, data: any) {
    await this.findOne(id, businessId);
    return prisma.project.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, businessId: string) {
    await this.findOne(id, businessId);
    return prisma.project.delete({
      where: { id },
    });
  }
}

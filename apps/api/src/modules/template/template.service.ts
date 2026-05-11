import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma, type Prisma } from '@brandflow/db';

@Injectable()
export class TemplateService {
  async findAll(businessId: string, type?: string) {
    return prisma.template.findMany({
      where: {
        OR: [{ businessId }, { businessId: null }],
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const template = await prisma.template.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async create(
    businessId: string,
    data: { name: string; type: string; body: string; placeholders?: Record<string, unknown> },
  ) {
    return prisma.template.create({
      data: {
        businessId,
        name: data.name,
        type: data.type,
        body: data.body,
        placeholders: data.placeholders as unknown as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async update(id: string, businessId: string, data: { name?: string; body?: string; placeholders?: Record<string, unknown> }) {
    const template = await prisma.template.findFirst({ where: { id, businessId } });
    if (!template) throw new NotFoundException('Template not found');
    return prisma.template.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.body !== undefined ? { body: data.body } : {}),
        ...(data.placeholders !== undefined ? { placeholders: data.placeholders as unknown as Prisma.InputJsonValue } : {}),
      },
    });
  }

  async delete(id: string, businessId: string) {
    const template = await prisma.template.findFirst({ where: { id, businessId } });
    if (!template) throw new NotFoundException('Template not found');
    return prisma.template.delete({ where: { id } });
  }
}

import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import type { Prisma } from '@brandflow/db';
import type { CreateProjectDto, UpdateProjectDto } from '@brandflow/shared';


@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    businessId: string,
    filters: { status?: string; search?: string; customerId?: string } = {},
  ) {
    const search = this.normalizeOptionalText(filters.search);

    return this.prisma.client.project.findMany({
      where: {
        businessId,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.customerId ? { customerId: filters.customerId } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { customer: { is: { name: { contains: search, mode: 'insensitive' } } } },
              ],
            }
          : {}),
      },
      include: { customer: { select: { id: true, name: true, company: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, businessId: string) {
    const project = await this.prisma.client.project.findUnique({
      where: { id },
      include: { customer: { select: { id: true, name: true, company: true } } },
    });
    if (!project || project.businessId !== businessId) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async create(businessId: string, data: CreateProjectDto) {
    const payload = await this.prepareCreateProjectPayload(businessId, data);

    return this.prisma.client.project.create({
      data: {
        ...payload,
      },
      include: { customer: { select: { id: true, name: true, company: true } } },
    });
  }

  async update(id: string, businessId: string, data: UpdateProjectDto) {
    await this.findOne(id, businessId);

    const payload = await this.prepareUpdateProjectPayload(businessId, data);

    return this.prisma.client.project.update({
      where: { id },
      data: payload,
      include: { customer: { select: { id: true, name: true, company: true } } },
    });
  }

  async remove(id: string, businessId: string) {
    const project = await this.findOne(id, businessId);
    if (project.status === 'active') {
      throw new ConflictException('Archive or complete the project before deleting it.');
    }

    return this.prisma.client.project.delete({
      where: { id },
    });
  }

  private async prepareCreateProjectPayload(
    businessId: string,
    data: CreateProjectDto,
  ): Promise<Prisma.ProjectUncheckedCreateInput> {
    if (data.customerId) {
      await this.assertCustomerOwnership(businessId, data.customerId);
    }

    const payload: Prisma.ProjectUncheckedCreateInput = {
      businessId,
      customerId: data.customerId ?? null,
      name: data.name.trim(),
      description: this.normalizeOptionalText(data.description) ?? null,
      status: data.status,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
      budget: data.budget ?? null,
      ...(data.metadata ? { metadata: data.metadata as Prisma.InputJsonValue } : {}),
    };

    if (payload.startDate && payload.endDate && payload.endDate < payload.startDate) {
      throw new BadRequestException('Project end date cannot be earlier than the start date.');
    }

    return payload;
  }

  private async prepareUpdateProjectPayload(
    businessId: string,
    data: UpdateProjectDto,
  ): Promise<Prisma.ProjectUncheckedUpdateInput> {
    if (data.customerId) {
      await this.assertCustomerOwnership(businessId, data.customerId);
    }

    const payload: Prisma.ProjectUncheckedUpdateInput = {
      ...(data.customerId !== undefined ? { customerId: data.customerId ?? null } : {}),
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.description !== undefined ? { description: this.normalizeOptionalText(data.description) ?? null } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.startDate !== undefined ? { startDate: data.startDate ?? null } : {}),
      ...(data.endDate !== undefined ? { endDate: data.endDate ?? null } : {}),
      ...(data.budget !== undefined ? { budget: data.budget ?? null } : {}),
      ...(data.metadata !== undefined ? { metadata: data.metadata as Prisma.InputJsonValue } : {}),
    };

    if (payload.startDate instanceof Date && payload.endDate instanceof Date && payload.endDate < payload.startDate) {
      throw new BadRequestException('Project end date cannot be earlier than the start date.');
    }

    return payload;
  }

  private async assertCustomerOwnership(businessId: string, customerId: string) {
    const customer = await this.prisma.client.customer.findFirst({
      where: { id: customerId, businessId },
      select: { id: true },
    });

    if (!customer) {
      throw new BadRequestException('Selected client does not belong to this workspace.');
    }
  }

  private normalizeOptionalText(value: string | null | undefined) {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }
}

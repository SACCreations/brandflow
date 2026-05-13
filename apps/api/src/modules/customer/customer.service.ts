import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@brandflow/db';
import type { Prisma } from '@brandflow/db';
import type { CreateCustomerDto, UpdateCustomerDto } from '@brandflow/shared';

@Injectable()
export class CustomerService {
  async findAll(businessId: string, filters: { status?: string; search?: string } = {}) {
    const search = this.normalizeOptionalText(filters.search);

    return prisma.customer.findMany({
      where: {
        businessId,
        ...(filters.status ? { status: filters.status } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        _count: { select: { projects: true } },
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string, businessId: string) {
    const customer = await prisma.customer.findFirst({
      where: { id, businessId },
      include: {
        _count: { select: { projects: true } },
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
            endDate: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: 'desc' },
          take: 5,
        },
      },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async create(businessId: string, data: CreateCustomerDto) {
    const payload: Prisma.CustomerUncheckedCreateInput = {
      businessId,
      name: data.name.trim(),
      email: this.normalizeEmail(data.email),
      company: this.normalizeOptionalText(data.company),
      phone: this.normalizeOptionalText(data.phone),
      status: data.status,
      ...(data.metadata ? { metadata: data.metadata as Prisma.InputJsonValue } : {}),
    };
    await this.ensureUniqueEmail(businessId, payload.email ?? null);

    return prisma.customer.create({
      data: payload,
      include: {
        _count: { select: { projects: true } },
      },
    });
  }

  async update(id: string, businessId: string, data: UpdateCustomerDto) {
    await this.findOne(id, businessId);

    const normalizedEmail = data.email !== undefined ? this.normalizeEmail(data.email) : undefined;

    const payload: Prisma.CustomerUncheckedUpdateInput = {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.email !== undefined ? { email: normalizedEmail } : {}),
      ...(data.company !== undefined ? { company: this.normalizeOptionalText(data.company) } : {}),
      ...(data.phone !== undefined ? { phone: this.normalizeOptionalText(data.phone) } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.metadata !== undefined ? { metadata: data.metadata as Prisma.InputJsonValue } : {}),
    };
    await this.ensureUniqueEmail(businessId, normalizedEmail ?? null, id);

    return prisma.customer.update({
      where: { id },
      data: payload,
      include: {
        _count: { select: { projects: true } },
      },
    });
  }

  async remove(id: string, businessId: string) {
    const customer = await this.findOne(id, businessId);
    if (customer._count.projects > 0) {
      throw new ConflictException('Cannot delete a client that still has linked projects. Reassign or remove the projects first.');
    }

    return prisma.customer.delete({
      where: { id },
    });
  }

  private async ensureUniqueEmail(businessId: string, email?: string | null, excludeId?: string) {
    if (!email) return;

    const existing = await prisma.customer.findFirst({
      where: {
        businessId,
        email,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('A client with this email already exists in the workspace.');
    }
  }

  private normalizeEmail(value: string | null | undefined) {
    const normalized = this.normalizeOptionalText(value)?.toLowerCase();
    return normalized || undefined;
  }

  private normalizeOptionalText(value: string | null | undefined) {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }
}

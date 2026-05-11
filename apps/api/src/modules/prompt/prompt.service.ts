import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@brandflow/db';
import type { Prompt } from '@brandflow/db';
import type { CreatePromptDto } from '@brandflow/shared';

@Injectable()
export class PromptService {
  async findAll(businessId: string, module?: string) {
    return prisma.prompt.findMany({
      where: {
        OR: [{ businessId }, { businessId: null }], // include platform-level prompts
        ...(module ? { module } : {}),
        isActive: true,
      },
      orderBy: [{ layer: 'asc' }, { version: 'desc' }],
    });
  }

  async findById(id: string) {
    const prompt = await prisma.prompt.findUnique({ where: { id } });
    if (!prompt) throw new NotFoundException('Prompt not found');
    return prompt;
  }

  async create(businessId: string, dto: CreatePromptDto) {
    // Deactivate previous active version of same name + module + layer
    await prisma.prompt.updateMany({
      where: { businessId, module: dto.module, layer: dto.layer, name: dto.name, isActive: true },
      data: { isActive: false },
    });

    const lastVersion = await prisma.prompt.findFirst({
      where: { businessId, module: dto.module, layer: dto.layer, name: dto.name },
      orderBy: { version: 'desc' },
    });

    return prisma.prompt.create({
      data: {
        ...dto,
        businessId,
        version: (lastVersion?.version ?? 0) + 1,
        isActive: true,
      },
    });
  }

  async deactivate(id: string, businessId: string) {
    const prompt = await prisma.prompt.findFirst({ where: { id, businessId } });
    if (!prompt) throw new NotFoundException('Prompt not found');
    return prisma.prompt.update({ where: { id }, data: { isActive: false } });
  }

  /**
   * Resolve the effective prompt for a module by merging layers:
   * platform → business → brand → campaign
   */
  async resolveForModule(
    module: string,
    businessId: string,
    brandId?: string,
  ) {
    const prompts = await prisma.prompt.findMany({
      where: {
        module,
        isActive: true,
        OR: [{ businessId: null }, { businessId }],
      },
      orderBy: { version: 'desc' },
    });

    // Return the highest-priority active prompt (brand > business > platform)
    const priority = ['campaign', 'brand', 'business', 'platform'];
    for (const layer of priority) {
      const match = prompts.find((p: Prompt) => p.layer === layer);
      if (match) return match;
    }

    return prompts[0] ?? null;
  }
}

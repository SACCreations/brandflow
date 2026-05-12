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
    // Fetch all active prompts for this module and business
    const prompts = await prisma.prompt.findMany({
      where: {
        module,
        isActive: true,
        OR: [{ businessId: null }, { businessId }],
      },
      orderBy: { version: 'desc' },
    });

    // Strategy: Start with platform base, override with business, then brand
    const layers = ['platform', 'business', 'brand', 'campaign'];
    const resolved: any = {
      template: '',
      layersUsed: [],
      metadata: {},
      config: {}
    };

    for (const layer of layers) {
      const match = prompts.find((p) => p.layer === layer);
      if (match) {
        // Simple concatenation for now, in production we'd use section-based merging
        resolved.template += `\n\n${match.template}`;
        resolved.layersUsed.push(layer);
        resolved.config = { ...resolved.config, ...(match.config as object) };
        resolved.metadata = { ...resolved.metadata, ...(match.metadata as object) };
        resolved.promptId = match.id;
        resolved.version = match.version;
      }
    }

    return resolved.template ? resolved : null;
  }

  async trackPerformance(id: string, score: number) {
    const prompt = await this.findById(id);
    const newScore = prompt.performanceScore 
      ? (prompt.performanceScore + score) / 2 
      : score;
    
    return prisma.prompt.update({
      where: { id },
      data: { performanceScore: newScore }
    });
  }
}

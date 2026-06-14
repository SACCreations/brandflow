import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InvalidTemplateVariableException } from '../../common/exceptions/business.exceptions';
import { prisma, type Prisma } from '@brandflow/db';

@Injectable()
export class TemplateService {
  validateAndExtractPlaceholders(body: string): string[] {
    let openCount = 0;
    let pos = 0;
    while ((pos = body.indexOf('{{', pos)) !== -1) {
      openCount++;
      pos += 2;
    }
    
    let closeCount = 0;
    pos = 0;
    while ((pos = body.indexOf('}}', pos)) !== -1) {
      closeCount++;
      pos += 2;
    }
    
    if (openCount !== closeCount) {
      throw new InvalidTemplateVariableException('Unbalanced double curly braces {{ }} in template body.');
    }
    
    const regex = /\{\{([^}]+)\}\}/g;
    const placeholders: string[] = [];
    let match;
    while ((match = regex.exec(body)) !== null) {
      const matchGroup = match[1];
      if (!matchGroup) continue;
      const placeholder = matchGroup.trim();
      if (!placeholder) {
        throw new InvalidTemplateVariableException('Empty placeholder found in template body.');
      }
      if (!/^[a-zA-Z0-9_]+$/.test(placeholder)) {
        throw new InvalidTemplateVariableException(`Invalid placeholder name "${placeholder}". Placeholder names should only contain alphanumeric characters and underscores.`);
      }
      if (!placeholders.includes(placeholder)) {
        placeholders.push(placeholder);
      }
    }
    
    return placeholders;
  }

  safeRender(body: string, variables: Record<string, any>): string {
    const placeholders = this.validateAndExtractPlaceholders(body);
    let rendered = body;
    for (const key of placeholders) {
      const value = variables[key] !== undefined ? String(variables[key]) : `{{${key}}}`;
      rendered = rendered.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), value);
    }
    return rendered;
  }

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
    const extracted = this.validateAndExtractPlaceholders(data.body);
    const placeholdersObj: Record<string, unknown> = {};
    for (const key of extracted) {
      placeholdersObj[key] = data.placeholders?.[key] !== undefined ? data.placeholders[key] : `Value for ${key}`;
    }

    return prisma.template.create({
      data: {
        businessId,
        name: data.name,
        type: data.type,
        body: data.body,
        placeholders: placeholdersObj as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async update(id: string, businessId: string, data: { name?: string; body?: string; placeholders?: Record<string, unknown> }) {
    const template = await prisma.template.findFirst({ where: { id, businessId } });
    if (!template) throw new NotFoundException('Template not found');

    let finalPlaceholders = data.placeholders;
    const finalBody = data.body !== undefined ? data.body : template.body;

    if (data.body !== undefined) {
      const extracted = this.validateAndExtractPlaceholders(finalBody);
      const placeholdersObj: Record<string, unknown> = {};
      const currentPlaceholders = (template.placeholders as Record<string, unknown>) || {};
      for (const key of extracted) {
        placeholdersObj[key] = data.placeholders?.[key] !== undefined 
          ? data.placeholders[key] 
          : (currentPlaceholders[key] !== undefined ? currentPlaceholders[key] : `Value for ${key}`);
      }
      finalPlaceholders = placeholdersObj;
    } else if (data.placeholders !== undefined) {
      const extracted = this.validateAndExtractPlaceholders(finalBody);
      const placeholdersObj: Record<string, unknown> = {};
      for (const key of extracted) {
        placeholdersObj[key] = data.placeholders[key] !== undefined ? data.placeholders[key] : `Value for ${key}`;
      }
      finalPlaceholders = placeholdersObj;
    }

    return prisma.template.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.body !== undefined ? { body: data.body } : {}),
        ...(finalPlaceholders !== undefined ? { placeholders: finalPlaceholders as unknown as Prisma.InputJsonValue } : {}),
      },
    });
  }

  async delete(id: string, businessId: string) {
    const template = await prisma.template.findFirst({ where: { id, businessId } });
    if (!template) throw new NotFoundException('Template not found');
    return prisma.template.delete({ where: { id } });
  }
}

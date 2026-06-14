import { describe, it, expect } from 'vitest';
import { ZodValidationPipe } from './zod-validation.pipe';
import { z } from 'zod';
import { BadRequestException } from '@nestjs/common';

describe('ZodValidationPipe', () => {
  const schema = z.object({
    name: z.string().min(1, 'Name required'),
    settings: z.object({
      active: z.boolean(),
    }),
    items: z.array(z.string()),
  });

  const pipe = new ZodValidationPipe(schema);

  it('should return value if validation succeeds', () => {
    const validData = {
      name: 'Test',
      settings: { active: true },
      items: ['a', 'b'],
    };
    expect(pipe.transform(validData)).toEqual(validData);
  });

  it('should throw BadRequestException with formatted path strings on failure', () => {
    const invalidData = {
      name: '',
      settings: { active: 'not-a-boolean' },
      items: [123],
    };

    expect(() => pipe.transform(invalidData)).toThrow(BadRequestException);

    try {
      pipe.transform(invalidData);
    } catch (err: any) {
      const response = err.getResponse();
      expect(response.message).toContain('name: Name required');
      expect(response.message).toContain('settings.active: Expected boolean, received string');
      expect(response.message).toContain('items.0: Expected string, received number');
    }
  });
});

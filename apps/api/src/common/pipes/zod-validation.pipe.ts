import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const errors = (result.error as ZodError).errors.map((e) => {
        const path = e.path.join('.') || 'body';
        return `${path}: ${e.message}`;
      });
      throw new BadRequestException(errors);
    }
    return result.data;
  }
}


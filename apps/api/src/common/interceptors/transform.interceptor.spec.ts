import { describe, it, expect } from 'vitest';
import { TransformInterceptor } from './transform.interceptor';
import { of } from 'rxjs';
import type { ExecutionContext } from '@nestjs/common';

describe('TransformInterceptor', () => {
  const interceptor = new TransformInterceptor();

  it('should wrap response inside a standard success envelope', () => {
    const mockContext = {} as unknown as ExecutionContext;
    const mockHandler = {
      handle: () => of({ items: [1, 2, 3] }),
    };

    interceptor.intercept(mockContext, mockHandler).subscribe((result) => {
      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          data: { items: [1, 2, 3] },
          timestamp: expect.any(String),
        }),
      );
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoggingInterceptor } from './logging.interceptor';
import { of, throwError } from 'rxjs';
import { HttpException, HttpStatus } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
  });

  it('should log request success with execution time and metadata', () => {
    const mockRequest = {
      method: 'GET',
      url: '/api/v1/test',
      headers: { 'x-correlation-id': 'test-log-123' },
      user: { id: 'usr-456', businessId: 'biz-789' },
    };
    const mockResponse = {
      statusCode: 200,
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as unknown as ExecutionContext;

    const mockHandler = {
      handle: () => of('success_response'),
    };

    const spyLog = vi.spyOn((interceptor as any).logger, 'log');

    interceptor.intercept(mockContext, mockHandler).subscribe(() => {
      expect(spyLog).toHaveBeenCalledWith(
        expect.stringContaining('[test-log-123] GET /api/v1/test | User: usr-456 | Tenant: biz-789 | Status: 200'),
      );
    });
  });

  it('should log request failure with warn log and mapped exception code', () => {
    const mockRequest = {
      method: 'POST',
      url: '/api/v1/test',
      headers: { 'x-correlation-id': 'test-log-456' },
      user: { id: 'usr-123', businessId: 'biz-321' },
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => ({}),
      }),
    } as unknown as ExecutionContext;

    const mockHandler = {
      handle: () => throwError(() => new HttpException('Conflict Error', HttpStatus.CONFLICT)),
    };

    const spyWarn = vi.spyOn((interceptor as any).logger, 'warn');

    interceptor.intercept(mockContext, mockHandler).subscribe({
      error: () => {
        expect(spyWarn).toHaveBeenCalledWith(
          expect.stringContaining('[test-log-456] POST /api/v1/test | User: usr-123 | Tenant: biz-321 | Status: 409 | +'),
        );
      },
    });
  });
});

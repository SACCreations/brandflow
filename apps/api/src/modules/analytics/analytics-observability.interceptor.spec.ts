import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsObservabilityInterceptor } from './analytics-observability.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import * as Sentry from '@sentry/node';

vi.mock('@sentry/node', () => ({
  withScope: vi.fn((callback) => {
    const mockScope = {
      setTag: vi.fn(),
      setExtra: vi.fn(),
      setLevel: vi.fn(),
    };
    return callback(mockScope);
  }),
  captureMessage: vi.fn(),
  captureException: vi.fn(),
}));

describe('AnalyticsObservabilityInterceptor', () => {
  let interceptor: AnalyticsObservabilityInterceptor;
  let executionContextMock: any;
  let callHandlerMock: any;

  beforeEach(() => {
    interceptor = new AnalyticsObservabilityInterceptor();
    vi.clearAllMocks();

    executionContextMock = {
      switchToHttp: vi.fn().mockReturnThis(),
      getRequest: vi.fn().mockReturnValue({
        method: 'GET',
        url: '/analytics/summary',
        headers: { 'x-correlation-id': 'req-123' },
        user: { businessId: 'biz-1', id: 'user-1' },
      }),
    } as unknown as ExecutionContext;

    callHandlerMock = {
      handle: vi.fn(),
    } as unknown as CallHandler;
  });

  it('should measure execution time and return response successfully', async () => {
    callHandlerMock.handle.mockReturnValue(of({ data: 'success' }));

    const observable = interceptor.intercept(executionContextMock, callHandlerMock);

    await new Promise((resolve) => {
      observable.subscribe({
        next: (val) => {
          expect(val).toEqual({ data: 'success' });
          resolve(null);
        },
      });
    });

    expect(Sentry.withScope).toHaveBeenCalled();
  });

  it('should capture exception and forward error on handler failure', async () => {
    const errorMock = new Error('Test DB Error');
    callHandlerMock.handle.mockReturnValue(throwError(() => errorMock));

    const observable = interceptor.intercept(executionContextMock, callHandlerMock);

    await new Promise((resolve) => {
      observable.subscribe({
        error: (err) => {
          expect(err).toBe(errorMock);
          resolve(null);
        },
      });
    });

    expect(Sentry.captureException).toHaveBeenCalledWith(errorMock);
  });

  it('should trigger slow query warning if duration is over 500ms', async () => {
    callHandlerMock.handle.mockReturnValue(of({ data: 'success' }));

    // Mock a delay by overriding Date.now
    let timeIndex = 0;
    const timeSequence = [1000, 1600]; // 600ms delta
    vi.spyOn(Date, 'now').mockImplementation(() => {
      const val = timeSequence[timeIndex] || 2000;
      timeIndex++;
      return val;
    });

    const observable = interceptor.intercept(executionContextMock, callHandlerMock);

    await new Promise((resolve) => {
      observable.subscribe({
        next: (val) => {
          expect(val).toEqual({ data: 'success' });
          resolve(null);
        },
      });
    });

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      expect.stringContaining('Slow Query Alert'),
      expect.any(Object)
    );

    // Restore original Date.now
    vi.restoreAllMocks();
  });
});

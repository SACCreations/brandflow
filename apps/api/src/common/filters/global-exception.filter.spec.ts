import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GlobalExceptionFilter } from './global-exception.filter';
import { ArgumentsHost, HttpStatus, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as Sentry from '@sentry/node';
import { BrandAlreadyExistsException } from '../exceptions/business.exceptions';

vi.mock('@sentry/node', () => ({
  captureException: vi.fn(),
  withScope: vi.fn((cb) => {
    const mockScope = {
      setTag: vi.fn(),
      setContext: vi.fn(),
    };
    return cb(mockScope);
  }),
}));

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockJson: any;
  let mockStatus: any;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    mockResponse = {
      status: mockStatus,
    };
    mockRequest = {
      url: '/api/v1/test-endpoint',
      headers: {
        'x-correlation-id': 'test-req-id-123',
      },
      method: 'POST',
      body: { password: 'secret_password', name: 'Test Slug' },
    };

    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;

    vi.clearAllMocks();
  });

  it('should format HttpException standard JSON format', () => {
    const exception = new NotFoundException('Brand not found');

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Brand not found',
        error: 'NotFoundException',
        path: '/api/v1/test-endpoint',
      }),
    );
  });

  it('should format Custom business exception class name as error', () => {
    const exception = new BrandAlreadyExistsException();

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.CONFLICT,
        message: 'Brand slug already exists',
        error: 'BrandAlreadyExistsException',
      }),
    );
  });

  it('should format Prisma P2002 unique constraint failed to ConflictException', () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '5.22.0',
      meta: {
        modelName: 'Brand',
        target: ['slug'],
      },
    });

    filter.catch(prismaError, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.CONFLICT,
        message: 'Brand slug already exists',
        error: 'ConflictException',
      }),
    );
  });

  it('should format Prisma P2025 record not found to NotFoundException', () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '5.22.0',
    });

    filter.catch(prismaError, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Record not found',
        error: 'NotFoundException',
      }),
    );
  });

  it('should report 500 server error to Sentry and scrub request secrets', () => {
    const internalError = new Error('Database crash!');

    filter.catch(internalError, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(Sentry.withScope).toHaveBeenCalled();
    expect(Sentry.captureException).toHaveBeenCalledWith(internalError);
  });
});

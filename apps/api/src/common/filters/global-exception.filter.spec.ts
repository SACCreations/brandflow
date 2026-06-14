import { describe, it, expect, vi } from 'vitest';
import { GlobalExceptionFilter } from './global-exception.filter';
import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('GlobalExceptionFilter', () => {
  const filter = new GlobalExceptionFilter();

  it('should format and return 409 Conflict for Prisma P2002 error', () => {
    // Mock ArgumentsHost and express Response
    const mockJson = vi.fn();
    const mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    const mockResponse = {
      status: mockStatus,
    };
    const mockRequest = {
      url: '/api/v1/some-endpoint',
    };

    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;

    // Construct a mock Prisma P2002 error
    const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '5.22.0',
      meta: {
        target: ['slug'],
      },
    });

    filter.catch(prismaError, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.CONFLICT,
        error: 'Conflict',
        message: 'Conflict: A resource with this value for [slug] already exists.',
        path: '/api/v1/some-endpoint',
      })
    );
  });
});

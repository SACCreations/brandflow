import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import * as Sentry from '@sentry/node';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'InternalServerErrorException';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      error = exception.constructor.name;
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        message = (resObj['message'] as string | string[]) ?? exception.message;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Prisma error mapping
      switch (exception.code) {
        case 'P2002': {
          statusCode = HttpStatus.CONFLICT;
          error = 'ConflictException';
          const meta = exception.meta as Record<string, unknown> | undefined;
          const target = meta?.['target'] as string[] | undefined;
          const fields = target ? target.join(', ') : 'fields';
          const model = meta?.['modelName'] as string | undefined;
          if (model === 'Brand' && target?.includes('slug')) {
            message = 'Brand slug already exists';
          } else if (model === 'Customer' && target?.includes('email')) {
            message = 'Customer already exists';
          } else {
            message = `Conflict: A resource with this value for [${fields}] already exists.`;
          }
          break;
        }
        case 'P2025':
          statusCode = HttpStatus.NOT_FOUND;
          error = 'NotFoundException';
          message = 'Record not found';
          break;
        case 'P2003':
          statusCode = HttpStatus.CONFLICT;
          error = 'ConflictException';
          message = 'Foreign key constraint violation';
          break;
        case 'P2004':
        case 'P2011':
          statusCode = HttpStatus.BAD_REQUEST;
          error = 'BadRequestException';
          message = 'Database constraint violation';
          break;
        default:
          statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
          error = 'InternalServerErrorException';
          message = 'Database execution error';
          break;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.constructor.name;
    }

    // Logger outputs
    const correlationId = (request.headers['x-correlation-id'] as string) || 'none';
    const user = (request as any).user;
    const tenantId = user?.businessId || 'none';
    const userId = user?.id || 'none';
    const route = request.route?.path || request.url;

    if (statusCode >= 500) {
      this.logger.error(
        `[${correlationId}] Route: ${route} | User: ${userId} | Tenant: ${tenantId} | Status: ${statusCode} | Error: ${error} | Details: ${typeof message === 'string' ? message : JSON.stringify(message)}`,
        exception instanceof Error ? exception.stack : undefined,
      );

      // Report 500 errors to Sentry
      Sentry.withScope((scope) => {
        scope.setTag('requestId', correlationId);
        if (tenantId !== 'none') scope.setTag('tenantId', tenantId);
        if (userId !== 'none') scope.setTag('userId', userId);
        scope.setTag('route', route);
        scope.setTag('statusCode', String(statusCode));

        const scrubbedHeaders = { ...request.headers };
        delete scrubbedHeaders.authorization;
        delete scrubbedHeaders.cookie;

        const scrubbedBody = request.body ? { ...request.body } : undefined;
        if (scrubbedBody) {
          delete scrubbedBody.password;
          delete scrubbedBody.apiKey;
          delete scrubbedBody.fluxApiKey;
          delete scrubbedBody.accessToken;
          delete scrubbedBody.refreshToken;
        }

        scope.setContext('request_details', {
          url: request.url,
          method: request.method,
          headers: scrubbedHeaders,
          body: scrubbedBody,
        });

        Sentry.captureException(exception);
      });
    } else {
      this.logger.warn(
        `[${correlationId}] Route: ${route} | User: ${userId} | Tenant: ${tenantId} | Status: ${statusCode} | Error: ${error} | Details: ${typeof message === 'string' ? message : JSON.stringify(message)}`,
      );
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}



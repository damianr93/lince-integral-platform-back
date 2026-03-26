import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const isClientError = status >= 400 && status < 500;

    if (!isClientError) {
      // Log 5xx errors with full stack so they're visible in the console
      this.logger.error(
        `[${request.method}] ${request.url} → ${status}`,
        exception instanceof Error
          ? exception.stack
          : JSON.stringify(exception),
      );
    } else {
      // Log 4xx as simple warn (validation errors, not found, etc.)
      const msg =
        exception instanceof HttpException
          ? JSON.stringify(exception.getResponse())
          : String(exception);
      this.logger.warn(`[${request.method}] ${request.url} → ${status} · ${msg}`);
    }

    const body =
      exception instanceof HttpException
        ? exception.getResponse()
        : { statusCode: status, message: 'Error interno del servidor' };

    response.status(status).json(body);
  }
}

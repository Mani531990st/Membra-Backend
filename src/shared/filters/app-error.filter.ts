import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
} from "@nestjs/common";
import type { Response } from "express";
import { ThrottlerException } from "@nestjs/throttler";
import { MulterError } from "multer";

import { RateLimitedError, ValidationError, toHttpError } from "@/shared/errors";
import type { RequestWithId } from "@/shared/http/request-id.middleware";

function httpExceptionMessage(exception: HttpException): string {
  const response = exception.getResponse();
  if (typeof response === "string") {
    return response;
  }
  if (
    typeof response === "object" &&
    response !== null &&
    "message" in response
  ) {
    const message = (response as { message: unknown }).message;
    return Array.isArray(message) ? message.join(" ") : String(message);
  }
  return exception.message;
}

function isInvalidJsonBody(exception: unknown): boolean {
  if (
    typeof exception === "object" &&
    exception !== null &&
    "type" in exception &&
    (exception as { type?: string }).type === "entity.parse.failed"
  ) {
    return true;
  }

  if (
    exception instanceof SyntaxError &&
    "status" in exception &&
    (exception as { status?: number }).status === 400
  ) {
    return true;
  }

  if (!(exception instanceof HttpException)) {
    return false;
  }

  if (exception.getStatus() !== HttpStatus.BAD_REQUEST) {
    return false;
  }

  const message = httpExceptionMessage(exception);
  return /json|unexpected token|body.*parser|syntaxerror/i.test(message);
}

@Catch()
export class AppErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithId>();
    const requestId = request.requestId;

    if (exception instanceof ThrottlerException) {
      const mapped = toHttpError(new RateLimitedError());
      response.status(mapped.status).json(mapped.body);
      return;
    }

    if (
      exception instanceof MulterError ||
      exception instanceof PayloadTooLargeException
    ) {
      const message =
        exception instanceof MulterError && exception.code === "LIMIT_FILE_SIZE"
          ? "Avatar file must be at most 8 MB"
          : exception.message || "Invalid upload";
      const mapped = toHttpError(new ValidationError(message));
      response.status(mapped.status).json(mapped.body);
      return;
    }

    if (exception instanceof NotFoundException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      if (
        typeof body === "object" &&
        body !== null &&
        "error" in body &&
        (body as { error: unknown }).error === "Not found"
      ) {
        response.status(status).json(body);
        return;
      }

      response.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Not found",
        },
      });
      return;
    }

    const error = isInvalidJsonBody(exception)
      ? new ValidationError("Invalid JSON body")
      : exception;

    const mapped = toHttpError(error);

    if (mapped.status >= 500) {
      const prefix = requestId ? `[${requestId}] ` : "";
      this.logger.error(
        `${prefix}${exception instanceof Error ? exception.message : "Unhandled error"}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(mapped.status).json(mapped.body);
  }
}

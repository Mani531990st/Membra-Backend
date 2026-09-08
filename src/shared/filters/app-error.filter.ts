import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  NotFoundException,
} from "@nestjs/common";
import type { Response } from "express";

import { ValidationError, toHttpError } from "@/shared/errors";

function httpExceptionMessage(exception: BadRequestException): string {
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

  if (!(exception instanceof BadRequestException)) {
    return false;
  }

  const message = httpExceptionMessage(exception);
  return /json|unexpected token|body.*parser|syntaxerror/i.test(message);
}

@Catch()
export class AppErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    // Preserve previous OpenAPI JSON 404 body shape when docs are disabled.
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
    response.status(mapped.status).json(mapped.body);
  }
}

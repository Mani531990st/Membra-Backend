import { Injectable, PipeTransform } from "@nestjs/common";
import type { ZodType } from "zod";

import { ValidationError } from "@/shared/errors";

@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const parsed = this.schema.safeParse(value ?? {});
    if (!parsed.success) {
      throw new ValidationError("Validation failed", parsed.error.flatten());
    }
    return parsed.data;
  }
}

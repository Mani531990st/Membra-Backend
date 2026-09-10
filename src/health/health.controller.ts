import { Controller, Get } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";

import { postgresClient } from "@/db";

@SkipThrottle()
@Controller()
export class HealthController {
  @Get("health")
  async health(): Promise<{ status: "ok" }> {
    await postgresClient`select 1`;
    return { status: "ok" };
  }
}

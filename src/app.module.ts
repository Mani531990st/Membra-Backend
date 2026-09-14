import { APP_GUARD } from "@nestjs/core";
import { Module } from "@nestjs/common";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import { DatabaseModule } from "./db/database.module";
import { DocsModule } from "./docs/docs.module";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ClubsModule } from "./modules/clubs/clubs.module";
import { OriginGuard } from "./shared/http/origin.guard";

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [{ name: "default", ttl: 60_000, limit: 60 }],
    }),
    DatabaseModule,
    AuthModule,
    ClubsModule,
    DocsModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: OriginGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}

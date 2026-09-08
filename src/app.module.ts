import { Module } from "@nestjs/common";

import { DatabaseModule } from "./db/database.module";
import { DocsModule } from "./docs/docs.module";
import { AuthModule } from "./modules/auth/auth.module";

@Module({
  imports: [DatabaseModule, AuthModule, DocsModule],
})
export class AppModule {}

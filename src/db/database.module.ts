import { Global, Module, OnModuleDestroy } from "@nestjs/common";

import { DRIZZLE } from "./drizzle.token";
import { closeDatabase, db } from "./index";

export { DRIZZLE } from "./drizzle.token";

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      useValue: db,
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule implements OnModuleDestroy {
  async onModuleDestroy(): Promise<void> {
    await closeDatabase();
  }
}

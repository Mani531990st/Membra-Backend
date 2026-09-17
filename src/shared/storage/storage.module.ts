import { Global, Module } from "@nestjs/common";

import {
  createScalewayObjectStorage,
  SCALEWAY_OBJECT_STORAGE,
} from "./scaleway-object-storage";

@Global()
@Module({
  providers: [
    {
      provide: SCALEWAY_OBJECT_STORAGE,
      useFactory: createScalewayObjectStorage,
    },
  ],
  exports: [SCALEWAY_OBJECT_STORAGE],
})
export class StorageModule {}

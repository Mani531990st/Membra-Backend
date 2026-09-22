import { Inject, Injectable } from "@nestjs/common";

import { DRIZZLE } from "@/db/drizzle.token";
import type { Database } from "@/db/types";

import { CatalogRepository } from "../repositories/catalog.repository";

@Injectable()
export class ListLanguages {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(CatalogRepository) private readonly catalog: CatalogRepository,
  ) {}

  async execute() {
    const languages = await this.catalog.listActiveLanguages(this.db);
    return { languages };
  }
}

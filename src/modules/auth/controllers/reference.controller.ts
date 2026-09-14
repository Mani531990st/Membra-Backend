import { Controller, Get, HttpCode, Inject } from "@nestjs/common";

import { ListGenders } from "../use-cases/list-genders";

@Controller("reference")
export class ReferenceController {
  constructor(
    @Inject(ListGenders) private readonly listGendersUseCase: ListGenders,
  ) {}

  @Get("genders")
  @HttpCode(200)
  async genders() {
    return this.listGendersUseCase.execute();
  }
}

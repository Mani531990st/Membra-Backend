import { Controller, Get, HttpCode, Inject } from "@nestjs/common";

import { ListActivities } from "../use-cases/list-activities";
import { ListGenders } from "../use-cases/list-genders";

@Controller("reference")
export class ReferenceController {
  constructor(
    @Inject(ListGenders) private readonly listGendersUseCase: ListGenders,
    @Inject(ListActivities)
    private readonly listActivitiesUseCase: ListActivities,
  ) {}

  @Get("genders")
  @HttpCode(200)
  async genders() {
    return this.listGendersUseCase.execute();
  }

  @Get("activities")
  @HttpCode(200)
  async activities() {
    return this.listActivitiesUseCase.execute();
  }
}

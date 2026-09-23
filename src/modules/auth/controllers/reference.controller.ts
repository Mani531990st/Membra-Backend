import { Controller, Get, HttpCode, Inject } from "@nestjs/common";

import { ListActivities } from "../use-cases/list-activities";
import { ListColors } from "../use-cases/list-colors";
import { ListGenders } from "../use-cases/list-genders";
import { ListRoles } from "../use-cases/list-roles";

@Controller("reference")
export class ReferenceController {
  constructor(
    @Inject(ListGenders) private readonly listGendersUseCase: ListGenders,
    @Inject(ListActivities)
    private readonly listActivitiesUseCase: ListActivities,
    @Inject(ListRoles) private readonly listRolesUseCase: ListRoles,
    @Inject(ListColors) private readonly listColorsUseCase: ListColors,
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

  @Get("roles")
  @HttpCode(200)
  async roles() {
    return this.listRolesUseCase.execute();
  }

  @Get("colors")
  @HttpCode(200)
  async colors() {
    return this.listColorsUseCase.execute();
  }
}

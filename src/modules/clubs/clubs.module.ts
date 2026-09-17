import { Module } from "@nestjs/common";

import { AuthModule } from "@/modules/auth/auth.module";

import { ClubsController } from "./controllers/clubs.controller";
import { ClubAccess } from "./lib/club-access";
import { CatalogRepository } from "./repositories/catalog.repository";
import { ClubAddressesRepository } from "./repositories/club-addresses.repository";
import { ClubAvatarsRepository } from "./repositories/club-avatars.repository";
import { ClubsRepository } from "./repositories/clubs.repository";
import {
  AddClubAddress,
  MakeClubAddressPrimary,
  UpdateClubAddress,
} from "./use-cases/club-addresses";
import { GetClubAvatars, UpdateClubAvatars } from "./use-cases/club-avatars";
import { ClubDetailAssembler, CreateClub } from "./use-cases/create-club";
import { GetClub } from "./use-cases/get-club";
import { ListActivities, ListLanguages } from "./use-cases/list-catalogs";
import { UpdateClub } from "./use-cases/update-club";

@Module({
  imports: [AuthModule],
  controllers: [ClubsController],
  providers: [
    ClubsRepository,
    ClubAddressesRepository,
    ClubAvatarsRepository,
    CatalogRepository,
    ClubAccess,
    ClubDetailAssembler,
    CreateClub,
    GetClub,
    UpdateClub,
    AddClubAddress,
    UpdateClubAddress,
    MakeClubAddressPrimary,
    UpdateClubAvatars,
    GetClubAvatars,
    ListActivities,
    ListLanguages,
  ],
})
export class ClubsModule {}

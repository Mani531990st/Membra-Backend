import { Module } from "@nestjs/common";

import { AuthModule } from "@/modules/auth/auth.module";

import { ClubsController } from "./controllers/clubs.controller";
import { SeasonsController } from "./controllers/seasons.controller";
import { ClubAccess } from "./lib/club-access";
import { CatalogRepository } from "./repositories/catalog.repository";
import { ClubAddressesRepository } from "./repositories/club-addresses.repository";
import { ClubAvatarsRepository } from "./repositories/club-avatars.repository";
import { ClubsRepository } from "./repositories/clubs.repository";
import { LocationsRepository } from "./repositories/locations.repository";
import { SeasonsRepository } from "./repositories/seasons.repository";
import {
  AddClubAddress,
  ListClubAddresses,
  MakeClubAddressPrimary,
  UpdateClubAddress,
} from "./use-cases/club-addresses";
import { GetClubAvatars, UpdateClubAvatars } from "./use-cases/club-avatars";
import { ClubDetailAssembler, CreateClub } from "./use-cases/create-club";
import { GetClub } from "./use-cases/get-club";
import { ListAdminClubs } from "./use-cases/list-admin-clubs";
import { ListLanguages } from "./use-cases/list-catalogs";
import {
  CreateLocation,
  DeleteLocation,
  GetLocation,
  ListLocations,
  UpdateLocation,
} from "./use-cases/locations";
import {
  CreateSeason,
  GetSeason,
  ListSeasons,
  UpdateSeason,
} from "./use-cases/seasons";
import { UpdateClub } from "./use-cases/update-club";

@Module({
  imports: [AuthModule],
  controllers: [ClubsController, SeasonsController],
  providers: [
    ClubsRepository,
    ClubAddressesRepository,
    ClubAvatarsRepository,
    LocationsRepository,
    SeasonsRepository,
    CatalogRepository,
    ClubAccess,
    ClubDetailAssembler,
    CreateClub,
    ListAdminClubs,
    GetClub,
    UpdateClub,
    AddClubAddress,
    UpdateClubAddress,
    MakeClubAddressPrimary,
    ListClubAddresses,
    UpdateClubAvatars,
    GetClubAvatars,
    ListLanguages,
    CreateLocation,
    UpdateLocation,
    GetLocation,
    ListLocations,
    DeleteLocation,
    CreateSeason,
    UpdateSeason,
    GetSeason,
    ListSeasons,
  ],
})
export class ClubsModule {}

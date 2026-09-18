import { Inject, Injectable } from "@nestjs/common";

import { DRIZZLE } from "@/db/drizzle.token";
import type { Database } from "@/db/types";
import { NotFoundError, ValidationError } from "@/shared/errors";

import { ClubAccess } from "../lib/club-access";
import {
  buildShownName,
  cascadeShownNames,
  sortLocationsHierarchically,
  wouldCreateCycle,
  type LocationTreeNode,
} from "../lib/location-shown-name";
import {
  LocationsRepository,
  type LocationRow,
} from "../repositories/locations.repository";
import type {
  CreateLocationInput,
  UpdateLocationInput,
} from "../schemas/clubs.schema";

function mapLocation(row: LocationRow) {
  return {
    id: row.id,
    clubId: row.clubId,
    name: row.name,
    shortName: row.shortName,
    shownName: row.shownName,
    parentLocationId: row.parentLocationId,
    directions: row.directions,
    clubAddressId: row.clubAddressId,
    canMemberBook: row.canMemberBook,
    canTeamBook: row.canTeamBook,
    memberReqToBook: row.memberReqToBook,
    public: row.public,
    canFriendshipClubBook: row.canFriendshipClubBook,
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toTreeNode(row: LocationRow): LocationTreeNode {
  return {
    id: row.id,
    parentLocationId: row.parentLocationId,
    shortName: row.shortName,
    shownName: row.shownName,
  };
}

@Injectable()
export class CreateLocation {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(ClubAccess) private readonly access: ClubAccess,
    @Inject(LocationsRepository)
    private readonly locations: LocationsRepository,
  ) {}

  async execute(clubId: number, userId: string, input: CreateLocationInput) {
    await this.access.requireAdmin(clubId, userId);

    const parentLocationId = input.parentLocationId ?? null;
    let parentShownName: string | null = null;

    if (parentLocationId !== null) {
      const parent = await this.locations.findByIdForClub(
        this.db,
        clubId,
        parentLocationId,
      );
      if (!parent) {
        throw new ValidationError(
          "parentLocationId must reference a location in this club",
        );
      }
      parentShownName = parent.shownName;
    }

    if (input.clubAddressId != null) {
      const ok = await this.locations.addressBelongsToClub(
        this.db,
        clubId,
        input.clubAddressId,
      );
      if (!ok) {
        throw new ValidationError(
          "clubAddressId must reference an address in this club",
        );
      }
    }

    const shownName = buildShownName(input.shortName, parentShownName);
    const row = await this.locations.insert(this.db, {
      clubId,
      name: input.name,
      shortName: input.shortName,
      shownName,
      directions: input.directions ?? null,
      clubAddressId: input.clubAddressId ?? null,
      canMemberBook: input.canMemberBook ?? null,
      canTeamBook: input.canTeamBook,
      memberReqToBook: input.memberReqToBook ?? null,
      public: input.public,
      canFriendshipClubBook: input.canFriendshipClubBook,
      active: input.active ?? true,
      parentLocationId,
    });

    return mapLocation(row);
  }
}

@Injectable()
export class UpdateLocation {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(ClubAccess) private readonly access: ClubAccess,
    @Inject(LocationsRepository)
    private readonly locations: LocationsRepository,
  ) {}

  async execute(
    clubId: number,
    locationId: number,
    userId: string,
    input: UpdateLocationInput,
  ) {
    await this.access.requireAdmin(clubId, userId);

    const existing = await this.locations.findByIdForClub(
      this.db,
      clubId,
      locationId,
    );
    if (!existing) {
      throw new NotFoundError("Location not found");
    }

    const nextShortName = input.shortName ?? existing.shortName;
    const nextParentId =
      input.parentLocationId !== undefined
        ? input.parentLocationId
        : existing.parentLocationId;
    const nextCanMemberBook =
      input.canMemberBook !== undefined
        ? input.canMemberBook
        : existing.canMemberBook;
    const nextMemberReq =
      input.memberReqToBook !== undefined
        ? input.memberReqToBook
        : existing.memberReqToBook;

    if (nextCanMemberBook === true && nextMemberReq == null) {
      throw new ValidationError(
        "memberReqToBook is required when canMemberBook is true",
      );
    }

    if (input.clubAddressId != null) {
      const ok = await this.locations.addressBelongsToClub(
        this.db,
        clubId,
        input.clubAddressId,
      );
      if (!ok) {
        throw new ValidationError(
          "clubAddressId must reference an address in this club",
        );
      }
    }

    const all = await this.locations.listByClubId(this.db, clubId);
    const tree = all.map(toTreeNode);

    if (wouldCreateCycle(tree, locationId, nextParentId)) {
      throw new ValidationError(
        "parentLocationId cannot create a cycle in the location tree",
      );
    }

    if (nextParentId !== null) {
      const parent = all.find((row) => row.id === nextParentId);
      if (!parent) {
        throw new ValidationError(
          "parentLocationId must reference a location in this club",
        );
      }
    }

    const structureChanged =
      nextShortName !== existing.shortName ||
      nextParentId !== existing.parentLocationId;

    const row = await this.db.transaction(async (tx) => {
      const patch: Partial<{
        name: string;
        shortName: string;
        shownName: string;
        directions: string | null;
        clubAddressId: number | null;
        canMemberBook: boolean | null;
        canTeamBook: boolean;
        memberReqToBook: number | null;
        public: boolean;
        canFriendshipClubBook: boolean;
        active: boolean;
        parentLocationId: number | null;
      }> = {};

      if (input.name !== undefined) patch.name = input.name;
      if (input.shortName !== undefined) patch.shortName = input.shortName;
      if (input.parentLocationId !== undefined) {
        patch.parentLocationId = input.parentLocationId;
      }
      if (input.directions !== undefined) patch.directions = input.directions;
      if (input.clubAddressId !== undefined) {
        patch.clubAddressId = input.clubAddressId;
      }
      if (input.canMemberBook !== undefined) {
        patch.canMemberBook = input.canMemberBook;
      }
      if (input.canTeamBook !== undefined) patch.canTeamBook = input.canTeamBook;
      if (input.memberReqToBook !== undefined) {
        patch.memberReqToBook = input.memberReqToBook;
      }
      if (input.public !== undefined) patch.public = input.public;
      if (input.canFriendshipClubBook !== undefined) {
        patch.canFriendshipClubBook = input.canFriendshipClubBook;
      }
      if (input.active !== undefined) patch.active = input.active;

      if (structureChanged) {
        const updates = cascadeShownNames(
          tree,
          locationId,
          nextShortName,
          nextParentId,
        );
        const selfUpdate = updates.find((u) => u.id === locationId);
        if (selfUpdate) {
          patch.shownName = selfUpdate.shownName;
        }
        const descendantUpdates = updates.filter((u) => u.id !== locationId);
        if (descendantUpdates.length > 0) {
          await this.locations.updateShownNames(tx, descendantUpdates);
        }
      }

      return this.locations.update(tx, clubId, locationId, patch);
    });

    if (!row) {
      throw new NotFoundError("Location not found");
    }
    return mapLocation(row);
  }
}

@Injectable()
export class GetLocation {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(ClubAccess) private readonly access: ClubAccess,
    @Inject(LocationsRepository)
    private readonly locations: LocationsRepository,
  ) {}

  async execute(clubId: number, locationId: number, userId: string) {
    await this.access.requireMember(clubId, userId);
    const row = await this.locations.findByIdForClub(
      this.db,
      clubId,
      locationId,
    );
    if (!row) {
      throw new NotFoundError("Location not found");
    }
    return mapLocation(row);
  }
}

@Injectable()
export class ListLocations {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(ClubAccess) private readonly access: ClubAccess,
    @Inject(LocationsRepository)
    private readonly locations: LocationsRepository,
  ) {}

  async execute(clubId: number, userId: string) {
    await this.access.requireMember(clubId, userId);
    const rows = await this.locations.listByClubId(this.db, clubId);
    const ordered = sortLocationsHierarchically(rows.map(toTreeNode));
    const byId = new Map(rows.map((row) => [row.id, row]));
    return {
      locations: ordered.map((node) => mapLocation(byId.get(node.id)!)),
    };
  }
}

import "dotenv/config";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../src/db/schema";
import { activitiesInApp } from "../src/db/schema";

const ACTIVITY_NAMES = [
  "soccer",
  "handball",
  "badminton",
  "tennis",
  "tableTennis",
  "basketball",
  "volleyball",
  "beachVolleyball",
  "padel",
  "squash",
  "golf",
  "cricket",
  "americanFootball",
  "rugby",
  "fieldHockey",
  "floorball",
  "ultimateFrisbee",
  "softball",
  "baseball",
  "waterPolo",
  "swimming",
  "rowing",
  "kayaking",
  "canoeing",
  "sailing",
  "windsurfing",
  "kitesurfing",
  "standUpPaddle",
  "scubaDiving",
  "lifesaving",
  "iceHockey",
  "figureSkating",
  "alpineSkiing",
  "crossCountrySkiing",
  "snowboarding",
  "curling",
  "rollerSkating",
  "hiking",
  "climbing",
  "orienteering",
  "athletics",
  "running",
  "marathon",
  "gymnastics",
  "rhythmicGymnastics",
  "trampolining",
  "cheerleading",
  "fitness",
  "aerobics",
  "crossfit",
  "yoga",
  "pilates",
  "weightlifting",
  "powerlifting",
  "roadCycling",
  "mountainBiking",
  "indoorCycling",
  "triathlon",
  "ocr",
  "parkour",
  "boxing",
  "kickboxing",
  "karate",
  "judo",
  "taekwondo",
  "jiuJitsu",
  "brazilianJiuJitsu",
  "wrestling",
  "fencing",
  "kendo",
  "muayThai",
  "mma",
  "aikido",
  "taiChi",
  "kungFu",
  "ballroomDancing",
  "ballet",
  "hipHop",
  "contemporaryDance",
  "salsa",
  "tango",
  "folkDancing",
  "zumba",
  "discoDance",
  "lineDancing",
  "archery",
  "shooting",
  "dart",
  "bowling",
  "billiards",
  "petanque",
  "croquet",
  "horseshoePitching",
  "slotCarRacing",
  "discGolf",
  "horsebackRiding",
  "dressage",
  "showJumping",
  "harnessRacing",
  "eventing",
  "goKarting",
  "motocross",
  "speedway",
  "rallyRacing",
  "formulaRacing",
  "chess",
  "bridge",
  "backgammon",
  "go",
  "checkers",
  "poker",
  "boardGames",
  "rolePlaying",
  "miniatureWargaming",
  "esports",
  "choir",
  "amateurTheater",
  "orchestra",
  "concertBand",
  "marchingBand",
  "musicLessons",
  "vocalTraining",
  "guitarLessons",
  "pianoLessons",
  "violinLessons",
  "scouting",
  "photographyClub",
  "painting",
  "ceramics",
  "woodworking",
  "knitting",
  "break",
  "modelBuilding",
  "philately",
  "numismatics",
  "genealogy",
  "astronony",
  "birdwatching",
  "beekeeping",
  "gardening",
  "huntingClub",
  "angling",
  "fishkeeping",
  "dogTraining",
  "pigeonRacing",
  "volFireDepartment",
  "firstAid",
  "historicalSociety",
  "bookClub",
  "languageClub",
  "debateClub",
  "philosophyClub",
  "investmentClub",
  "entrepreneurshipClub",
  "codingClub",
  "roboticsClub",
  "modelRailways",
  "hamRadio",
  "homebrewingClub",
  "wineTastingSociety",
  "cookingClub",
  "improvisationalTheater",
  "filmClub",
  "artSociety",
  "environmentalOrganization",
  "skateboarding",
  "bmx",
  "rollerHockey",
  "wheelchairBasketball",
  "goalball",
  "synchronizedTrampolining",
  "waterSkiing",
  "wakeboarding",
  "artisticSwimming",
  "eisstockschießen",
  "bobsleigh",
  "luge",
  "hangGliding",
  "gliding",
  "parachuting",
  "modelAircraft",
  "paintball",
  "airsoft",
  "laserTag",
  "hema",
  "seniorCitizens",
  "seniorGymnastics",
  "walkingClub",
  "chairYoga",
  "bingo",
  "seniorBridgeClub",
  "travelClub",
  "handicraft",
  "schoolNetwork",
  "pipeBand",
] as const;

const ACTIVITIES = ACTIVITY_NAMES.map((activity) => ({ activity }));

async function seedActivities(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Add it to your environment before seeding.",
    );
  }

  const client = postgres(databaseUrl, { max: 1, prepare: false });
  const db = drizzle(client, { schema });

  try {
    const inserted = await db
      .insert(activitiesInApp)
      .values(ACTIVITIES.map((row) => ({ ...row, active: true })))
      .onConflictDoNothing({ target: activitiesInApp.activity })
      .returning({
        id: activitiesInApp.id,
        activity: activitiesInApp.activity,
      });

    const all = await db
      .select({
        id: activitiesInApp.id,
        activity: activitiesInApp.activity,
      })
      .from(activitiesInApp)
      .orderBy(activitiesInApp.id);

    console.log(
      `Seeded activities: inserted ${inserted.length} new row(s); ${all.length} total.`,
    );
    for (const row of all) {
      console.log(`  id=${row.id} activity=${row.activity}`);
    }
  } finally {
    await client.end({ timeout: 5 });
  }
}

seedActivities().catch((error: unknown) => {
  console.error("Activities seed failed:", error);
  process.exit(1);
});

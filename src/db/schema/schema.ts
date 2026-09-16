import { pgSchema, foreignKey, bigint, uuid, varchar, boolean, timestamp, check, smallint, unique, date, integer, index, text, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const app = pgSchema("app");
export const genderTypeInApp = app.enum("gender_type", ['male', 'female', 'others'])


export const userSecurityNumbersInApp = app.table("user_security_numbers", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "app.user_security_numbers_id_seq", startWith: 1, increment: 1, minValue: 1, cache: 1 }),
	userId: uuid("user_id").notNull(),
	socialSecurityNumber: varchar("social_security_number", { length: 11 }),
	active: boolean().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersInApp.uuid],
			name: "user_security_numbers_user_id_fkey"
		}).onDelete("cascade"),
]);

export const clubAgeGroupsInApp = app.table("club_age_groups", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "app.club_age_group_id_seq", startWith: 1, increment: 1, minValue: 1, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	clubId: bigint("club_id", { mode: "number" }).notNull(),
	name: varchar({ length: 30 }).notNull(),
	shortName: varchar("short_name", { length: 8 }).notNull(),
	ageMin: smallint("age_min"),
	ageMax: smallint("age_max"),
	active: boolean().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.clubId],
			foreignColumns: [clubsInApp.id],
			name: "club_age_group_club_id_fkey"
		}).onDelete("cascade"),
	check("club_age_group_age_max_check", sql`(age_max > 0) AND (age_max <= 120)`),
	check("club_age_group_age_min_check", sql`(age_min > 0) AND (age_min <= 120)`),
]);

export const clubEmailsInApp = app.table("club_emails", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "app.club_email_id_seq", startWith: 1, increment: 1, minValue: 1, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	clubId: bigint("club_id", { mode: "number" }).notNull(),
	email: varchar({ length: 255 }),
	description: varchar({ length: 30 }),
	sort: smallint("sort"),
	primary: boolean(),
	active: boolean(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.clubId],
			foreignColumns: [clubsInApp.id],
			name: "club_email_club_id_fkey"
		}).onDelete("cascade"),
]);

export const clubQuestionnaireDetailsInApp = app.table("club_questionnaire_details", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "app.club_questionnaire_detail_id_seq", startWith: 1, increment: 1, minValue: 1, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	questionnaireId: bigint("questionnaire_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	languageId: bigint("language_id", { mode: "number" }).notNull(),
	sort: smallint().notNull(),
	question: varchar({ length: 254 }).notNull(),
	active: boolean().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.questionnaireId],
			foreignColumns: [clubQuestionnairesInApp.id],
			name: "club_questionnaire_detail_questionnaire_id_fkey"
		}).onDelete("cascade"),
]);

export const clubWaitlistsInApp = app.table("club_waitlists", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "app.club_waitlist_id_seq", startWith: 1, increment: 1, minValue: 1, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	clubId: bigint("club_id", { mode: "number" }).notNull(),
	waitlist: varchar({ length: 30 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	genderId: bigint("gender_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	questionaryId: bigint("questionary_id", { mode: "number" }),
	active: boolean(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.clubId],
			foreignColumns: [clubsInApp.id],
			name: "club_waitlist_club_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.genderId],
			foreignColumns: [gendersInApp.id],
			name: "club_waitlist_gender_id_fkey"
		}),
	foreignKey({
			columns: [table.questionaryId],
			foreignColumns: [clubQuestionnairesInApp.id],
			name: "club_waitlist_questionary_fkey"
		}),
]);

export const userAddressesInApp = app.table("user_addresses", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "app.address_id_seq", startWith: 1, increment: 1, minValue: 1, cache: 1 }),
	userId: uuid("user_id").notNull(),
	streetName: varchar("street_name", { length: 60 }).notNull(),
	streetNumber: varchar("street_number", { length: 20 }).notNull(),
	zip: varchar({ length: 14 }).notNull(),
	city: varchar({ length: 100 }).notNull(),
	region: varchar({ length: 100 }),
	countryId: uuid("country_id").notNull(),
	primary: boolean().default(false).notNull(),
	active: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersInApp.uuid],
			name: "address_user_id_fkey"
		}).onDelete("cascade"),
]);

export const gendersInApp = app.table("genders", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "app.gender_id_seq", startWith: 1, increment: 1, minValue: 1, cache: 1 }),
	gender: genderTypeInApp().notNull(),
}, (table) => [
	unique("genders_gender_key").on(table.gender),
]);

export const clubPhoneNumbersInApp = app.table("club_phone_numbers", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "app.club_telephone_id_seq", startWith: 1, increment: 1, minValue: 1, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	clubId: bigint("club_id", { mode: "number" }).notNull(),
	countryCode: smallint("country_code"),
	phoneNumber: varchar("phone_number", { length: 14 }),
	description: varchar({ length: 20 }),
	primary: boolean(),
	active: boolean(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.clubId],
			foreignColumns: [clubsInApp.id],
			name: "club_telephone_club_id_fkey"
		}).onDelete("cascade"),
	check("club_telephone_country_code_check", sql`(country_code > 0) AND (country_code <= 999)`),
]);

export const clubQuestionnairesInApp = app.table("club_questionnaires", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "app.club_questionnaire_id_seq", startWith: 1, increment: 1, minValue: 1, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	clubId: bigint("club_id", { mode: "number" }).notNull(),
	questionnaireName: varchar("questionnaire_name", { length: 60 }).notNull(),
	multiLinguistic: boolean("multi_linguistic").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	languageId: bigint("language_id", { mode: "number" }),
	retentionDays: smallint("retention_days").default(90).notNull(),
	active: boolean().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.clubId],
			foreignColumns: [clubsInApp.id],
			name: "club_questionnaire_club_id_fkey"
		}).onDelete("cascade"),
	check("club_questionnaire_language_check", sql`(multi_linguistic = true) OR (language_id IS NOT NULL)`),
	check("club_questionnaire_retention_days_check", sql`(retention_days > 0) AND (retention_days <= 999)`),
]);

export const clubsInApp = app.table("clubs", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "app.clubs_id_seq", startWith: 1, increment: 1, minValue: 1, cache: 1 }),
	name: varchar({ length: 255 }).notNull(),
	shortName: varchar("short_name", { length: 10 }).notNull(),
	establishedDate: date("established_date"),
	active: boolean().default(true).notNull(),
	countryCode: varchar("country_code", { length: 2 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	unique("clubs_short_name_key").on(table.shortName),
]);

export const activitiesInApp = app.table("activities", {
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "app.activities_id_seq", startWith: 1, increment: 1, minValue: 1, cache: 1 }),
	name: varchar({ length: 80 }).notNull(),
	shortName: varchar("short_name", { length: 10 }).notNull(),
	active: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	unique("activities_short_name_key").on(table.shortName),
]);

export const languagesInApp = app.table("languages", {
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "app.languages_id_seq", startWith: 1, increment: 1, minValue: 1, cache: 1 }),
	code: varchar({ length: 15 }).notNull(),
	name: varchar({ length: 80 }).notNull(),
	active: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	unique("languages_code_key").on(table.code),
]);

export const clubAdminsInApp = app.table("club_admins", {
	clubId: bigint("club_id", { mode: "number" }).notNull(),
	userId: uuid("user_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	primaryKey({ columns: [table.clubId, table.userId], name: "club_admins_pkey" }),
	foreignKey({
			columns: [table.clubId],
			foreignColumns: [clubsInApp.id],
			name: "club_admins_club_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersInApp.uuid],
			name: "club_admins_user_id_fkey"
		}).onDelete("cascade"),
]);

export const clubActivitiesInApp = app.table("club_activities", {
	clubId: bigint("club_id", { mode: "number" }).notNull(),
	activityId: bigint("activity_id", { mode: "number" }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	primaryKey({ columns: [table.clubId, table.activityId], name: "club_activities_pkey" }),
	foreignKey({
			columns: [table.clubId],
			foreignColumns: [clubsInApp.id],
			name: "club_activities_club_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.activityId],
			foreignColumns: [activitiesInApp.id],
			name: "club_activities_activity_id_fkey"
		}).onDelete("cascade"),
]);

export const clubLanguagesInApp = app.table("club_languages", {
	clubId: bigint("club_id", { mode: "number" }).notNull(),
	languageId: bigint("language_id", { mode: "number" }).notNull(),
	rank: smallint().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	primaryKey({ columns: [table.clubId, table.languageId], name: "club_languages_pkey" }),
	unique("club_languages_club_id_rank_key").on(table.clubId, table.rank),
	foreignKey({
			columns: [table.clubId],
			foreignColumns: [clubsInApp.id],
			name: "club_languages_club_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.languageId],
			foreignColumns: [languagesInApp.id],
			name: "club_languages_language_id_fkey"
		}).onDelete("cascade"),
	check("club_languages_rank_check", sql`(rank > 0) AND (rank <= 20)`),
]);

export const clubAvatarsInApp = app.table("club_avatars", {
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "app.club_avatar_id_seq", startWith: 1, increment: 1, minValue: 1, cache: 1 }),
	clubId: bigint("club_id", { mode: "number" }).notNull(),
	avatar1: text("avatar1"),
	avatar2: text("avatar2"),
	avatar3: text("avatar3"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.clubId],
			foreignColumns: [clubsInApp.id],
			name: "club_avatars_club_id_fkey"
		}).onDelete("cascade"),
	unique("club_avatars_club_id_key").on(table.clubId),
]);

export const locationGroupsInApp = app.table("location_groups", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "app.location_group_id_seq", startWith: 1, increment: 1, minValue: 1, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	clubId: bigint("club_id", { mode: "number" }).notNull(),
	name: varchar({ length: 80 }).notNull(),
	shortName: varchar("short_name", { length: 10 }).notNull(),
	active: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.clubId],
			foreignColumns: [clubsInApp.id],
			name: "location_group_club_id_fkey"
		}).onDelete("cascade"),
]);

export const locationRelationsInApp = app.table("location_relations", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "app.location_relation_id_seq", startWith: 1, increment: 1, minValue: 1, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	locationGroupId: bigint("location_group_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	locationId: bigint("location_id", { mode: "number" }).notNull(),
	active: boolean().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.locationGroupId],
			foreignColumns: [locationGroupsInApp.id],
			name: "location_relation_location_group_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.locationId],
			foreignColumns: [locationsInApp.id],
			name: "location_relation_location_id_fkey"
		}).onDelete("cascade"),
]);

export const locationsInApp = app.table("locations", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "app.locations_id_seq", startWith: 1, increment: 1, minValue: 1, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	clubId: bigint("club_id", { mode: "number" }).notNull(),
	name: varchar({ length: 60 }).notNull(),
	directions: varchar({ length: 255 }),
	shortName: varchar("short_name", { length: 8 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	clubAddressId: bigint("club_address_id", { mode: "number" }),
	canMemberBook: boolean("can_member_book"),
	canTeamBook: boolean("can_team_book").notNull(),
	memberReqToBook: smallint("member_req_to_book"),
	public: boolean("public").notNull(),
	canFriendshipClubBook: boolean("can_friendship_club_book").notNull(),
	active: boolean().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	parentLocationId: bigint("parent_location_id", { mode: "number" }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.clubAddressId],
			foreignColumns: [clubAddressesInApp.id],
			name: "locations_club_address_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.clubId],
			foreignColumns: [clubsInApp.id],
			name: "locations_club_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.parentLocationId],
			foreignColumns: [table.id],
			name: "locations_parent_location_id_fkey"
		}),
	check("locations_can_member_book_member_req_to_book_check", sql`(can_member_book IS NOT TRUE) OR (member_req_to_book IS NOT NULL)`),
	check("locations_member_req_to_book_check", sql`(member_req_to_book > 0) AND (member_req_to_book <= 30)`),
]);

export const userAliasesInApp = app.table("user_aliases", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "app.alias_id_seq", startWith: 1, increment: 1, minValue: 1, cache: 1 }),
	userId: uuid("user_id").notNull(),
	alias: varchar({ length: 11 }).notNull(),
	primary: boolean().default(false).notNull(),
	active: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersInApp.uuid],
			name: "alias_user_id_fkey"
		}).onDelete("cascade"),
	unique("alias_alias_key").on(table.alias),
]);

export const userEmailsInApp = app.table("user_emails", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "app.mail_id_seq", startWith: 1, increment: 1, minValue: 1, cache: 1 }),
	userId: uuid("user_id").notNull(),
	email: varchar({ length: 254 }),
	primary: boolean().default(false),
	active: boolean().default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersInApp.uuid],
			name: "mail_user_id_fkey"
		}).onDelete("cascade"),
	unique("mail_email_key").on(table.email),
]);

export const userPhoneNumbersInApp = app.table("user_phone_numbers", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "app.phone_id_seq", startWith: 1, increment: 1, minValue: 1, cache: 1 }),
	userId: uuid("user_id").notNull(),
	countryCode: integer("country_code"),
	phoneNumber: varchar("phone_number", { length: 14 }),
	primary: boolean().default(false),
	active: boolean().default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersInApp.uuid],
			name: "phone_user_id_fkey"
		}).onDelete("cascade"),
	unique("user_phone_numbers_country_code_phone_number_unique").on(table.phoneNumber, table.countryCode),
	check("phone_check", sql`(country_code IS NULL) OR (phone_number IS NULL) OR ((length((country_code)::text) + length((phone_number)::text)) <= 14)`),
	check("phone_country_code_check", sql`(country_code > 0) AND (country_code <= 9999)`),
]);

export const usersInApp = app.table("users", {
	uuid: uuid().default(sql`uuidv7()`).primaryKey().notNull(),
	firstname: text(),
	surname: text(),
	nickname: text(),
	dob: date(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	genderId: bigint("gender_id", { mode: "number" }),
	preferredLang: varchar("preferred_lang", { length: 15 }),
	active: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("users_gender_id_idx").using("btree", table.genderId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.genderId],
			foreignColumns: [gendersInApp.id],
			name: "users_gender_id_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const clubAddressesInApp = app.table("club_addresses", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "app.club_address_id_seq", startWith: 1, increment: 1, minValue: 1, cache: 1 }),
	streetName: varchar("street_name", { length: 60 }).notNull(),
	streetNumber: varchar("street_number", { length: 20 }).notNull(),
	zip: varchar({ length: 14 }).notNull(),
	city: varchar({ length: 100 }).notNull(),
	region: varchar({ length: 100 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	countryId: bigint("country_id", { mode: "number" }),
	name: varchar({ length: 60 }).notNull(),
	shortName: varchar("short_name", { length: 20 }).notNull(),
	directions: varchar({ length: 255 }),
	primary: boolean().default(false).notNull(),
	active: boolean().default(true),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	clubId: bigint("club_id", { mode: "number" }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.clubId],
			foreignColumns: [clubsInApp.id],
			name: "club_address_club_id_fkey"
		}),
	check("club_address_primary_active_check", sql`(active IS DISTINCT FROM false) OR ("primary" IS DISTINCT FROM true)`),
]);

export const userCredentialsInApp = app.table("user_credentials", {
	userId: uuid("user_id").primaryKey().notNull(),
	email: varchar({ length: 254 }).notNull(),
	passwordHash: text("password_hash").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersInApp.uuid],
			name: "user_credentials_user_id_fkey"
		}).onDelete("cascade"),
	unique("user_credentials_email_key").on(table.email),
]);

export const authSessionsInApp = app.table("auth_sessions", {
	id: uuid().default(sql`uuidv7()`).primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	tokenHash: text("token_hash").notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	revokedAt: timestamp("revoked_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersInApp.uuid],
			name: "auth_sessions_user_id_fkey"
		}).onDelete("cascade"),
	unique("auth_sessions_token_hash_key").on(table.tokenHash),
	index("auth_sessions_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	index("auth_sessions_expires_at_idx").using("btree", table.expiresAt.asc().nullsLast().op("timestamptz_ops")),
]);

export const passwordResetTokensInApp = app.table("password_reset_tokens", {
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "app.password_reset_token_id_seq", startWith: 1, increment: 1, minValue: 1, cache: 1 }),
	userId: uuid("user_id").notNull(),
	tokenHash: text("token_hash").notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	consumedAt: timestamp("consumed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersInApp.uuid],
			name: "password_reset_tokens_user_id_fkey"
		}).onDelete("cascade"),
	unique("password_reset_tokens_token_hash_key").on(table.tokenHash),
	index("password_reset_tokens_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
]);

export const userAvatarsInApp = app.table("user_avatars", {
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "app.user_avatar_id_seq", startWith: 1, increment: 1, minValue: 1, cache: 1 }),
	userId: uuid("user_id").notNull(),
	avatar1: text("avatar1"),
	avatar2: text("avatar2"),
	avatar3: text("avatar3"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersInApp.uuid],
			name: "user_avatars_user_id_fkey"
		}).onDelete("cascade"),
	unique("user_avatars_user_id_key").on(table.userId),
]);

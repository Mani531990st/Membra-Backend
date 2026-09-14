import { relations } from "drizzle-orm/relations";
import { usersInApp, userSecurityNumbersInApp, clubsInApp, clubAgeGroupsInApp, clubEmailsInApp, clubQuestionnairesInApp, clubQuestionnaireDetailsInApp, clubWaitlistsInApp, gendersInApp, userAddressesInApp, clubPhoneNumbersInApp, locationGroupsInApp, locationRelationsInApp, locationsInApp, clubAddressesInApp, userAliasesInApp, userEmailsInApp, userPhoneNumbersInApp, userCredentialsInApp, authSessionsInApp, passwordResetTokensInApp, userAvatarsInApp, clubAdminsInApp, clubActivitiesInApp, clubLanguagesInApp, clubAvatarsInApp, activitiesInApp, languagesInApp } from "./schema";

export const userSecurityNumbersInAppRelations = relations(userSecurityNumbersInApp, ({one}) => ({
	usersInApp: one(usersInApp, {
		fields: [userSecurityNumbersInApp.userId],
		references: [usersInApp.uuid]
	}),
}));

export const usersInAppRelations = relations(usersInApp, ({one, many}) => ({
	userSecurityNumbersInApps: many(userSecurityNumbersInApp),
	userAddressesInApps: many(userAddressesInApp),
	userAliasesInApps: many(userAliasesInApp),
	userEmailsInApps: many(userEmailsInApp),
	userPhoneNumbersInApps: many(userPhoneNumbersInApp),
	userCredentialsInApp: one(userCredentialsInApp, {
		fields: [usersInApp.uuid],
		references: [userCredentialsInApp.userId]
	}),
	authSessionsInApps: many(authSessionsInApp),
	passwordResetTokensInApps: many(passwordResetTokensInApp),
	userAvatarsInApp: one(userAvatarsInApp, {
		fields: [usersInApp.uuid],
		references: [userAvatarsInApp.userId]
	}),
	clubAdminsInApps: many(clubAdminsInApp),
	gendersInApp: one(gendersInApp, {
		fields: [usersInApp.gender],
		references: [gendersInApp.id]
	}),
}));

export const clubAgeGroupsInAppRelations = relations(clubAgeGroupsInApp, ({one}) => ({
	clubsInApp: one(clubsInApp, {
		fields: [clubAgeGroupsInApp.clubId],
		references: [clubsInApp.id]
	}),
}));

export const clubsInAppRelations = relations(clubsInApp, ({one, many}) => ({
	clubAgeGroupsInApps: many(clubAgeGroupsInApp),
	clubEmailsInApps: many(clubEmailsInApp),
	clubWaitlistsInApps: many(clubWaitlistsInApp),
	clubPhoneNumbersInApps: many(clubPhoneNumbersInApp),
	clubQuestionnairesInApps: many(clubQuestionnairesInApp),
	locationGroupsInApps: many(locationGroupsInApp),
	locationsInApps: many(locationsInApp),
	clubAddressesInApps: many(clubAddressesInApp),
	clubAdminsInApps: many(clubAdminsInApp),
	clubActivitiesInApps: many(clubActivitiesInApp),
	clubLanguagesInApps: many(clubLanguagesInApp),
	clubAvatarsInApp: one(clubAvatarsInApp, {
		fields: [clubsInApp.id],
		references: [clubAvatarsInApp.clubId]
	}),
}));

export const activitiesInAppRelations = relations(activitiesInApp, ({many}) => ({
	clubActivitiesInApps: many(clubActivitiesInApp),
}));

export const languagesInAppRelations = relations(languagesInApp, ({many}) => ({
	clubLanguagesInApps: many(clubLanguagesInApp),
}));

export const clubAdminsInAppRelations = relations(clubAdminsInApp, ({one}) => ({
	clubsInApp: one(clubsInApp, {
		fields: [clubAdminsInApp.clubId],
		references: [clubsInApp.id]
	}),
	usersInApp: one(usersInApp, {
		fields: [clubAdminsInApp.userId],
		references: [usersInApp.uuid]
	}),
}));

export const clubActivitiesInAppRelations = relations(clubActivitiesInApp, ({one}) => ({
	clubsInApp: one(clubsInApp, {
		fields: [clubActivitiesInApp.clubId],
		references: [clubsInApp.id]
	}),
	activitiesInApp: one(activitiesInApp, {
		fields: [clubActivitiesInApp.activityId],
		references: [activitiesInApp.id]
	}),
}));

export const clubLanguagesInAppRelations = relations(clubLanguagesInApp, ({one}) => ({
	clubsInApp: one(clubsInApp, {
		fields: [clubLanguagesInApp.clubId],
		references: [clubsInApp.id]
	}),
	languagesInApp: one(languagesInApp, {
		fields: [clubLanguagesInApp.languageId],
		references: [languagesInApp.id]
	}),
}));

export const clubAvatarsInAppRelations = relations(clubAvatarsInApp, ({one}) => ({
	clubsInApp: one(clubsInApp, {
		fields: [clubAvatarsInApp.clubId],
		references: [clubsInApp.id]
	}),
}));

export const clubEmailsInAppRelations = relations(clubEmailsInApp, ({one}) => ({
	clubsInApp: one(clubsInApp, {
		fields: [clubEmailsInApp.clubId],
		references: [clubsInApp.id]
	}),
}));

export const clubQuestionnaireDetailsInAppRelations = relations(clubQuestionnaireDetailsInApp, ({one}) => ({
	clubQuestionnairesInApp: one(clubQuestionnairesInApp, {
		fields: [clubQuestionnaireDetailsInApp.questionnaireId],
		references: [clubQuestionnairesInApp.id]
	}),
}));

export const clubQuestionnairesInAppRelations = relations(clubQuestionnairesInApp, ({one, many}) => ({
	clubQuestionnaireDetailsInApps: many(clubQuestionnaireDetailsInApp),
	clubWaitlistsInApps: many(clubWaitlistsInApp),
	clubsInApp: one(clubsInApp, {
		fields: [clubQuestionnairesInApp.clubId],
		references: [clubsInApp.id]
	}),
}));

export const clubWaitlistsInAppRelations = relations(clubWaitlistsInApp, ({one}) => ({
	clubsInApp: one(clubsInApp, {
		fields: [clubWaitlistsInApp.clubId],
		references: [clubsInApp.id]
	}),
	gendersInApp: one(gendersInApp, {
		fields: [clubWaitlistsInApp.genderId],
		references: [gendersInApp.id]
	}),
	clubQuestionnairesInApp: one(clubQuestionnairesInApp, {
		fields: [clubWaitlistsInApp.questionaryId],
		references: [clubQuestionnairesInApp.id]
	}),
}));

export const gendersInAppRelations = relations(gendersInApp, ({many}) => ({
	clubWaitlistsInApps: many(clubWaitlistsInApp),
	usersInApps: many(usersInApp),
}));

export const userAddressesInAppRelations = relations(userAddressesInApp, ({one}) => ({
	usersInApp: one(usersInApp, {
		fields: [userAddressesInApp.userId],
		references: [usersInApp.uuid]
	}),
}));

export const clubPhoneNumbersInAppRelations = relations(clubPhoneNumbersInApp, ({one}) => ({
	clubsInApp: one(clubsInApp, {
		fields: [clubPhoneNumbersInApp.clubId],
		references: [clubsInApp.id]
	}),
}));

export const locationGroupsInAppRelations = relations(locationGroupsInApp, ({one, many}) => ({
	clubsInApp: one(clubsInApp, {
		fields: [locationGroupsInApp.clubId],
		references: [clubsInApp.id]
	}),
	locationRelationsInApps: many(locationRelationsInApp),
}));

export const locationRelationsInAppRelations = relations(locationRelationsInApp, ({one}) => ({
	locationGroupsInApp: one(locationGroupsInApp, {
		fields: [locationRelationsInApp.locationGroupId],
		references: [locationGroupsInApp.id]
	}),
	locationsInApp: one(locationsInApp, {
		fields: [locationRelationsInApp.locationId],
		references: [locationsInApp.id]
	}),
}));

export const locationsInAppRelations = relations(locationsInApp, ({one, many}) => ({
	locationRelationsInApps: many(locationRelationsInApp),
	clubAddressesInApp: one(clubAddressesInApp, {
		fields: [locationsInApp.clubAddressId],
		references: [clubAddressesInApp.id]
	}),
	clubsInApp: one(clubsInApp, {
		fields: [locationsInApp.clubId],
		references: [clubsInApp.id]
	}),
	locationsInApp: one(locationsInApp, {
		fields: [locationsInApp.parentLocationId],
		references: [locationsInApp.id],
		relationName: "locationsInApp_parentLocationId_locationsInApp_id"
	}),
	locationsInApps: many(locationsInApp, {
		relationName: "locationsInApp_parentLocationId_locationsInApp_id"
	}),
}));

export const clubAddressesInAppRelations = relations(clubAddressesInApp, ({one, many}) => ({
	locationsInApps: many(locationsInApp),
	clubsInApp: one(clubsInApp, {
		fields: [clubAddressesInApp.clubId],
		references: [clubsInApp.id]
	}),
}));

export const userAliasesInAppRelations = relations(userAliasesInApp, ({one}) => ({
	usersInApp: one(usersInApp, {
		fields: [userAliasesInApp.userId],
		references: [usersInApp.uuid]
	}),
}));

export const userEmailsInAppRelations = relations(userEmailsInApp, ({one}) => ({
	usersInApp: one(usersInApp, {
		fields: [userEmailsInApp.userId],
		references: [usersInApp.uuid]
	}),
}));

export const userPhoneNumbersInAppRelations = relations(userPhoneNumbersInApp, ({one}) => ({
	usersInApp: one(usersInApp, {
		fields: [userPhoneNumbersInApp.userId],
		references: [usersInApp.uuid]
	}),
}));

export const userCredentialsInAppRelations = relations(userCredentialsInApp, ({one}) => ({
	usersInApp: one(usersInApp, {
		fields: [userCredentialsInApp.userId],
		references: [usersInApp.uuid]
	}),
}));

export const authSessionsInAppRelations = relations(authSessionsInApp, ({one}) => ({
	usersInApp: one(usersInApp, {
		fields: [authSessionsInApp.userId],
		references: [usersInApp.uuid]
	}),
}));

export const passwordResetTokensInAppRelations = relations(passwordResetTokensInApp, ({one}) => ({
	usersInApp: one(usersInApp, {
		fields: [passwordResetTokensInApp.userId],
		references: [usersInApp.uuid]
	}),
}));

export const userAvatarsInAppRelations = relations(userAvatarsInApp, ({one}) => ({
	usersInApp: one(usersInApp, {
		fields: [userAvatarsInApp.userId],
		references: [usersInApp.uuid]
	}),
}));

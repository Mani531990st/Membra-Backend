export type GenderEnum = "male" | "female" | "others";

export type AuthSessionContext = {
  id: string;
  userId: string;
};

export type IssuedSession = {
  rawToken: string;
  expiresAt: Date;
};

export type SafeAuthUser = {
  uuid: string;
  email: string;
  firstname: string | null;
  surname: string | null;
  nickname: string | null;
  dob: string | null;
  gender: GenderEnum | null;
  preferred_lang: string | null;
  profileComplete: boolean;
};

export type AuthUserRow = {
  uuid: string;
  firstname: string | null;
  surname: string | null;
  nickname: string | null;
  dob: string | null;
  gender: number | null;
  preferredLang: string | null;
  email: string;
  genderEnum: GenderEnum | null;
  passwordHash: string | null;
};

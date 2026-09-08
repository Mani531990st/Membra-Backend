export type GenderEnum = "male" | "female" | "others";

export type SafeAuthUser = {
  uuid: string;
  email: string;
  firstname: string;
  surname: string;
  nickname: string;
  dob: string;
  gender: GenderEnum;
  preferred_lang: string;
};

export type AuthUserRow = {
  uuid: string;
  firstname: string;
  surname: string;
  nickname: string;
  dob: string;
  gender: number;
  preferredLang: string;
  email: string;
  genderEnum: GenderEnum;
  passwordHash: string | null;
};

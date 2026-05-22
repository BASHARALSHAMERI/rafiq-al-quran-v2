export type Role =
  | "SUPER_ADMIN"
  | "CENTER_ADMIN"
  | "SUPERVISOR"
  | "TEACHER"
  | "PARENT"
  | "STUDENT";

export type AuthUser = {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  avatarUrl?: string | null;
  organizationName?: string;
  organizationLogoUrl?: string | null;
};

export type LoginPayload = {
  identifier: string;
  password: string;
};

export type CheckUserPayload = {
  identifier: string;
};

export type CheckUserResponse = {
  exists: boolean;
  hasPassword?: boolean;
};

export type SetupPasswordPayload = {
  identifier: string;
  newPassword: string;
};

export type ForgotPasswordPayload = {
  identifier: string;
};

export type ResetPasswordPayload = {
  token: string;
  newPassword: string;
};

export type AuthSessionResponse = {
  accessToken: string;
  accessExpiresIn: string;
  refreshToken?: string;
  user: AuthUser;
};

export type ActivateAccountPayload = {
  token: string;
  newPassword: string;
};

export type ActivationTokenResponse = {
  valid: boolean;
  alreadyActive?: boolean;
  user?: {
    fullName: string;
    email: string;
  };
};

import { Role } from "@prisma/client";

export type TokenType = "access" | "refresh";

export interface JwtAuthPayload {
  sub: number;
  role: Role;
  organizationId: number;
  type: TokenType;
  jti?: string;
  iat?: number;
  exp?: number;
}

export interface AuthUserContext {
  userId: number;
  role: Role;
  organizationId: number;
}

export interface ScopeContext extends AuthUserContext {
  allAccess: boolean;
  centerIds: number[];
  circleIds: number[];
  studentIds: number[];
}
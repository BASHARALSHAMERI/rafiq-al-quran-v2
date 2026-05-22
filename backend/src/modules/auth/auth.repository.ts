import { ActivityType, type Prisma } from "@prisma/client";
import { prisma } from "../../shared/db/prisma";
import { activeUserWhere } from "../../shared/policies/active-read.policy";
import type { ParsedLoginIdentifier } from "../../shared/utils/identifier";

const authUserSelect = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  organizationId: true,
  passwordHash: true,
  isActive: true,
  accountStatus: true,
  profile: {
    select: {
      avatarUrl: true,
      phoneNormalized: true,
      gender: true
    }
  },
  organization: {
    select: {
      id: true,
      name: true,
      logoUrl: true
    }
  }
} satisfies Prisma.UserSelect;

export type AuthUser = Prisma.UserGetPayload<{
  select: typeof authUserSelect;
}>;

export const authRepository = {
  findByIdentifier(identifier: ParsedLoginIdentifier) {
    if (identifier.kind === "invalid") {
      return Promise.resolve(null);
    }

    const whereByIdentifier: Prisma.UserWhereInput =
      identifier.kind === "email"
        ? { email: identifier.normalized }
        : { profile: { phoneNormalized: identifier.normalized } };

    return prisma.user.findFirst({
      where: activeUserWhere(whereByIdentifier),
      select: authUserSelect
    });
  },

  findById(userId: number) {
    return prisma.user.findFirst({
      where: activeUserWhere({ id: userId }),
      select: authUserSelect
    });
  },

  createRefreshToken(input: {
    userId: number;
    tokenHash: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }) {
    return prisma.refreshToken.create({
      data: {
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress
      }
    });
  },

  findValidRefreshTokenByHash(tokenHash: string) {
    return prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: {
          gt: new Date()
        },
        user: activeUserWhere()
      },
      include: {
        user: {
          select: authUserSelect
        }
      }
    });
  },

  markRefreshTokenUsed(tokenId: number) {
    return prisma.refreshToken.update({
      where: { id: tokenId },
      data: {
        lastUsedAt: new Date()
      }
    });
  },

  revokeRefreshToken(tokenId: number) {
    return prisma.refreshToken.updateMany({
      where: {
        id: tokenId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });
  },

  revokeRefreshTokenByHash(tokenHash: string) {
    return prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });
  },

  revokeAllRefreshTokensByUserId(userId: number) {
    return prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });
  },

  createPasswordResetToken(input: {
    userId: number;
    tokenHash: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }) {
    return prisma.passwordResetToken.create({
      data: {
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress
      }
    });
  },

  findValidPasswordResetTokenByHash(tokenHash: string) {
    return prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: {
          gt: new Date()
        },
        user: activeUserWhere()
      },
      include: {
        user: {
          select: authUserSelect
        }
      }
    });
  },

  consumePasswordResetToken(input: { tokenId: number; userId: number }) {
    return prisma.passwordResetToken.updateMany({
      where: {
        id: input.tokenId,
        userId: input.userId,
        usedAt: null,
        expiresAt: {
          gt: new Date()
        }
      },
      data: {
        usedAt: new Date()
      }
    });
  },

  updateUserPassword(userId: number, passwordHash: string) {
    return prisma.user.update({
      where: {
        id: userId
      },
      data: {
        passwordHash
      }
    });
  },

  resetPasswordWithToken(input: { tokenId: number; userId: number; passwordHash: string }) {
    return prisma.$transaction(async (tx) => {
      const consumed = await tx.passwordResetToken.updateMany({
        where: {
          id: input.tokenId,
          userId: input.userId,
          usedAt: null,
          expiresAt: {
            gt: new Date()
          }
        },
        data: {
          usedAt: new Date()
        }
      });

      if (consumed.count === 0) {
        return { applied: false as const };
      }

      await tx.user.update({
        where: {
          id: input.userId
        },
        data: {
          passwordHash: input.passwordHash
        }
      });

      await tx.refreshToken.updateMany({
        where: {
          userId: input.userId,
          revokedAt: null
        },
        data: {
          revokedAt: new Date()
        }
      });

      return { applied: true as const };
    });
  },

  markUserLastLogin(userId: number) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date()
      }
    });
  },

  createActivityLog(input: {
    organizationId: number;
    userId: number;
    activityType: ActivityType;
    message: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    return prisma.activityLog.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        activityType: input.activityType,
        entityType: "auth",
        message: input.message,
        metadata: input.metadata
      }
    });
  },

  findValidActivationTokenByHash(tokenHash: string) {
    return prisma.user.findFirst({
      where: {
        activationTokenHash: tokenHash,
        accountStatus: "INVITED",
        activationTokenExpiresAt: {
          gt: new Date()
        },
        isActive: true
      },
      select: authUserSelect
    });
  },

  findUserByActivationTokenHash(tokenHash: string) {
    return prisma.user.findFirst({
      where: {
        activationTokenHash: tokenHash,
        isActive: true
      },
      select: {
        id: true,
        accountStatus: true
      }
    });
  },

  consumeActivationToken(input: { userId: number; tokenHash: string; passwordHash: string }) {
    return prisma.user.updateMany({
      where: {
        id: input.userId,
        activationTokenHash: input.tokenHash,
        accountStatus: "INVITED",
        isActive: true,
        activationTokenExpiresAt: {
          gt: new Date()
        }
      },
      data: {
        passwordHash: input.passwordHash,
        accountStatus: "ACTIVE",
        activatedAt: new Date(),
        activationTokenHash: null,
        activationTokenExpiresAt: null
      }
    });
  }
};

import {
  EmploymentStatus,
  EnrollmentStatus,
  Gender,
  KhatmType,
  ParentProfileRelationType,
  ParentRelationType,
  RiwayaType,
  StudentLevel,
  StudentProfileStatus,
  SupervisorProfileStatus,
  FollowUpType,
  type Prisma,
  type PrismaClient,
  type Role
} from "@prisma/client";
import { prisma } from "../../shared/db/prisma";
import {
  activeCenterWhere,
  activeCircleWhere,
  activeUserWhere
} from "../../shared/policies/active-read.policy";

type FindUsersInput = {
  organizationId: number;
  role?: Role;
  userIds?: number[];
  includeInactive?: boolean;
};

type FindUserByIdInput = {
  organizationId: number;
  userId: number;
  includeInactive?: boolean;
};

type FindScopedUserByIdInput = FindUserByIdInput & {
  centerIds: number[];
  circleIds: number[];
  actorUserId: number;
};

type UserCommonProfileWriteInput = {
  fullName: string;
  gender: Gender;
  birthDate?: Date | null;
  phone?: string | null;
  phoneNormalized?: string | null;
  address?: string | null;
  avatarUrl?: string | null;
};

type UserCommonProfileUpdateInput = Partial<UserCommonProfileWriteInput>;

type TeacherProfileWriteInput = {
  hireDate?: Date | null;
  khatmType?: KhatmType | null;
  riwaya?: RiwayaType | null;
  educationLevel?: string | null;
  yearsExperience?: number | null;
};

type SupervisorProfileWriteInput = {
  assignedAt?: Date | null;
  status?: SupervisorProfileStatus;
  educationLevel?: string | null;
  yearsExperience?: number | null;
  quranQualification?: KhatmType | null;
  professionalNotes?: string | null;
};

type CenterAdminProfileWriteInput = {
  assignedAt?: Date | null;
  employmentStatus?: EmploymentStatus;
  educationLevel?: string | null;
  yearsExperience?: number | null;
  administrativeExperienceYears?: number | null;
  professionalNotes?: string | null;
};

type StudentProfileWriteInput = {
  nickname?: string | null;
  nationalId?: string | null;
  level?: StudentLevel;
  studentStatus?: StudentProfileStatus;
  joinDate?: Date | null;
};

type ParentProfileWriteInput = {
  relationType?: ParentProfileRelationType | null;
};

type ParentChildLinkWriteInput = {
  studentId: number;
  relationType?: ParentRelationType;
};

type StudentEnrollmentWriteInput = {
  circleId: number;
  startDate?: Date;
};

type UserLinksSyncInput = {
  centerIds?: number[];
  circleIds?: number[];
  children?: ParentChildLinkWriteInput[];
  enrollments?: StudentEnrollmentWriteInput[];
};

type CreateUserWithDetailsInput = {
  organizationId: number;
  createdByUserId?: number;
  email: string;
  username?: string | null;
  fullName: string;
  role: Role;
  passwordHash?: string | null;
  isActive: boolean;
  profile: UserCommonProfileWriteInput;
  teacherProfile?: TeacherProfileWriteInput;
  supervisorProfile?: SupervisorProfileWriteInput;
  centerAdminProfile?: CenterAdminProfileWriteInput;
  studentProfile?: StudentProfileWriteInput;
  parentProfile?: ParentProfileWriteInput;
  links?: UserLinksSyncInput;
  accountStatus?: "INVITED" | "ACTIVE" | "SUSPENDED";
  activationTokenHash?: string | null;
  activationTokenExpiresAt?: Date | null;
  activationSentAt?: Date | null;
  activatedAt?: Date | null;
};

type UpdateUserWithDetailsInput = {
  userId: number;
  email?: string;
  username?: string | null;
  fullName?: string;
  profile?: UserCommonProfileUpdateInput;
  teacherProfile?: TeacherProfileWriteInput;
  supervisorProfile?: SupervisorProfileWriteInput;
  centerAdminProfile?: CenterAdminProfileWriteInput;
  studentProfile?: StudentProfileWriteInput;
  parentProfile?: ParentProfileWriteInput;
  links?: UserLinksSyncInput;
};

const baseUserSelect = {
  id: true,
  fullName: true,
  email: true,
  username: true,
  role: true,
  isActive: true,
  accountStatus: true,
  lastLoginAt: true,
  createdByUserId: true,
  createdAt: true,
  updatedAt: true,
  profile: {
    select: {
      userId: true,
      fullName: true,
      gender: true,
      birthDate: true,
      phone: true,
      address: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true
    }
  },
  teacherProfile: {
    select: {
      hireDate: true,
      khatmType: true,
      riwaya: true,
      educationLevel: true,
      yearsExperience: true,
      createdAt: true,
      updatedAt: true
    }
  },
  supervisorProfile: {
    select: {
      assignedAt: true,
      status: true,
      educationLevel: true,
      yearsExperience: true,
      quranQualification: true,
      professionalNotes: true,
      createdAt: true,
      updatedAt: true
    }
  },
  centerAdminProfile: {
    select: {
      assignedAt: true,
      employmentStatus: true,
      educationLevel: true,
      yearsExperience: true,
      administrativeExperienceYears: true,
      professionalNotes: true,
      createdAt: true,
      updatedAt: true
    }
  },
  studentProfile: {
    select: {
      nickname: true,
      level: true,
      currentJuzz: true,
      studentStatus: true,
      joinDate: true,
      createdAt: true,
      updatedAt: true
    }
  },
  parentProfile: {
    select: {
      relationType: true,
      createdAt: true,
      updatedAt: true
    }
  },
  centerAccesses: {
    select: {
      centerId: true
    }
  },
  circleAccesses: {
    select: {
      circleId: true
    }
  },
  studentEnrollments: {
    where: {
      status: EnrollmentStatus.ACTIVE
    },
    select: {
      circleId: true,
      circle: {
        select: {
          id: true,
          name: true,
          center: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  },
  childLinks: {
    select: {
      parentId: true
    }
  },
  parentLinks: {
    select: {
      studentId: true,
      relationType: true
    }
  }
} satisfies Prisma.UserSelect;

const detailedUserSelect = {
  ...baseUserSelect,
  centerAccesses: {
    select: {
      centerId: true,
      center: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    }
  },
  circleAccesses: {
    select: {
      circleId: true,
      circle: {
        select: {
          id: true,
          name: true,
          centerId: true
        }
      }
    }
  },
  studentEnrollments: {
    where: {
      status: EnrollmentStatus.ACTIVE
    },
    select: {
      circleId: true,
      status: true,
      startDate: true,
      endDate: true,
      circle: {
        select: {
          id: true,
          name: true,
          centerId: true
        }
      }
    }
  },
  parentLinks: {
    select: {
      studentId: true,
      relationType: true,
      student: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profile: {
            select: {
              fullName: true
            }
          }
        }
      }
    }
  },
  childLinks: {
    select: {
      parentId: true,
      parent: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profile: {
            select: {
              fullName: true
            }
          }
        }
      }
    }
  }
} satisfies Prisma.UserSelect;

const resolveRoleProfile = (user: {
  role: Role;
  teacherProfile?: unknown;
  supervisorProfile?: unknown;
  centerAdminProfile?: unknown;
  studentProfile?: unknown;
  parentProfile?: unknown;
}) => {
  switch (user.role) {
    case "TEACHER":
      return user.teacherProfile ?? null;
    case "SUPERVISOR":
      return user.supervisorProfile ?? null;
    case "CENTER_ADMIN":
      return user.centerAdminProfile ?? null;
    case "STUDENT":
      return user.studentProfile ?? null;
    case "PARENT":
      return user.parentProfile ?? null;
    case "SUPER_ADMIN":
    case "ACCOUNTANT":
      return null;
  }
};

const syncLegacyNameMirrors = <T extends Record<string, any>>(user: T): T => {
  if (!user) return user;

  const profileFullName = user.profile?.fullName;
  const normalizedRootFullName =
    typeof profileFullName === "string" && profileFullName.trim().length > 0
      ? profileFullName
      : user.fullName;

  const normalizedParentLinks = Array.isArray(user.parentLinks)
    ? user.parentLinks.map((link: any) => ({
        ...link,
        student: link.student
          ? {
              ...link.student,
              fullName: link.student.profile?.fullName ?? link.student.fullName
            }
          : link.student
      }))
    : user.parentLinks;

  const normalizedChildLinks = Array.isArray(user.childLinks)
    ? user.childLinks.map((link: any) => ({
        ...link,
        parent: link.parent
          ? {
              ...link.parent,
              fullName: link.parent.profile?.fullName ?? link.parent.fullName
            }
          : link.parent
      }))
    : user.childLinks;

  return {
    ...user,
    fullName: normalizedRootFullName,
    roleProfile: resolveRoleProfile(user as unknown as { role: Role }),
    parentLinks: normalizedParentLinks,
    childLinks: normalizedChildLinks
  };
};

const scopedUserWhere = (input: FindScopedUserByIdInput): Prisma.UserWhereInput => {
  const centerIds = input.centerIds;
  const circleIds = input.circleIds;

  return {
    organizationId: input.organizationId,
    id: input.userId,
    OR: [
      {
        id: input.actorUserId
      },
      ...(centerIds.length
        ? [
            {
              centerAccesses: {
                some: {
                  centerId: {
                    in: centerIds
                  }
                }
              }
            }
          ]
        : []),
      ...(circleIds.length
        ? [
            {
              circleAccesses: {
                some: {
                  circleId: {
                    in: circleIds
                  }
                }
              }
            },
            {
              taughtCircles: {
                some: {
                  id: {
                    in: circleIds
                  }
                }
              }
            },
            {
              studentEnrollments: {
                some: {
                  status: EnrollmentStatus.ACTIVE,
                  circleId: {
                    in: circleIds
                  }
                }
              }
            },
            {
              parentLinks: {
                some: {
                  student: {
                    studentEnrollments: {
                      some: {
                        status: EnrollmentStatus.ACTIVE,
                        circleId: {
                          in: circleIds
                        }
                      }
                    }
                  }
                }
              }
            }
          ]
        : [])
    ]
  };
};

const getClient = (tx?: Prisma.TransactionClient): PrismaClient | Prisma.TransactionClient => {
  return tx ?? prisma;
};

const uniqueIds = (ids: number[]) => [...new Set(ids.filter((id) => Number.isInteger(id) && id > 0))];

const pickDefined = <T extends Record<string, unknown>>(value: T) =>
  Object.fromEntries(Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined));

const syncCenterAccesses = async (tx: Prisma.TransactionClient, userId: number, centerIds: number[]) => {
  const nextIds = uniqueIds(centerIds);

  await tx.userCenterAccess.deleteMany({
    where: nextIds.length
      ? {
          userId,
          centerId: {
            notIn: nextIds
          }
        }
      : { userId }
  });

  if (!nextIds.length) {
    return;
  }

  await tx.userCenterAccess.createMany({
    data: nextIds.map((centerId) => ({ userId, centerId })),
    skipDuplicates: true
  });
};

const syncCircleAccesses = async (tx: Prisma.TransactionClient, userId: number, circleIds: number[]) => {
  const nextIds = uniqueIds(circleIds);

  await tx.userCircleAccess.deleteMany({
    where: nextIds.length
      ? {
          userId,
          circleId: {
            notIn: nextIds
          }
        }
      : { userId }
  });

  if (!nextIds.length) {
    return;
  }

  await tx.userCircleAccess.createMany({
    data: nextIds.map((circleId) => ({ userId, circleId })),
    skipDuplicates: true
  });
};

const syncParentLinks = async (
  tx: Prisma.TransactionClient,
  parentId: number,
  children: ParentChildLinkWriteInput[],
  createdByUserId?: number
) => {
  const nextLinks = new Map<number, ParentRelationType>();
  for (const child of children) {
    nextLinks.set(child.studentId, child.relationType ?? ParentRelationType.GUARDIAN);
  }

  const nextStudentIds = [...nextLinks.keys()];

  await tx.parentStudentLink.deleteMany({
    where: nextStudentIds.length
      ? {
          parentId,
          studentId: {
            notIn: nextStudentIds
          }
        }
      : { parentId }
  });

  for (const [studentId, relationType] of nextLinks.entries()) {
    await tx.parentStudentLink.upsert({
      where: {
        parentId_studentId: {
          parentId,
          studentId
        }
      },
      create: {
        parentId,
        studentId,
        relationType,
        createdByUserId: createdByUserId ?? null
      },
      update: {
        relationType
      }
    });
  }
};

const syncStudentEnrollments = async (
  tx: Prisma.TransactionClient,
  studentId: number,
  enrollments: StudentEnrollmentWriteInput[]
) => {
  const unique = new Map<number, Date | undefined>();
  for (const enrollment of enrollments) {
    unique.set(enrollment.circleId, enrollment.startDate);
  }

  const nextCircleIds = [...unique.keys()];

  await tx.studentCircleEnrollment.deleteMany({
    where: {
      studentId,
      status: EnrollmentStatus.ACTIVE,
      ...(nextCircleIds.length
        ? {
            circleId: {
              notIn: nextCircleIds
            }
          }
        : {})
    }
  });

  for (const [circleId, startDate] of unique.entries()) {
    await tx.studentCircleEnrollment.upsert({
      where: {
        studentId_circleId: {
          studentId,
          circleId
        }
      },
      create: {
        studentId,
        circleId,
        status: EnrollmentStatus.ACTIVE,
        startDate: startDate ?? new Date()
      },
      update: {
        status: EnrollmentStatus.ACTIVE,
        ...(startDate ? { startDate } : {})
      }
    });
  }
};

const createRoleProfileForUser = async (
  tx: Prisma.TransactionClient,
  input: {
    userId: number;
    role: Role;
    createdByUserId?: number;
    teacherProfile?: TeacherProfileWriteInput;
    supervisorProfile?: SupervisorProfileWriteInput;
    centerAdminProfile?: CenterAdminProfileWriteInput;
    studentProfile?: StudentProfileWriteInput;
    parentProfile?: ParentProfileWriteInput;
  }
) => {
  switch (input.role) {
    case "TEACHER":
      await tx.teacherProfile.create({
        data: {
          userId: input.userId,
          createdByUserId: input.createdByUserId ?? null,
          ...pickDefined({
            hireDate: input.teacherProfile?.hireDate ?? null,
            khatmType: input.teacherProfile?.khatmType ?? null,
            riwaya: input.teacherProfile?.riwaya ?? null,
            educationLevel: input.teacherProfile?.educationLevel ?? null,
            yearsExperience: input.teacherProfile?.yearsExperience ?? null
          })
        }
      });
      break;
    case "SUPERVISOR":
      await tx.supervisorProfile.create({
        data: {
          userId: input.userId,
          createdByUserId: input.createdByUserId ?? null,
          ...pickDefined({
            assignedAt: input.supervisorProfile?.assignedAt ?? null,
            status: input.supervisorProfile?.status ?? SupervisorProfileStatus.ACTIVE,
            educationLevel: input.supervisorProfile?.educationLevel ?? null,
            yearsExperience: input.supervisorProfile?.yearsExperience ?? null,
            quranQualification: input.supervisorProfile?.quranQualification ?? null,
            professionalNotes: input.supervisorProfile?.professionalNotes ?? null
          })
        }
      });
      break;
    case "CENTER_ADMIN":
      await tx.centerAdminProfile.create({
        data: {
          userId: input.userId,
          createdByUserId: input.createdByUserId ?? null,
          ...pickDefined({
            assignedAt: input.centerAdminProfile?.assignedAt ?? null,
            employmentStatus: input.centerAdminProfile?.employmentStatus ?? EmploymentStatus.ACTIVE,
            educationLevel: input.centerAdminProfile?.educationLevel ?? null,
            yearsExperience: input.centerAdminProfile?.yearsExperience ?? null,
            administrativeExperienceYears: input.centerAdminProfile?.administrativeExperienceYears ?? null,
            professionalNotes: input.centerAdminProfile?.professionalNotes ?? null
          })
        }
      });
      break;
    case "STUDENT":
      await tx.studentProfile.create({
        data: {
          userId: input.userId,
          createdByUserId: input.createdByUserId ?? null,
          ...pickDefined({
            nickname: input.studentProfile?.nickname ?? null,
            nationalId: input.studentProfile?.nationalId ?? null,
            level: input.studentProfile?.level ?? StudentLevel.BEGINNER,
            studentStatus: input.studentProfile?.studentStatus ?? StudentProfileStatus.REGULAR,
            joinDate: input.studentProfile?.joinDate ?? null
          })
        }
      });
      break;
    case "PARENT":
      await tx.parentProfile.create({
        data: {
          userId: input.userId,
          createdByUserId: input.createdByUserId ?? null,
          ...pickDefined({
            relationType: input.parentProfile?.relationType ?? null
          })
        }
      });
      break;
    case "SUPER_ADMIN":
    case "ACCOUNTANT":
      break;
  }
};

const updateRoleProfileForUser = async (
  tx: Prisma.TransactionClient,
  input: {
    userId: number;
    role: Role;
    createdByUserId?: number;
    teacherProfile?: TeacherProfileWriteInput;
    supervisorProfile?: SupervisorProfileWriteInput;
    centerAdminProfile?: CenterAdminProfileWriteInput;
    studentProfile?: StudentProfileWriteInput;
    parentProfile?: ParentProfileWriteInput;
  }
) => {
  switch (input.role) {
    case "TEACHER":
      if (!input.teacherProfile) return;
      await tx.teacherProfile.upsert({
        where: { userId: input.userId },
        create: {
          userId: input.userId,
          createdByUserId: input.createdByUserId ?? null,
          ...pickDefined({
            hireDate: input.teacherProfile.hireDate ?? null,
            khatmType: input.teacherProfile.khatmType ?? null,
            riwaya: input.teacherProfile.riwaya ?? null,
            educationLevel: input.teacherProfile.educationLevel ?? null,
            yearsExperience: input.teacherProfile.yearsExperience ?? null
          })
        },
        update: pickDefined({
          hireDate: input.teacherProfile.hireDate,
          khatmType: input.teacherProfile.khatmType,
          riwaya: input.teacherProfile.riwaya,
          educationLevel: input.teacherProfile.educationLevel,
          yearsExperience: input.teacherProfile.yearsExperience
        })
      });
      return;
    case "SUPERVISOR":
      if (!input.supervisorProfile) return;
      await tx.supervisorProfile.upsert({
        where: { userId: input.userId },
        create: {
          userId: input.userId,
          createdByUserId: input.createdByUserId ?? null,
          status: input.supervisorProfile.status ?? SupervisorProfileStatus.ACTIVE,
          ...pickDefined({
            assignedAt: input.supervisorProfile.assignedAt ?? null,
            educationLevel: input.supervisorProfile.educationLevel ?? null,
            yearsExperience: input.supervisorProfile.yearsExperience ?? null,
            quranQualification: input.supervisorProfile.quranQualification ?? null,
            professionalNotes: input.supervisorProfile.professionalNotes ?? null
          })
        },
        update: pickDefined({
          assignedAt: input.supervisorProfile.assignedAt,
          status: input.supervisorProfile.status,
          educationLevel: input.supervisorProfile.educationLevel,
          yearsExperience: input.supervisorProfile.yearsExperience,
          quranQualification: input.supervisorProfile.quranQualification,
          professionalNotes: input.supervisorProfile.professionalNotes
        })
      });
      return;
    case "CENTER_ADMIN":
      if (!input.centerAdminProfile) return;
      await tx.centerAdminProfile.upsert({
        where: { userId: input.userId },
        create: {
          userId: input.userId,
          createdByUserId: input.createdByUserId ?? null,
          employmentStatus: input.centerAdminProfile.employmentStatus ?? EmploymentStatus.ACTIVE,
          ...pickDefined({
            assignedAt: input.centerAdminProfile.assignedAt ?? null,
            educationLevel: input.centerAdminProfile.educationLevel ?? null,
            yearsExperience: input.centerAdminProfile.yearsExperience ?? null,
            administrativeExperienceYears: input.centerAdminProfile.administrativeExperienceYears ?? null,
            professionalNotes: input.centerAdminProfile.professionalNotes ?? null
          })
        },
        update: pickDefined({
          assignedAt: input.centerAdminProfile.assignedAt,
          employmentStatus: input.centerAdminProfile.employmentStatus,
          educationLevel: input.centerAdminProfile.educationLevel,
          yearsExperience: input.centerAdminProfile.yearsExperience,
          administrativeExperienceYears: input.centerAdminProfile.administrativeExperienceYears,
          professionalNotes: input.centerAdminProfile.professionalNotes
        })
      });
      return;
    case "STUDENT":
      if (!input.studentProfile) return;
      await tx.studentProfile.upsert({
        where: { userId: input.userId },
        create: {
          userId: input.userId,
          createdByUserId: input.createdByUserId ?? null,
          level: input.studentProfile.level ?? StudentLevel.BEGINNER,
          studentStatus: input.studentProfile.studentStatus ?? StudentProfileStatus.REGULAR,
          ...pickDefined({
            nickname: input.studentProfile.nickname ?? null,
            nationalId: input.studentProfile.nationalId ?? null,
            joinDate: input.studentProfile.joinDate ?? null
          })
        },
        update: pickDefined({
          nickname: input.studentProfile.nickname,
          nationalId: input.studentProfile.nationalId,
          level: input.studentProfile.level,
          studentStatus: input.studentProfile.studentStatus,
          joinDate: input.studentProfile.joinDate
        })
      });
      return;
    case "PARENT":
      if (!input.parentProfile) return;
      await tx.parentProfile.upsert({
        where: { userId: input.userId },
        create: {
          userId: input.userId,
          createdByUserId: input.createdByUserId ?? null,
          relationType: input.parentProfile.relationType ?? null
        },
        update: pickDefined({
          relationType: input.parentProfile.relationType
        })
      });
      return;
    case "SUPER_ADMIN":
    case "ACCOUNTANT":
      return;
  }
};

const syncRoleScopedLinks = async (
  tx: Prisma.TransactionClient,
  input: {
    userId: number;
    role: Role;
    createdByUserId?: number;
    links?: UserLinksSyncInput;
  }
) => {
  if (!input.links) {
    return;
  }

  if (input.links.centerIds !== undefined) {
    if (
      input.role === "CENTER_ADMIN" ||
      input.role === "SUPERVISOR" ||
      input.role === "TEACHER"
    ) {
      await syncCenterAccesses(tx, input.userId, input.links.centerIds);
    }
  }

  if (input.links.circleIds !== undefined) {
    if (input.role === "SUPERVISOR" || input.role === "TEACHER") {
      await syncCircleAccesses(tx, input.userId, input.links.circleIds);
    }
  }

  if (input.links.children !== undefined && input.role === "PARENT") {
    await syncParentLinks(tx, input.userId, input.links.children, input.createdByUserId);
  }

  if (input.links.enrollments !== undefined && input.role === "STUDENT") {
    await syncStudentEnrollments(tx, input.userId, input.links.enrollments);
  }
};

export const usersRepository = {
  async findCircleIdsByCenterIds(centerIds: number[]) {
    if (!centerIds.length) {
      return [];
    }

    const circles = await prisma.circle.findMany({
      where: activeCircleWhere({
        centerId: {
          in: centerIds
        },
        center: activeCenterWhere()
      }),
      select: {
        id: true
      }
    });

    return circles.map((circle) => circle.id);
  },

  async collectRelatedUserIds(input: {
    organizationId: number;
    centerIds: number[];
    circleIds: number[];
    includeInactive?: boolean;
  }) {
    const [centerAssignments, circleAssignments, circleTeachers, enrollments] = await Promise.all([
      input.centerIds.length
        ? prisma.userCenterAccess.findMany({
            where: {
              centerId: {
                in: input.centerIds
              },
              user: activeUserWhere({
                organizationId: input.organizationId
              }, { includeInactive: input.includeInactive })
            },
            select: {
              userId: true
            }
          })
        : Promise.resolve([]),
      input.circleIds.length
        ? prisma.userCircleAccess.findMany({
            where: {
              circleId: {
                in: input.circleIds
              },
              user: activeUserWhere({
                organizationId: input.organizationId
              }, { includeInactive: input.includeInactive })
            },
            select: {
              userId: true
            }
          })
        : Promise.resolve([]),
      input.circleIds.length
        ? prisma.circle.findMany({
            where: activeCircleWhere({
              id: {
                in: input.circleIds
              },
              center: activeCenterWhere({
                organizationId: input.organizationId
              })
            }),
            select: {
              teacherId: true
            }
          })
        : Promise.resolve([]),
      input.circleIds.length
        ? prisma.studentCircleEnrollment.findMany({
            where: {
              status: EnrollmentStatus.ACTIVE,
              circleId: {
                in: input.circleIds
              },
              student: activeUserWhere({
                organizationId: input.organizationId
              }, { includeInactive: input.includeInactive }),
              circle: activeCircleWhere({
                center: activeCenterWhere({
                  organizationId: input.organizationId
                })
              })
            },
            select: {
              studentId: true
            }
          })
        : Promise.resolve([])
    ]);

    const studentIds = [...new Set(enrollments.map((item) => item.studentId))];

    const parentLinks = studentIds.length
      ? await prisma.parentStudentLink.findMany({
          where: {
            studentId: {
              in: studentIds
            },
            parent: activeUserWhere({
              organizationId: input.organizationId
            }, { includeInactive: input.includeInactive })
          },
          select: {
            parentId: true
          }
        })
      : [];

    return [
      ...centerAssignments.map((item) => item.userId),
      ...circleAssignments.map((item) => item.userId),
      ...circleTeachers
        .map((item) => item.teacherId)
        .filter((value): value is number => typeof value === "number"),
      ...studentIds,
      ...parentLinks.map((item) => item.parentId)
    ];
  },

  async findUsers(input: FindUsersInput) {
    if (input.userIds && !input.userIds.length) {
      return [];
    }

    const where = activeUserWhere(
      {
        organizationId: input.organizationId,
        ...(input.role ? { role: input.role } : {}),
        ...(input.userIds
          ? {
              id: {
                in: input.userIds
              }
            }
          : {})
      },
      { includeInactive: input.includeInactive }
    );

    const users = await prisma.user.findMany({
      where,
      orderBy: [{ role: "asc" }, { fullName: "asc" }],
      select: baseUserSelect
    });

    return users.map((user) => syncLegacyNameMirrors(user));
  },

  async findUserById(input: FindUserByIdInput) {
    const where = activeUserWhere(
      {
        id: input.userId,
        organizationId: input.organizationId
      },
      { includeInactive: input.includeInactive }
    );

    try {
      const user = await prisma.user.findFirst({
        where,
        select: detailedUserSelect
      });

      return user ? syncLegacyNameMirrors(user) : null;
    } catch (error) {
      const isPrismaError =
        error instanceof Error &&
        (("code" in error && typeof (error as any).code === "string") ||
          error.constructor.name === "PrismaClientValidationError");

      if (isPrismaError) {
        const user = await prisma.user.findFirst({
          where,
          select: baseUserSelect
        });

        return user ? syncLegacyNameMirrors(user) : null;
      }

      throw error;
    }
  },

  async findScopedUserById(input: FindScopedUserByIdInput) {
    const where = activeUserWhere(scopedUserWhere(input), {
      includeInactive: input.includeInactive
    });

    try {
      const user = await prisma.user.findFirst({
        where,
        select: detailedUserSelect
      });

      return user ? syncLegacyNameMirrors(user) : null;
    } catch (error) {
      const isPrismaError =
        error instanceof Error &&
        (("code" in error && typeof (error as any).code === "string") ||
          error.constructor.name === "PrismaClientValidationError");

      if (isPrismaError) {
        const user = await prisma.user.findFirst({
          where,
          select: baseUserSelect
        });

        return user ? syncLegacyNameMirrors(user) : null;
      }

      throw error;
    }
  },

  async createUser(input: {
    organizationId: number;
    createdByUserId?: number;
    fullName: string;
    email: string;
    username?: string | null;
    role: Role;
    passwordHash: string;
    isActive: boolean;
  }) {
    return prisma.user.create({
      data: {
        organizationId: input.organizationId,
        fullName: input.fullName,
        email: input.email,
        username: input.username ?? null,
        role: input.role,
        passwordHash: input.passwordHash,
        isActive: input.isActive,
        createdByUserId: input.createdByUserId ?? null
      },
      select: detailedUserSelect
    });
  },

  async createUserWithDetails(input: CreateUserWithDetailsInput) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          organizationId: input.organizationId,
          createdByUserId: input.createdByUserId ?? null,
          email: input.email,
          username: input.username ?? null,
          fullName: input.fullName,
          role: input.role,
          passwordHash: input.passwordHash ?? null,
          isActive: input.isActive,
          accountStatus: input.accountStatus ?? "ACTIVE",
          activationTokenHash: input.activationTokenHash ?? null,
          activationTokenExpiresAt: input.activationTokenExpiresAt ?? null,
          activationSentAt: input.activationSentAt ?? null,
          activatedAt: input.activatedAt ?? null,
          profile: {
            create: {
              fullName: input.profile.fullName,
              gender: input.profile.gender,
              birthDate: input.profile.birthDate ?? null,
              phone: input.profile.phone ?? null,
              phoneNormalized: input.profile.phoneNormalized ?? null,
              address: input.profile.address ?? null,
              avatarUrl: input.profile.avatarUrl ?? null,
              createdByUserId: input.createdByUserId ?? null
            }
          }
        },
        select: {
          id: true,
          role: true
        }
      });

      await createRoleProfileForUser(tx, {
        userId: user.id,
        role: input.role,
        createdByUserId: input.createdByUserId,
        teacherProfile: input.teacherProfile,
        supervisorProfile: input.supervisorProfile,
        centerAdminProfile: input.centerAdminProfile,
        studentProfile: input.studentProfile,
        parentProfile: input.parentProfile
      });

      await syncRoleScopedLinks(tx, {
        userId: user.id,
        role: input.role,
        createdByUserId: input.createdByUserId,
        links: input.links
      });

      return usersRepository.findUserByIdWithClient(tx, { userId: user.id });
    });
  },

  async updateUser(input: {
    userId: number;
    fullName?: string;
    email?: string;
    username?: string | null;
    isActive?: boolean;
    accountStatus?: "INVITED" | "ACTIVE" | "SUSPENDED";
    activationTokenHash?: string | null;
    activationTokenExpiresAt?: Date | null;
    activationSentAt?: Date | null;
  }) {
    return prisma.user.update({
      where: {
        id: input.userId
      },
      data: {
        ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.username !== undefined ? { username: input.username ?? null } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.accountStatus !== undefined ? { accountStatus: input.accountStatus } : {}),
        ...(input.activationTokenHash !== undefined ? { activationTokenHash: input.activationTokenHash } : {}),
        ...(input.activationTokenExpiresAt !== undefined ? { activationTokenExpiresAt: input.activationTokenExpiresAt } : {}),
        ...(input.activationSentAt !== undefined ? { activationSentAt: input.activationSentAt } : {})
      },
      select: detailedUserSelect
    });
  },

  async updateUserWithDetails(input: UpdateUserWithDetailsInput) {
    return prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: input.userId },
        data: {
          ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
          ...(input.email !== undefined ? { email: input.email } : {}),
          ...(input.username !== undefined ? { username: input.username ?? null } : {})
        }
      });

      const currentUser = await tx.user.findUniqueOrThrow({
        where: { id: input.userId },
        select: { id: true, role: true }
      });

      if (input.profile) {
        await tx.userProfile.upsert({
          where: { userId: input.userId },
          create: {
            userId: input.userId,
            fullName: input.profile.fullName ?? input.fullName ?? "",
            gender: input.profile.gender ?? Gender.MALE,
            birthDate: input.profile.birthDate ?? null,
            phone: input.profile.phone ?? null,
            phoneNormalized: input.profile.phoneNormalized ?? null,
            address: input.profile.address ?? null,
            avatarUrl: input.profile.avatarUrl ?? null
          },
          update: pickDefined({
            fullName: input.profile.fullName,
            gender: input.profile.gender,
            birthDate: input.profile.birthDate,
            phone: input.profile.phone,
            phoneNormalized: input.profile.phoneNormalized,
            address: input.profile.address,
            avatarUrl: input.profile.avatarUrl
          })
        });

        if (input.profile.fullName !== undefined) {
          await tx.user.update({
            where: { id: input.userId },
            data: { fullName: input.profile.fullName }
          });
        }
      }

      await updateRoleProfileForUser(tx, {
        userId: input.userId,
        role: currentUser.role,
        teacherProfile: input.teacherProfile,
        supervisorProfile: input.supervisorProfile,
        centerAdminProfile: input.centerAdminProfile,
        studentProfile: input.studentProfile,
        parentProfile: input.parentProfile
      });

      await syncRoleScopedLinks(tx, {
        userId: input.userId,
        role: currentUser.role,
        links: input.links
      });

      return usersRepository.findUserByIdWithClient(tx, { userId: input.userId });
    });
  },

  async countActiveSuperAdmins(organizationId: number) {
    return prisma.user.count({
      where: activeUserWhere({
        organizationId,
        role: "SUPER_ADMIN"
      })
    });
  },

  async findCenterById(input: { organizationId: number; centerId: number }) {
    return prisma.center.findFirst({
      where: activeCenterWhere({
        id: input.centerId,
        organizationId: input.organizationId
      }),
      select: {
        id: true,
        name: true,
        organizationId: true
      }
    });
  },

  async findCircleById(input: { organizationId: number; circleId: number }) {
    return prisma.circle.findFirst({
      where: activeCircleWhere({
        id: input.circleId,
        center: activeCenterWhere({
          organizationId: input.organizationId
        })
      }),
      select: {
        id: true,
        name: true,
        centerId: true
      }
    });
  },

  async findStudentById(input: {
    organizationId: number;
    studentId: number;
    includeInactive?: boolean;
  }) {
    return prisma.user.findFirst({
      where: activeUserWhere(
        {
          id: input.studentId,
          organizationId: input.organizationId,
          role: "STUDENT"
        },
        { includeInactive: input.includeInactive }
      ),
      select: {
        id: true,
        fullName: true,
        role: true,
        isActive: true,
        studentEnrollments: {
          where: {
            status: EnrollmentStatus.ACTIVE
          },
          select: {
            circleId: true
          }
        }
      }
    });
  },

  async addCenterAccess(input: { userId: number; centerId: number }) {
    return prisma.$transaction(async (tx) => {
      await tx.userCenterAccess.create({
        data: {
          userId: input.userId,
          centerId: input.centerId
        }
      });

      return usersRepository.findUserByIdWithClient(tx, { userId: input.userId });
    });
  },

  async removeCenterAccess(input: { userId: number; centerId: number }) {
    return prisma.$transaction(async (tx) => {
      const deleted = await tx.userCenterAccess.deleteMany({
        where: {
          userId: input.userId,
          centerId: input.centerId
        }
      });

      return {
        deletedCount: deleted.count,
        user: await usersRepository.findUserByIdWithClient(tx, { userId: input.userId })
      };
    });
  },

  async addCircleAccess(input: { userId: number; circleId: number }) {
    return prisma.$transaction(async (tx) => {
      await tx.userCircleAccess.create({
        data: {
          userId: input.userId,
          circleId: input.circleId
        }
      });

      return usersRepository.findUserByIdWithClient(tx, { userId: input.userId });
    });
  },

  async removeCircleAccess(input: { userId: number; circleId: number }) {
    return prisma.$transaction(async (tx) => {
      const deleted = await tx.userCircleAccess.deleteMany({
        where: {
          userId: input.userId,
          circleId: input.circleId
        }
      });

      return {
        deletedCount: deleted.count,
        user: await usersRepository.findUserByIdWithClient(tx, { userId: input.userId })
      };
    });
  },

  async addParentStudentLink(input: {
    parentId: number;
    studentId: number;
    relationType?: ParentRelationType;
    createdByUserId?: number;
  }) {
    return prisma.$transaction(async (tx) => {
      await tx.parentStudentLink.create({
        data: {
          parentId: input.parentId,
          studentId: input.studentId,
          relationType: input.relationType ?? ParentRelationType.GUARDIAN,
          createdByUserId: input.createdByUserId ?? null
        }
      });

      return usersRepository.findUserByIdWithClient(tx, { userId: input.parentId });
    });
  },

  async removeParentStudentLink(input: { parentId: number; studentId: number }) {
    return prisma.$transaction(async (tx) => {
      const deleted = await tx.parentStudentLink.deleteMany({
        where: {
          parentId: input.parentId,
          studentId: input.studentId
        }
      });

      return {
        deletedCount: deleted.count,
        user: await usersRepository.findUserByIdWithClient(tx, { userId: input.parentId })
      };
    });
  },

  async addStudentEnrollment(input: {
    studentId: number;
    circleId: number;
    startDate?: Date;
  }) {
    return prisma.$transaction(async (tx) => {
      await tx.studentCircleEnrollment.create({
        data: {
          studentId: input.studentId,
          circleId: input.circleId,
          status: EnrollmentStatus.ACTIVE,
          startDate: input.startDate ?? new Date()
        }
      });

      return usersRepository.findUserByIdWithClient(tx, { userId: input.studentId });
    });
  },

  async removeStudentEnrollment(input: { studentId: number; circleId: number }) {
    return prisma.$transaction(async (tx) => {
      const deleted = await tx.studentCircleEnrollment.deleteMany({
        where: {
          studentId: input.studentId,
          circleId: input.circleId
        }
      });

      return {
        deletedCount: deleted.count,
        user: await usersRepository.findUserByIdWithClient(tx, { userId: input.studentId })
      };
    });
  },

  async findUserByIdWithClient(tx: Prisma.TransactionClient, input: { userId: number }) {
    try {
      const user = await getClient(tx).user.findUnique({
        where: {
          id: input.userId
        },
        select: detailedUserSelect
      });

      return user ? syncLegacyNameMirrors(user) : null;
    } catch (error) {
      const isPrismaError =
        error instanceof Error &&
        (("code" in error && typeof (error as any).code === "string") ||
          error.constructor.name === "PrismaClientValidationError");

      if (isPrismaError) {
        const user = await getClient(tx).user.findUnique({
          where: {
            id: input.userId
          },
          select: baseUserSelect
        });

        return user ? syncLegacyNameMirrors(user) : null;
      }

      throw error;
    }
  },

  async userHasCenterAccess(input: { userId: number; centerId: number }) {
    const record = await prisma.userCenterAccess.findFirst({
      where: {
        userId: input.userId,
        centerId: input.centerId
      },
      select: {
        id: true
      }
    });

    return Boolean(record);
  },

  async userHasCircleAccess(input: { userId: number; circleId: number }) {
    const record = await prisma.userCircleAccess.findFirst({
      where: {
        userId: input.userId,
        circleId: input.circleId
      },
      select: {
        id: true
      }
    });

    return Boolean(record);
  },

  async userHasParentStudentLink(input: { parentId: number; studentId: number }) {
    const record = await prisma.parentStudentLink.findFirst({
      where: {
        parentId: input.parentId,
        studentId: input.studentId
      },
      select: {
        id: true
      }
    });

    return Boolean(record);
  },

  async userHasEnrollment(input: { studentId: number; circleId: number }) {
    const record = await prisma.studentCircleEnrollment.findFirst({
      where: {
        studentId: input.studentId,
        circleId: input.circleId
      },
      select: {
        id: true
      }
    });

    return Boolean(record);
  },

  async getStudentProfileData(organizationId: number, userId: number) {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId,
        role: "STUDENT"
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        profile: {
          select: {
            avatarUrl: true,
            phone: true,
            gender: true,
            birthDate: true
          }
        },
        studentProfile: {
          select: {
            nickname: true,
            level: true,
            joinDate: true,
            currentJuzz: true,
            studentStatus: true
          }
        },
        studentEnrollments: {
          where: { status: EnrollmentStatus.ACTIVE },
          select: {
            circle: {
              select: {
                id: true,
                name: true,
                center: {
                  select: { id: true, name: true }
                },
                teacher: {
                  select: { fullName: true }
                }
              }
            }
          }
        },
        followUpsAsStudent: {
          orderBy: { recordDate: "desc" },
          take: 120,
          select: {
            id: true,
            recordDate: true,
            type: true,
            surah: true,
            fromAyah: true,
            toAyah: true,
            pagesCount: true,
            rating: true,
            matnName: true,
            matnStatus: true,
            notes: true,
            teacher: {
              select: { fullName: true }
            }
          }
        },
        monthlyPlansAsStudent: {
          where: { status: "APPROVED" },
          orderBy: [
            { year: "desc" },
            { month: "desc" }
          ],
          take: 1,
          select: {
            id: true,
            month: true,
            year: true,
            hifzFromSurah: true,
            hifzFromAyah: true,
            hifzToSurah: true,
            hifzToAyah: true,
            hifzTargetPages: true,
            hifzDailyRate: true,
            reviewFromSurah: true,
            reviewFromAyah: true,
            reviewToSurah: true,
            reviewToAyah: true,
            reviewTargetPages: true,
            reviewDailyRate: true,
            status: true
          }
        }
      }
    });

    if (!user) return null;

    const recentAttendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        studentId: userId,
        circle: { center: { organizationId } }
      },
      orderBy: { attendanceDate: "desc" },
      take: 10,
      select: {
        id: true,
        attendanceDate: true,
        status: true,
        note: true,
        circleId: true
      }
    });

    // Calculate Attendance Metrics
    const attendanceStats = await prisma.attendanceRecord.groupBy({
      by: ["status"],
      where: {
        studentId: userId,
        circle: { center: { organizationId } }
      },
      _count: {
        _all: true
      }
    });

    let totalAttendance = 0;
    let presentAttendance = 0;

    attendanceStats.forEach(stat => {
      totalAttendance += stat._count._all;
      if (stat.status === "PRESENT") presentAttendance += stat._count._all;
      if (stat.status === "LATE") presentAttendance += stat._count._all; // Count as present but late
    });

    const attendancePercentage = totalAttendance > 0 
      ? Math.round((presentAttendance / totalAttendance) * 100) 
      : 100;

    return {
      ...user,
      attendancesAsStudent: recentAttendanceRecords.map(record => ({
        id: record.id,
        date: record.attendanceDate,
        status: record.status,
        note: record.note,
        circleId: record.circleId
      })),
      metrics: {
        attendancePercentage,
        memorizedJuzz: user.studentProfile?.currentJuzz ?? 0,
        recentRating: user.followUpsAsStudent[0]?.rating ?? null
      }
    };
  },

  async findCentersByIds(input: { organizationId: number; centerIds: number[] }) {
    if (!input.centerIds?.length) return [];
    return prisma.center.findMany({
      where: activeCenterWhere({
        organizationId: input.organizationId,
        id: { in: input.centerIds }
      })
    });
  },

  async findCirclesByIds(input: { organizationId: number; circleIds: number[] }) {
    if (!input.circleIds?.length) return [];
    return prisma.circle.findMany({
      where: activeCircleWhere({
        center: activeCenterWhere({
          organizationId: input.organizationId
        }),
        id: { in: input.circleIds }
      })
    });
  },

  async findUsersByIds(input: { organizationId: number; userIds: number[]; includeInactive?: boolean }) {
    if (!input.userIds?.length) return [];
    return prisma.user.findMany({
      where: activeUserWhere(
        {
          organizationId: input.organizationId,
          id: { in: input.userIds }
        },
        { includeInactive: input.includeInactive }
      ),
      select: baseUserSelect
    }).then(users => users.map(syncLegacyNameMirrors));
  }
};

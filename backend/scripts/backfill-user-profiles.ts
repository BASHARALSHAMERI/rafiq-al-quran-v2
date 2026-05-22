import {
  EmploymentStatus,
  ParentProfileRelationType,
  PrismaClient,
  Role,
  StudentLevel,
  StudentProfileStatus,
  SupervisorProfileStatus
} from "@prisma/client";

const prisma = new PrismaClient();

type Counts = {
  usersScanned: number;
  userProfilesCreated: number;
  teacherProfilesCreated: number;
  supervisorProfilesCreated: number;
  centerAdminProfilesCreated: number;
  studentProfilesCreated: number;
  parentProfilesCreated: number;
};

const emptyCounts = (): Counts => ({
  usersScanned: 0,
  userProfilesCreated: 0,
  teacherProfilesCreated: 0,
  supervisorProfilesCreated: 0,
  centerAdminProfilesCreated: 0,
  studentProfilesCreated: 0,
  parentProfilesCreated: 0
});

async function main() {
  const counts = emptyCounts();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      fullName: true,
      role: true,
      createdByUserId: true
    },
    orderBy: { id: "asc" }
  });

  counts.usersScanned = users.length;

  const [
    existingUserProfiles,
    existingTeacherProfiles,
    existingSupervisorProfiles,
    existingCenterAdminProfiles,
    existingStudentProfiles,
    existingParentProfiles
  ] = await Promise.all([
    prisma.userProfile.findMany({ select: { userId: true } }),
    prisma.teacherProfile.findMany({ select: { userId: true } }),
    prisma.supervisorProfile.findMany({ select: { userId: true } }),
    prisma.centerAdminProfile.findMany({ select: { userId: true } }),
    prisma.studentProfile.findMany({ select: { userId: true } }),
    prisma.parentProfile.findMany({ select: { userId: true } })
  ]);

  const userProfileIds = new Set(existingUserProfiles.map((x) => x.userId));
  const teacherProfileIds = new Set(existingTeacherProfiles.map((x) => x.userId));
  const supervisorProfileIds = new Set(existingSupervisorProfiles.map((x) => x.userId));
  const centerAdminProfileIds = new Set(existingCenterAdminProfiles.map((x) => x.userId));
  const studentProfileIds = new Set(existingStudentProfiles.map((x) => x.userId));
  const parentProfileIds = new Set(existingParentProfiles.map((x) => x.userId));

  for (const user of users) {
    await prisma.$transaction(async (tx) => {
      if (!userProfileIds.has(user.id)) {
        await tx.userProfile.create({
          data: {
            userId: user.id,
            fullName: user.fullName?.trim() || `User ${user.id}`,
            gender: null,
            createdByUserId: user.createdByUserId ?? null
          }
        });

        userProfileIds.add(user.id);
        counts.userProfilesCreated += 1;
      }

      switch (user.role) {
        case Role.TEACHER:
          if (!teacherProfileIds.has(user.id)) {
            await tx.teacherProfile.create({
              data: {
                userId: user.id,
                employmentStatus: EmploymentStatus.ACTIVE,
                createdByUserId: user.createdByUserId ?? null
              }
            });
            teacherProfileIds.add(user.id);
            counts.teacherProfilesCreated += 1;
          }
          break;
        case Role.SUPERVISOR:
          if (!supervisorProfileIds.has(user.id)) {
            await tx.supervisorProfile.create({
              data: {
                userId: user.id,
                status: SupervisorProfileStatus.ACTIVE,
                createdByUserId: user.createdByUserId ?? null
              }
            });
            supervisorProfileIds.add(user.id);
            counts.supervisorProfilesCreated += 1;
          }
          break;
        case Role.CENTER_ADMIN:
          if (!centerAdminProfileIds.has(user.id)) {
            await tx.centerAdminProfile.create({
              data: {
                userId: user.id,
                employmentStatus: EmploymentStatus.ACTIVE,
                createdByUserId: user.createdByUserId ?? null
              }
            });
            centerAdminProfileIds.add(user.id);
            counts.centerAdminProfilesCreated += 1;
          }
          break;
        case Role.STUDENT:
          if (!studentProfileIds.has(user.id)) {
            await tx.studentProfile.create({
              data: {
                userId: user.id,
                level: StudentLevel.BEGINNER,
                studentStatus: StudentProfileStatus.REGULAR,
                createdByUserId: user.createdByUserId ?? null
              }
            });
            studentProfileIds.add(user.id);
            counts.studentProfilesCreated += 1;
          }
          break;
        case Role.PARENT:
          if (!parentProfileIds.has(user.id)) {
            await tx.parentProfile.create({
              data: {
                userId: user.id,
                relationType: ParentProfileRelationType.GUARDIAN,
                createdByUserId: user.createdByUserId ?? null
              }
            });
            parentProfileIds.add(user.id);
            counts.parentProfilesCreated += 1;
          }
          break;
        case Role.SUPER_ADMIN:
          break;
        default:
          break;
      }
    });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        counts
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(
      JSON.stringify(
        {
          ok: false,
          error: error instanceof Error ? error.message : String(error)
        },
        null,
        2
      )
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

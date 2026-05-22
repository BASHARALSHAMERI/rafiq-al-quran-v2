import { PrismaClient } from "@prisma/client";
import { normalizePhoneForStorage } from "../src/shared/utils/identifier";

const prisma = new PrismaClient();

type ProfileRow = {
  userId: number;
  phone: string | null;
};

async function main() {
  const profiles = (await prisma.userProfile.findMany({
    select: {
      userId: true,
      phone: true
    },
    orderBy: {
      userId: "asc"
    }
  })) as ProfileRow[];

  const buckets = new Map<string, ProfileRow[]>();

  for (const profile of profiles) {
    const normalized = normalizePhoneForStorage(profile.phone);
    if (!normalized) {
      continue;
    }

    const current = buckets.get(normalized) ?? [];
    current.push(profile);
    buckets.set(normalized, current);
  }

  const collisionEntries = [...buckets.entries()]
    .filter(([, rows]) => rows.length > 1)
    .map(([normalized, rows]) => ({
      normalized,
      userIds: rows.map((row) => row.userId),
      phones: rows.map((row) => row.phone)
    }));

  const collisionSet = new Set<string>(collisionEntries.map((entry) => entry.normalized));

  let updatedCount = 0;
  let skippedCollisionCount = 0;
  let clearedCount = 0;

  for (const profile of profiles) {
    const normalized = normalizePhoneForStorage(profile.phone);

    if (!normalized) {
      await prisma.userProfile.update({
        where: {
          userId: profile.userId
        },
        data: {
          phoneNormalized: null
        }
      });
      clearedCount += 1;
      continue;
    }

    if (collisionSet.has(normalized)) {
      await prisma.userProfile.update({
        where: {
          userId: profile.userId
        },
        data: {
          phoneNormalized: null
        }
      });
      skippedCollisionCount += 1;
      continue;
    }

    await prisma.userProfile.update({
      where: {
        userId: profile.userId
      },
      data: {
        phoneNormalized: normalized
      }
    });
    updatedCount += 1;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        scannedProfiles: profiles.length,
        updatedCount,
        clearedCount,
        skippedCollisionCount,
        collisions: collisionEntries
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

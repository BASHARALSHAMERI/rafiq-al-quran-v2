import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedAccountingChart } from "./accounting-chart-seed";
import { ensureSafeDatabaseEnvironment } from "../src/shared/utils/db-guard";

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = "Rafiq@1234";

async function seed() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  // Ensure Organization exists using Upsert
  const organization = await prisma.organization.upsert({
    where: { code: "RAFIQ" },
    update: {},
    create: {
      name: "جمعية رفقاء القرآن",
      code: "RAFIQ"
    }
  });

  // Basic Accounting Setup
  await seedAccountingChart(prisma, organization.id);

  // Ensure Base Currency exists
  await prisma.currency.upsert({
    where: { organizationId_code: { organizationId: organization.id, code: "YER" } },
    update: {},
    create: {
      organizationId: organization.id,
      code: "YER",
      nameAr: "ريال يمني",
      nameEn: "Yemeni Rial",
      symbol: "﷼",
      decimalPlaces: 2,
      isBase: true
    }
  });

  // Ensure Base Policy Profile exists
  const existingPolicy = await prisma.financePolicyProfile.findFirst({
    where: { organizationId: organization.id }
  });
  if (!existingPolicy) {
    await prisma.financePolicyProfile.create({
      data: {
        organizationId: organization.id,
        feesEnabled: true,
        requireTransferAttachment: true,
        requireApprovalDisbursement: true,
        requireApprovalReceipt: false,
        allowFreeStudents: true,
        allowSymbolicOneTimeFee: true,
        allowOverdraft: false
      }
    });
  }

  // Ensure Super Admin exists
  const superAdminEmail = "superadmin@rafiq.local";
  let superAdmin = await prisma.user.findUnique({ where: { email: superAdminEmail } });
  
  if (!superAdmin) {
    superAdmin = await prisma.user.create({
      data: {
        organizationId: organization.id,
        fullName: "مشرف النظام العام",
        email: superAdminEmail,
        role: Role.SUPER_ADMIN,
        passwordHash
      }
    });
  }

  // Ensure Center Admin exists for initial login testing
  const centerAdminEmail = "center.admin@rafiq.local";
  let centerAdmin = await prisma.user.findUnique({ where: { email: centerAdminEmail } });
  
  if (!centerAdmin) {
    centerAdmin = await prisma.user.create({
      data: {
        organizationId: organization.id,
        fullName: "مدير مركز النور",
        email: centerAdminEmail,
        role: Role.CENTER_ADMIN,
        createdByUserId: superAdmin.id,
        passwordHash
      }
    });
  }

  console.log("✅ Basic seed completed successfully using upserts. No data was deleted.");
}

async function main() {
  try {
    // Note: We DO NOT call cleanup() here anymore. Data is preserved.
    console.log("🌱 Starting basic seed script (upsert mode)...");
    await seed();
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

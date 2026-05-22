-- DropForeignKey
ALTER TABLE "public"."exchange_rates" DROP CONSTRAINT "exchange_rates_organizationId_currencyCode_fkey";

-- AlterTable
ALTER TABLE "public"."payroll_profiles" ADD COLUMN     "salaryGradeId" INTEGER;

-- CreateTable
CREATE TABLE "public"."salary_grades" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "centerId" INTEGER,
    "jobTitle" VARCHAR(120) NOT NULL,
    "gradeLevel" VARCHAR(60) NOT NULL,
    "baseSalary" DECIMAL(12,2) NOT NULL,
    "currencyCode" VARCHAR(8) NOT NULL DEFAULT 'YER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_grades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "salary_grades_organizationId_isActive_idx" ON "public"."salary_grades"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "salary_grades_centerId_isActive_idx" ON "public"."salary_grades"("centerId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "salary_grades_organizationId_centerId_jobTitle_gradeLevel_key" ON "public"."salary_grades"("organizationId", "centerId", "jobTitle", "gradeLevel");

-- AddForeignKey
ALTER TABLE "public"."exchange_rates" ADD CONSTRAINT "exchange_rates_organizationId_currencyCode_fkey" FOREIGN KEY ("organizationId", "currencyCode") REFERENCES "public"."currencies"("organizationId", "code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_profiles" ADD CONSTRAINT "payroll_profiles_salaryGradeId_fkey" FOREIGN KEY ("salaryGradeId") REFERENCES "public"."salary_grades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."salary_grades" ADD CONSTRAINT "salary_grades_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."salary_grades" ADD CONSTRAINT "salary_grades_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "public"."exchange_rates_organizationId_currencyCode_effectiveDat_idx" RENAME TO "exchange_rates_organizationId_currencyCode_effectiveDate_idx";


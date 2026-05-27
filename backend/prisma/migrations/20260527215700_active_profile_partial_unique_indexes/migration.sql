-- Prevent duplicate active student fee profiles for the same student in a center.
CREATE UNIQUE INDEX "student_fee_profiles_active_scope_unique_idx"
ON "public"."student_fee_profiles"("organizationId", "centerId", "studentId")
WHERE "isActive" = true;

-- PostgreSQL unique indexes allow multiple NULLs, so protect the org-level policy separately.
CREATE UNIQUE INDEX "finance_policy_profiles_org_default_unique_idx"
ON "public"."finance_policy_profiles"("organizationId")
WHERE "centerId" IS NULL;

-- Prevent duplicate active payroll profiles, handling nullable centerId explicitly.
CREATE UNIQUE INDEX "payroll_profiles_active_center_scope_unique_idx"
ON "public"."payroll_profiles"("organizationId", "centerId", "userId")
WHERE "isActive" = true AND "centerId" IS NOT NULL;

CREATE UNIQUE INDEX "payroll_profiles_active_org_scope_unique_idx"
ON "public"."payroll_profiles"("organizationId", "userId")
WHERE "isActive" = true AND "centerId" IS NULL;

-- Prevent duplicate active reward profiles, splitting nullable center/type cases
-- because PostgreSQL unique indexes allow multiple NULL values.
CREATE UNIQUE INDEX "reward_profiles_active_center_type_unique_idx"
ON "public"."reward_profiles"("organizationId", "centerId", "beneficiaryUserId", "beneficiaryRole", "cycle", "rewardType")
WHERE "isActive" = true AND "centerId" IS NOT NULL AND "rewardType" IS NOT NULL;

CREATE UNIQUE INDEX "reward_profiles_active_center_no_type_unique_idx"
ON "public"."reward_profiles"("organizationId", "centerId", "beneficiaryUserId", "beneficiaryRole", "cycle")
WHERE "isActive" = true AND "centerId" IS NOT NULL AND "rewardType" IS NULL;

CREATE UNIQUE INDEX "reward_profiles_active_org_type_unique_idx"
ON "public"."reward_profiles"("organizationId", "beneficiaryUserId", "beneficiaryRole", "cycle", "rewardType")
WHERE "isActive" = true AND "centerId" IS NULL AND "rewardType" IS NOT NULL;

CREATE UNIQUE INDEX "reward_profiles_active_org_no_type_unique_idx"
ON "public"."reward_profiles"("organizationId", "beneficiaryUserId", "beneficiaryRole", "cycle")
WHERE "isActive" = true AND "centerId" IS NULL AND "rewardType" IS NULL;

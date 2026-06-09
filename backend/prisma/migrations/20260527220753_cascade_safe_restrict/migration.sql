-- DropForeignKey
ALTER TABLE "public"."invoices" DROP CONSTRAINT "invoices_centerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."invoices" DROP CONSTRAINT "invoices_studentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."journal_entries" DROP CONSTRAINT "journal_entries_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."journal_entry_lines" DROP CONSTRAINT "journal_entry_lines_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."payroll_profiles" DROP CONSTRAINT "payroll_profiles_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."payroll_profiles" DROP CONSTRAINT "payroll_profiles_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."reward_items" DROP CONSTRAINT "reward_items_centerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."reward_profiles" DROP CONSTRAINT "reward_profiles_beneficiaryUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."reward_profiles" DROP CONSTRAINT "reward_profiles_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."student_fee_profiles" DROP CONSTRAINT "student_fee_profiles_centerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."student_fee_profiles" DROP CONSTRAINT "student_fee_profiles_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."student_fee_profiles" DROP CONSTRAINT "student_fee_profiles_studentId_fkey";

-- AddForeignKey
ALTER TABLE "public"."invoices" ADD CONSTRAINT "invoices_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoices" ADD CONSTRAINT "invoices_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journal_entries" ADD CONSTRAINT "journal_entries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_fee_profiles" ADD CONSTRAINT "student_fee_profiles_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_fee_profiles" ADD CONSTRAINT "student_fee_profiles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_fee_profiles" ADD CONSTRAINT "student_fee_profiles_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_profiles" ADD CONSTRAINT "payroll_profiles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_profiles" ADD CONSTRAINT "payroll_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reward_profiles" ADD CONSTRAINT "reward_profiles_beneficiaryUserId_fkey" FOREIGN KEY ("beneficiaryUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reward_profiles" ADD CONSTRAINT "reward_profiles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reward_items" ADD CONSTRAINT "reward_items_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "public"."centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

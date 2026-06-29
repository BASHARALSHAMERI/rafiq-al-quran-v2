import { financeDeductionService } from "./src/modules/finance-deductions/finance-deduction.service";
import { Role } from "@prisma/client";

async function test() {
  try {
    const result = await financeDeductionService.generateMonthlyDeductions(
      { role: Role.SUPER_ADMIN, organizationId: 2, userId: 1 } as any,
      6,
      2026
    );
    console.log("SUCCESS:", result);
  } catch (e) {
    console.error("ERROR:", e);
  }
  process.exit(0);
}

test();

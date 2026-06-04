import * as fs from "fs";
import * as path from "path";

const SRC = path.join(__dirname, "../src");
const FRONTEND = path.join(__dirname, "../../frontend/src");
const PRISMA = path.join(__dirname, "../prisma");

function read(file: string): string {
  return fs.readFileSync(file, "utf-8");
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`PASS: ${message}`);
}

console.log("Validating Yemen/Taiz configuration...\n");

const prayerService = read(path.join(SRC, "modules/staff-operations/prayer-time.service.ts"));
assert(prayerService.includes("ALADHAN: 1"), "METHOD_MAP contains ALADHAN: 1");
assert(prayerService.includes("MWL: 3"), "METHOD_MAP contains MWL: 3");
assert(prayerService.includes("resolveMethod(prayerApiSource)"), "getPrayerTimes resolves method from source");
assert(!prayerService.includes("const ALADHAN_METHOD"), "Old hardcoded constant removed");

const effectiveShift = read(path.join(SRC, "modules/staff-operations/effective-shift.service.ts"));
assert(effectiveShift.includes("policy.prayerApiSource"), "Effective shift passes policy.prayerApiSource");

const routes = read(path.join(SRC, "modules/staff-operations/staff-operations.routes.ts"));
assert(routes.includes('"/prayer-times/:centerId"'), "Route /prayer-times/:centerId exists");

const controller = read(path.join(SRC, "modules/staff-operations/staff-operations.controller.ts"));
assert(controller.includes("prayerTimeService.getPrayerTimes"), "Controller calls prayerTimeService");

const files = [
  "modules/staff-operations/staff-operations.service.ts",
  "modules/staff-operations/effective-shift.service.ts",
  "modules/org/org.service.ts",
  "modules/org/org.repository.ts",
];
for (const file of files) {
  const content = read(path.join(SRC, file));
  assert(!content.includes('"Asia/Riyadh"'), `${file}: no Riyadh fallback`);
  assert(content.includes('"Asia/Aden"'), `${file}: uses Aden fallback`);
}

const schema = read(path.join(PRISMA, "schema.prisma"));
assert(schema.includes('@default("Asia/Aden")'), "Prisma schema defaults to Asia/Aden");
assert(!schema.includes('@default("Asia/Riyadh")'), "Prisma schema has no Riyadh default");

const settings = read(path.join(FRONTEND, "features/staff-attendance/components/AttendancePolicySettings.tsx"));
assert(settings.includes('timezone: "Asia/Aden"'), "Frontend policy default is Asia/Aden");

const modal = read(path.join(FRONTEND, "features/org/components/centers/CenterFormModal.tsx"));
assert(modal.includes("13.5795"), "Map default lat is Taiz");
assert(modal.includes("44.0209"), "Map default lng is Taiz");
assert(!modal.includes("24.7136"), "Map no longer defaults to Riyadh lat");

console.log("\nAll validations passed.");

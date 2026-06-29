# Rafiq Al-Quran v2

Rafiq Al-Quran v2 is a Quran education management system for organizations, centers, Quran circles, students, teachers, supervisors, parents, attendance, follow-up, exams, reports, finance, and mobile workflows.

The project is structured as a production-oriented graduation project with separate backend, frontend, and mobile applications.

## Tech Stack

- Backend: Node.js, Express, TypeScript, Prisma, PostgreSQL
- Frontend: React, Vite, TypeScript
- Mobile: Flutter, Riverpod
- Testing: Jest, Vitest, Flutter tests

## Project Structure

- `backend/` - Express API, Prisma schema, migrations, services, repositories, and backend tests
- `frontend/` - React web dashboard for administration and operations
- `rafiq_mobile/` - Flutter mobile application for role-based mobile workflows
- `docs/` - reference documentation; verify against active code before relying on it

## Main Features

- Organization, center, and circle management
- Role-based users and access boundaries
- Student and staff attendance
- Daily Quran follow-up and memorization tracking
- Exams, nominations, committees, and evaluation workflows
- Graduation candidates and golden records
- Reports, notifications, and audit logs
- Library and educational content
- Finance workflows including tuition, invoices, payments, donations, payroll, rewards, expenses, and assets
- Mobile workflows for teachers, supervisors, students, and parents

## Backend

```bash
cd backend
npm install
npx prisma generate
npm run dev
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

## Mobile

```bash
cd rafiq_mobile
flutter pub get
flutter run
```

## Database

The active database model is defined in:

```text
backend/prisma/schema.prisma
```

The database provider is PostgreSQL. Always verify database-related documentation against the active Prisma schema and source code.

## Development Notes

- Keep backend changes within the controller-service-repository pattern.
- Preserve RBAC and organization/center/circle boundaries.
- Do not rely on old roadmap or ERD files without checking active code.
- Treat generated files and large patch snapshots carefully.
- Do not modify database schema or migrations without a focused database task.

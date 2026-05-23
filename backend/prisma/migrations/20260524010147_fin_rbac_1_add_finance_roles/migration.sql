-- FIN-RBAC-1: Add official finance roles to the Role enum
-- Additive-only: no tables altered, no data modified, no existing values changed.

ALTER TYPE "Role" ADD VALUE 'ACCOUNTANT';
ALTER TYPE "Role" ADD VALUE 'FINANCE_MANAGER';
ALTER TYPE "Role" ADD VALUE 'TREASURER';
ALTER TYPE "Role" ADD VALUE 'AUDITOR';

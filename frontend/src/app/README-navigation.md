# Admin Navigation Guide

## Add a New Sidebar Item
1. Open `src/app/route-meta.ts`.
2. Add a new route object inside `ADMIN_ROUTES` with:
   - `id`
   - `path`
   - `label`
   - `icon`
   - `section`
   - `allowedRoles`
   - `sidebar`
3. Create its page under `src/pages`.
4. Register the page component in `src/app/router.tsx` inside `routeElements` map.

## Link to RBAC
- RBAC source of truth is `ADMIN_ROUTES[].allowedRoles`.
- `RequireRole` reads roles by `routeId` from `src/app/route-meta.ts`.
- Sidebar visibility is filtered by the same meta through `getVisibleSidebarRoutes`.

/**
 * ═══════════════════════════════════════════════════════════════
 * GLOBAL SEARCH HOOK
 * Searches real data: students, teachers, supervisors,
 * centers, circles — using existing APIs (client-side filter).
 * ═══════════════════════════════════════════════════════════════
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { usersApi } from "../users/users.api";
import { orgApi } from "../org/org.api";
import type { Role } from "../auth/types";

export type SearchResultItem = {
  id: string;
  label: string;
  sublabel?: string;
  path: string;
  category: "student" | "teacher" | "supervisor" | "parent" | "center" | "circle";
};

export type GroupedSearchResults = {
  category: SearchResultItem["category"];
  labelAr: string;
  labelEn: string;
  items: SearchResultItem[];
}[];

const CATEGORY_LABELS: Record<
  SearchResultItem["category"],
  { ar: string; en: string }
> = {
  student:    { ar: "طلاب",       en: "Students" },
  teacher:    { ar: "معلمون",     en: "Teachers" },
  supervisor: { ar: "مشرفون",     en: "Supervisors" },
  parent:     { ar: "أولياء أمور", en: "Parents" },
  center:     { ar: "مراكز",      en: "Centers" },
  circle:     { ar: "حلقات",      en: "Circles" },
};

const CATEGORY_ORDER: SearchResultItem["category"][] = [
  "student",
  "teacher",
  "supervisor",
  "parent",
  "center",
  "circle",
];

const ROLE_CATEGORIES: Partial<Record<Role, SearchResultItem["category"][]>> = {
  SUPER_ADMIN: ["student", "teacher", "supervisor", "parent", "center", "circle"],
  CENTER_ADMIN: ["student", "teacher", "supervisor", "center", "circle"],
  SUPERVISOR:   ["student", "teacher", "circle"],
  TEACHER:      ["student"],
};

const MAX_PER_CATEGORY = 4;

function normalize(str: string) {
  return str.trim().toLowerCase();
}

function matchesQuery(value: string, q: string): boolean {
  return normalize(value).includes(normalize(q));
}

export function useGlobalSearch(query: string, role: Role | undefined) {
  const [results, setResults] = useState<GroupedSearchResults>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const allowedCategories = useMemo(
    () => (role ? (ROLE_CATEGORIES[role] ?? []) : []),
    [role]
  );

  useEffect(() => {
    const q = query.trim();

    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    // Clear previous debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      // Abort previous in-flight request
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      setLoading(true);

      try {
        const promises: Promise<SearchResultItem[]>[] = [];

        // ── Users: students, teachers, supervisors, parents ──
        const userRoleMap: {
          role: "STUDENT" | "TEACHER" | "SUPERVISOR" | "PARENT";
          category: SearchResultItem["category"];
          path: string;
        }[] = [
          { role: "STUDENT",    category: "student",    path: "/users/students" },
          { role: "TEACHER",    category: "teacher",    path: "/users/teachers" },
          { role: "SUPERVISOR", category: "supervisor", path: "/users/supervisors" },
          { role: "PARENT",     category: "parent",     path: "/users/parents" },
        ];

        for (const { role: userRole, category, path } of userRoleMap) {
          if (!allowedCategories.includes(category)) continue;

          promises.push(
            usersApi
              .getUsers({ role: userRole, q, page: 1, pageSize: 20 })
              .then((result) =>
                result.items.slice(0, MAX_PER_CATEGORY).map((u) => ({
                  id: `${category}-${u.id}`,
                  label: String(u.fullName ?? ""),
                  sublabel: String(u.email ?? u.phone ?? ""),
                  path,
                  category,
                }))
              )
              .catch(() => [])
          );
        }

        // ── Centers ──
        if (allowedCategories.includes("center")) {
          promises.push(
            orgApi
              .getCenters()
              .then((result) =>
                result.items
                  .filter((c) => matchesQuery(c.name ?? "", q) || matchesQuery(c.code ?? "", q))
                  .slice(0, MAX_PER_CATEGORY)
                  .map((c) => ({
                    id: `center-${c.id}`,
                    label: c.name,
                    sublabel: c.code,
                    path: "/org/centers",
                    category: "center" as const,
                  }))
              )
              .catch(() => [])
          );
        }

        // ── Circles ──
        if (allowedCategories.includes("circle")) {
          promises.push(
            orgApi
              .getCircles()
              .then((result) =>
                result.items
                  .filter((c) => matchesQuery(c.name ?? "", q))
                  .slice(0, MAX_PER_CATEGORY)
                  .map((c) => ({
                    id: `circle-${c.id}`,
                    label: c.name,
                    sublabel: c.center?.name,
                    path: "/org/circles",
                    category: "circle" as const,
                  }))
              )
              .catch(() => [])
          );
        }

        const allItems = (await Promise.all(promises)).flat();

        // Group by category, preserve order
        const grouped: GroupedSearchResults = [];
        for (const cat of CATEGORY_ORDER) {
          const items = allItems.filter((item) => item.category === cat);
          if (items.length > 0) {
            grouped.push({
              category: cat,
              labelAr: CATEGORY_LABELS[cat].ar,
              labelEn: CATEGORY_LABELS[cat].en,
              items,
            });
          }
        }

        setResults(grouped);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 260);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, allowedCategories]);

  return { results, loading };
}

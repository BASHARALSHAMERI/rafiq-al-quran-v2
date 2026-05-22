import type { Role } from "../auth/types";

export type LibraryVisibility = "ORG" | "CENTER" | "CIRCLE";
export type LibraryItemStatus = "ACTIVE" | "ARCHIVED";
export type LibraryItemType = "DOCUMENT" | "AUDIO" | "VIDEO";
export type BookCategory = "TAFSIR" | "FIQH" | "HADITH" | "MATN" | "SIRA" | "GENERAL";

export type LibraryCategory = {
  id: number;
  organizationId: number;
  centerId: number | null;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
  center?: {
    id: number;
    name: string;
    code: string;
  } | null;
  [key: string]: unknown;
};

export type LibraryItem = {
  id: number;
  organizationId: number;
  centerId: number | null;
  circleId: number | null;
  categoryId: number | null;
  bookCategory: BookCategory | null;
  title: string;
  description: string | null;
  fileName: string;
  mimeType: string;
  fileSize: number;
  storageKey: string;
  coverStorageKey: string | null;
  visibility: LibraryVisibility;
  type: LibraryItemType;
  status: LibraryItemStatus;
  createdById: number;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: number;
    name: string;
    code: string;
    centerId: number | null;
  } | null;
  center?: {
    id: number;
    name: string;
    code: string;
  } | null;
  circle?: {
    id: number;
    name: string;
    centerId: number;
  } | null;
  createdBy?: {
    id: number;
    fullName: string;
    email: string;
    role: Role;
  } | null;
  [key: string]: unknown;
};

export type LibraryItemsQueryParams = {
  centerId?: number;
  circleId?: number;
  categoryId?: number;
  q?: string;
  visibility?: LibraryVisibility;
  status?: LibraryItemStatus;
  type?: LibraryItemType;
  bookCategory?: BookCategory;
  page?: number;
  pageSize?: number;
};

export type LibraryItemsResult = {
  data: LibraryItem[];
  page: number;
  pageSize: number;
  total: number;
};

export type CreateLibraryItemPayload = {
  title: string;
  description?: string;
  centerId?: number;
  circleId?: number;
  categoryId?: number;
  bookCategory?: BookCategory;
  visibility: LibraryVisibility;
  type: LibraryItemType;
  file: File;
  cover?: File;
};

export type UpdateLibraryItemPayload = {
  title?: string;
  description?: string | null;
  centerId?: number | null;
  circleId?: number | null;
  categoryId?: number | null;
  bookCategory?: BookCategory | null;
  visibility?: LibraryVisibility;
  status?: LibraryItemStatus;
  type?: LibraryItemType;
};


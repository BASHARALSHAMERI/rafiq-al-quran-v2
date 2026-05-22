import type { Role } from "../auth/types";

export type Gender = "MALE" | "FEMALE";
export type ParentRelationType = "FATHER" | "MOTHER" | "BROTHER" | "UNCLE" | "MATERNAL_UNCLE" | "GRANDFATHER" | "GRANDMOTHER" | "GUARDIAN";
export type ParentProfileRelationType = ParentRelationType | "OTHER";
export type KhatmType = "KHATIM" | "MUJAZ" | "QIRAAT";
export type RiwayaType = "HAFS" | "WARSH";
export type SupervisorProfileStatus = "ACTIVE" | "SUSPENDED";
export type StudentLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type StudentProfileStatus = "REGULAR" | "DROPPED" | "GRADUATED";

export type UsersQueryParams = {
  role?: Role;
  centerId?: number;
  circleId?: number;
  q?: string;
  page?: number;
  pageSize?: number;
};

export type PaginatedPayload<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export type UsersPayload<T> = T[] | PaginatedPayload<T>;

export type UsersListResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  isPaginated: boolean;
};

export type InvitationDeliveryPayload = {
  method: "ADMIN_LINK";
  activationLink: string;
  expiresAt: string;
  issuedAt: string;
};

export type UserProfilePayload = {
  userId?: number;
  fullName?: string;
  nickname?: string | null;
  gender?: Gender;
  birthDate?: string | null;
  phone?: string | null;
  address?: string | null;
  avatarUrl?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type TeacherProfilePayload = {
  hireDate?: string | null;
  khatmType?: KhatmType | null;
  riwaya?: RiwayaType | null;
  educationLevel?: string | null;
  yearsExperience?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type SupervisorProfilePayload = {
  assignedAt?: string | null;
  status?: SupervisorProfileStatus;
  educationLevel?: string | null;
  yearsExperience?: number | null;
  quranQualification?: KhatmType | null;
  professionalNotes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type CenterAdminProfilePayload = {
  assignedAt?: string | null;
  educationLevel?: string | null;
  yearsExperience?: number | null;
  administrativeExperienceYears?: number | null;
  professionalNotes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type StudentProfilePayload = {
  nickname?: string | null;
  level?: StudentLevel;
  studentStatus?: StudentProfileStatus;
  joinDate?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ParentProfilePayload = {
  relationType?: ParentProfileRelationType | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type UserListItem = {
  id: number;
  fullName: string;
  email: string;
  username?: string | null;
  role: Role;
  isActive: boolean;
  accountStatus?: "INVITED" | "ACTIVE" | "SUSPENDED";
  invitation?: InvitationDeliveryPayload;
  createdAt: string | null;
  updatedAt?: string | null;
  lastLoginAt?: string | null;
  phone?: string | null;
  centerName?: string;
  circleName?: string;
  profile?: UserProfilePayload | null;
  teacherProfile?: TeacherProfilePayload | null;
  supervisorProfile?: SupervisorProfilePayload | null;
  centerAdminProfile?: CenterAdminProfilePayload | null;
  studentProfile?: StudentProfilePayload | null;
  parentProfile?: ParentProfilePayload | null;
  centerAccesses?: Array<{
    centerId: number;
    center?: {
      id?: number;
      name?: string;
      code?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }>;
  circleAccesses?: Array<{
    circleId: number;
    circle?: {
      id?: number;
      name?: string;
      centerId?: number;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }>;
  studentEnrollments?: Array<{
    circleId: number;
    status?: string;
    startDate?: string | null;
    endDate?: string | null;
    circle?: {
      id?: number;
      name?: string;
      centerId?: number;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }>;
  parentLinks?: Array<{
    studentId: number;
    relationType?: ParentRelationType;
    student?: {
      id?: number;
      fullName?: string;
      email?: string;
      profile?: {
        fullName?: string;
      } | null;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }>;
  childLinks?: Array<{
    parentId: number;
    parent?: {
      id?: number;
      fullName?: string;
      email?: string;
      profile?: {
        fullName?: string;
      } | null;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
};

export type UserDetails = UserListItem;

export type UserCommonProfileInput = {
  fullName: string;
  nickname?: string | null;
  gender: Gender;
  birthDate?: string | null;
  phone?: string | null;
  address?: string | null;
  avatarUrl?: string | null;
};

export type TeacherProfileInput = {
  hireDate?: string | null;
  khatmType?: KhatmType | null;
  riwaya?: RiwayaType | null;
  educationLevel?: string | null;
  yearsExperience?: number | null;
};

export type SupervisorProfileInput = {
  assignedAt?: string | null;
  status?: SupervisorProfileStatus;
  educationLevel?: string | null;
  yearsExperience?: number | null;
  quranQualification?: KhatmType | null;
  professionalNotes?: string | null;
};

export type CenterAdminProfileInput = {
  assignedAt?: string | null;
  educationLevel?: string | null;
  yearsExperience?: number | null;
  administrativeExperienceYears?: number | null;
  professionalNotes?: string | null;
};

export type StudentProfileInput = {
  nickname?: string | null;
  level?: StudentLevel;
  studentStatus?: StudentProfileStatus;
  joinDate?: string | null;
};

export type ParentProfileInput = {
  relationType?: ParentProfileRelationType | null;
};

export type UserLinksInput = {
  centerIds?: number[];
  circleIds?: number[];
  children?: Array<{ studentId: number; relationType?: ParentRelationType }>;
  enrollments?: Array<{ circleId: number; startDate?: string }>;
  parents?: Array<{ parentId: number; relationType?: ParentRelationType }>;
  newParent?: { fullName: string; phone: string; relationType?: ParentRelationType };
};

export type CreateUserPayload = {
  // legacy compatibility
  fullName?: string;
  email: string;
  username?: string | null;
  role: Role;
  isActive?: boolean;
  profile?: UserCommonProfileInput;
  teacherProfile?: TeacherProfileInput;
  supervisorProfile?: SupervisorProfileInput;
  centerAdminProfile?: CenterAdminProfileInput;
  studentProfile?: StudentProfileInput;
  parentProfile?: ParentProfileInput;
  links?: UserLinksInput;
};

export type UpdateUserPayload = {
  // legacy compatibility
  fullName?: string;
  email?: string;
  username?: string | null;
  profile?: Partial<UserCommonProfileInput>;
  teacherProfile?: TeacherProfileInput;
  supervisorProfile?: SupervisorProfileInput;
  centerAdminProfile?: CenterAdminProfileInput;
  studentProfile?: StudentProfileInput;
  parentProfile?: ParentProfileInput;
  links?: UserLinksInput;
};

export type UpdateUserStatusPayload = {
  isActive: boolean;
};

export type AddUserCenterAccessPayload = {
  centerId: number;
};

export type AddUserCircleAccessPayload = {
  circleId: number;
};

export type AddParentStudentLinkPayload = {
  studentId: number;
  relationType?: ParentRelationType;
};

export type AddStudentEnrollmentPayload = {
  circleId: number;
  startDate?: string;
};

export type ResendActivationResponse = {
  message: string;
  invitation?: InvitationDeliveryPayload;
};

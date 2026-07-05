import { apiClient } from "../../shared/api/http";
import type { ApiResponse } from "../../shared/api/types";
import type {
  AddParentStudentLinkPayload,
  AddStudentEnrollmentPayload,
  AddUserCenterAccessPayload,
  AddUserCircleAccessPayload,
  CreateUserPayload,
  ResendActivationResponse,
  UpdateUserPayload,
  UpdateUserStatusPayload,
  UserDetails,
  UserListItem,
  UsersListResult,
  UsersPayload,
  UsersQueryParams
} from "./types";

const normalizePayload = <T>(payload: UsersPayload<T>): UsersListResult<T> => {
  if (Array.isArray(payload)) {
    return {
      items: payload,
      page: 1,
      pageSize: payload.length,
      total: payload.length,
      isPaginated: false
    };
  }

  return {
    items: payload.items,
    page: payload.page,
    pageSize: payload.pageSize,
    total: payload.total,
    isPaginated: true
  };
};

const normalizeUser = (user: UserListItem): UserListItem => {
  if (!user) return user;

  const profile =
    user.profile && typeof user.profile === "object"
      ? {
          ...user.profile,
          fullName:
            typeof user.profile.fullName === "string" && user.profile.fullName.trim()
              ? user.profile.fullName
              : String(user.fullName ?? ""),
          gender: user.profile.gender,
          birthDate: typeof user.profile.birthDate === "string" ? user.profile.birthDate : null,
          phone: typeof user.profile.phone === "string" ? user.profile.phone : null,
          address: typeof user.profile.address === "string" ? user.profile.address : null,
          avatarUrl: typeof user.profile.avatarUrl === "string" ? user.profile.avatarUrl : null,
          createdAt: typeof user.profile.createdAt === "string" ? user.profile.createdAt : null,
          updatedAt: typeof user.profile.updatedAt === "string" ? user.profile.updatedAt : null
        }
      : null;

  const normalizedFullName = profile?.fullName ?? String(user.fullName ?? "");
  const normalizedPhone = profile?.phone ?? (typeof user.phone === "string" ? user.phone : null);

  return {
    ...user,
    id: Number(user.id),
    fullName: normalizedFullName,
    email: String(user.email ?? ""),
    username: typeof user.username === "string" ? user.username : null,
    isActive: Boolean(user.isActive),
    createdAt: typeof user.createdAt === "string" ? user.createdAt : null,
    updatedAt: typeof user.updatedAt === "string" ? user.updatedAt : null,
    lastLoginAt: typeof user.lastLoginAt === "string" ? user.lastLoginAt : null,
    phone: normalizedPhone,
    profile,
    teacherProfile:
      user.teacherProfile && typeof user.teacherProfile === "object" ? user.teacherProfile : null,
    supervisorProfile:
      user.supervisorProfile && typeof user.supervisorProfile === "object"
        ? user.supervisorProfile
        : null,
    centerAdminProfile:
      user.centerAdminProfile && typeof user.centerAdminProfile === "object"
        ? user.centerAdminProfile
        : null,
    studentProfile:
      user.studentProfile && typeof user.studentProfile === "object" ? user.studentProfile : null,
    parentProfile:
      user.parentProfile && typeof user.parentProfile === "object" ? user.parentProfile : null,
    
    // Normalize Accesses
    centerAccesses: Array.isArray(user.centerAccesses)
      ? user.centerAccesses.map((item) => ({
          ...item,
          centerId: Number(item.centerId),
          center: item.center ? { ...item.center, id: Number(item.center.id) } : undefined
        }))
      : [],
    circleAccesses: Array.isArray(user.circleAccesses)
      ? user.circleAccesses.map((item) => ({
          ...item,
          circleId: Number(item.circleId),
          circle: item.circle ? { 
            ...item.circle, 
            id: Number(item.circle.id),
            centerId: item.circle.centerId ? Number(item.circle.centerId) : undefined
          } : undefined
        }))
      : [],
    
    // Normalize Enrollments (For Students)
    studentEnrollments: Array.isArray(user.studentEnrollments)
      ? user.studentEnrollments.map((item) => ({
          ...item,
          circleId: Number(item.circleId),
          circle: item.circle ? { 
            ...item.circle, 
            id: Number(item.circle.id),
            centerId: item.circle.centerId ? Number(item.circle.centerId) : undefined
          } : undefined
        }))
      : [],
    
    // Normalize Parent/Child Links
    parentLinks: Array.isArray(user.parentLinks)
      ? user.parentLinks.map((item) => ({
          ...item,
          studentId: Number(item.studentId),
          student: item.student ? { 
            ...item.student, 
            id: Number(item.student.id),
            fullName: item.student.fullName || item.student.profile?.fullName
          } : undefined
        }))
      : [],
    childLinks: Array.isArray(user.childLinks)
      ? user.childLinks.map((item) => ({
          ...item,
          parentId: Number(item.parentId),
          parent: item.parent ? { 
            ...item.parent, 
            id: Number(item.parent.id),
            fullName: item.parent.fullName || item.parent.profile?.fullName
          } : undefined
        }))
      : []
  };
};

const applyClientSearch = (users: UserListItem[], q?: string): UserListItem[] => {
  const normalized = q?.trim().toLowerCase();

  if (!normalized) {
    return users;
  }

  return users.filter((user) => {
    const fullName = String(user.fullName ?? "").toLowerCase();
    const email = String(user.email ?? "").toLowerCase();
    const phone = String(user.phone ?? "").toLowerCase();
    const username = String(user.username ?? "").toLowerCase();
    
    // Check nested names
    const centerNames = (user.centerAccesses ?? []).map(a => a.center?.name?.toLowerCase()).filter(Boolean);
    const circleNames = [
      ...(user.circleAccesses ?? []).map(a => a.circle?.name?.toLowerCase()),
      ...(user.studentEnrollments ?? []).map(e => e.circle?.name?.toLowerCase())
    ].filter(Boolean);

    return fullName.includes(normalized) || 
           email.includes(normalized) || 
           phone.includes(normalized) ||
           username.includes(normalized) ||
           centerNames.some(n => n?.includes(normalized)) ||
           circleNames.some(n => n?.includes(normalized));
  });
};

const applyClientPagination = (users: UserListItem[], page?: number, pageSize?: number) => {
  const resolvedPageSize = pageSize && pageSize > 0 ? pageSize : users.length || 10;
  const totalPages = Math.max(1, Math.ceil(users.length / resolvedPageSize));
  const resolvedPage = page && page > 0 ? Math.min(page, totalPages) : 1;
  const start = (resolvedPage - 1) * resolvedPageSize;
  const items = users.slice(start, start + resolvedPageSize);

  return {
    items,
    page: resolvedPage,
    pageSize: resolvedPageSize,
    total: users.length
  };
};

const normalizeUserResponse = (response: ApiResponse<UserDetails>): UserDetails => {
  return normalizeUser(response.data) as UserDetails;
};

export const usersApi = {
  async getUsers(params: UsersQueryParams): Promise<UsersListResult<UserListItem>> {
    const response = await apiClient.get<ApiResponse<UsersPayload<UserListItem>>>("/users", {
      params: {
        role: Array.isArray(params.role) ? params.role.join(',') : params.role,
        centerId: params.centerId,
        circleId: params.circleId
      }
    });

    const normalized = normalizePayload(response.data.data);
    const normalizedUsers = normalized.items.map((user) => normalizeUser(user));
    const searchedUsers = applyClientSearch(normalizedUsers, params.q);

    if (!normalized.isPaginated) {
      const paged = applyClientPagination(searchedUsers, params.page, params.pageSize);

      return {
        items: paged.items,
        page: paged.page,
        pageSize: paged.pageSize,
        total: paged.total,
        isPaginated: false
      };
    }

    return {
      ...normalized,
      items: searchedUsers,
      total: searchedUsers.length
    };
  },

  async getUserById(userId: number): Promise<UserDetails> {
    const response = await apiClient.get<ApiResponse<UserDetails>>(`/users/${userId}`);
    return normalizeUserResponse(response.data);
  },

  async createUser(payload: CreateUserPayload): Promise<UserDetails> {
    const response = await apiClient.post<ApiResponse<UserDetails>>("/users", payload);
    return normalizeUserResponse(response.data);
  },

  async updateUser(userId: number, payload: UpdateUserPayload): Promise<UserDetails> {
    const response = await apiClient.patch<ApiResponse<UserDetails>>(`/users/${userId}`, payload);
    return normalizeUserResponse(response.data);
  },

  async updateUserStatus(userId: number, payload: UpdateUserStatusPayload): Promise<UserDetails> {
    const response = await apiClient.patch<ApiResponse<UserDetails>>(`/users/${userId}/status`, payload);
    return normalizeUserResponse(response.data);
  },

  async addCenterAccess(userId: number, payload: AddUserCenterAccessPayload): Promise<UserDetails> {
    const response = await apiClient.post<ApiResponse<UserDetails>>(`/users/${userId}/center-access`, payload);
    return normalizeUserResponse(response.data);
  },

  async removeCenterAccess(userId: number, centerId: number): Promise<UserDetails> {
    const response = await apiClient.delete<ApiResponse<UserDetails>>(
      `/users/${userId}/center-access/${centerId}`
    );
    return normalizeUserResponse(response.data);
  },

  async addCircleAccess(userId: number, payload: AddUserCircleAccessPayload): Promise<UserDetails> {
    const response = await apiClient.post<ApiResponse<UserDetails>>(`/users/${userId}/circle-access`, payload);
    return normalizeUserResponse(response.data);
  },

  async removeCircleAccess(userId: number, circleId: number): Promise<UserDetails> {
    const response = await apiClient.delete<ApiResponse<UserDetails>>(
      `/users/${userId}/circle-access/${circleId}`
    );
    return normalizeUserResponse(response.data);
  },

  async addParentStudentLink(userId: number, payload: AddParentStudentLinkPayload): Promise<UserDetails> {
    const response = await apiClient.post<ApiResponse<UserDetails>>(`/users/${userId}/parent-links`, payload);
    return normalizeUserResponse(response.data);
  },

  async removeParentStudentLink(userId: number, studentId: number): Promise<UserDetails> {
    const response = await apiClient.delete<ApiResponse<UserDetails>>(
      `/users/${userId}/parent-links/${studentId}`
    );
    return normalizeUserResponse(response.data);
  },

  async addStudentEnrollment(userId: number, payload: AddStudentEnrollmentPayload): Promise<UserDetails> {
    const response = await apiClient.post<ApiResponse<UserDetails>>(`/users/${userId}/enrollments`, payload);
    return normalizeUserResponse(response.data);
  },

  async removeStudentEnrollment(userId: number, circleId: number): Promise<UserDetails> {
    const response = await apiClient.delete<ApiResponse<UserDetails>>(
      `/users/${userId}/enrollments/${circleId}`
    );
    return normalizeUserResponse(response.data);
  },

  async deleteUser(userId: number): Promise<void> {
    await apiClient.delete(`/users/${userId}`);
  },

  async resendActivation(userId: number): Promise<ResendActivationResponse> {
    const response = await apiClient.post<ApiResponse<ResendActivationResponse>>(
      `/users/${userId}/activation/resend`
    );
    return response.data.data;
  }
};

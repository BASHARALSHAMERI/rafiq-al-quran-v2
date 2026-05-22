import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AddParentStudentLinkPayload,
  AddStudentEnrollmentPayload,
  AddUserCenterAccessPayload,
  AddUserCircleAccessPayload,
  UsersQueryParams,
  CreateUserPayload,
  UpdateUserPayload,
  UpdateUserStatusPayload
} from "./types";
import { usersApi } from "./users.api";

export const USERS_QUERY_KEYS = {
  all: ["users"] as const,
  list: (
    params: Pick<
      UsersQueryParams,
      "role" | "centerId" | "circleId" | "q" | "page" | "pageSize"
    >
  ) =>
    [
      ...USERS_QUERY_KEYS.all,
      "list",
      params.role ?? null,
      params.centerId ?? null,
      params.circleId ?? null,
      params.q ?? null,
      params.page ?? null,
      params.pageSize ?? null
    ] as const,
  details: (userId: number) => [...USERS_QUERY_KEYS.all, "details", userId] as const
};

export const useUsersQuery = (
  params: Pick<UsersQueryParams, "role" | "centerId" | "circleId" | "q" | "page" | "pageSize">,
  enabled = true
) => {
  return useQuery({
    queryKey: USERS_QUERY_KEYS.list(params),
    queryFn: () => usersApi.getUsers({ ...params }),
    enabled,
    staleTime: 60_000
  });
};

export const useUserByIdQuery = (userId: number | null, enabled = true) => {
  return useQuery({
    queryKey: USERS_QUERY_KEYS.details(userId ?? 0),
    queryFn: () => usersApi.getUserById(userId ?? 0),
    enabled: enabled && Boolean(userId),
    staleTime: 30_000
  });
};

export type { CreateUserPayload, UpdateUserPayload, UpdateUserStatusPayload };

const invalidateUsers = async (queryClient: ReturnType<typeof useQueryClient>, userId?: number) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.all }),
    ...(typeof userId === "number"
      ? [queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.details(userId) })]
      : [])
  ]);
};

export const useCreateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserPayload) => usersApi.createUser(payload),
    onSuccess: async (result) => {
      await invalidateUsers(queryClient, result.id);
    }
  });
};

export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { userId: number; payload: UpdateUserPayload }) =>
      usersApi.updateUser(input.userId, input.payload),
    onSuccess: async (result) => {
      await invalidateUsers(queryClient, result.id);
    }
  });
};

export const useUserStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { userId: number; payload: UpdateUserStatusPayload }) =>
      usersApi.updateUserStatus(input.userId, input.payload),
    onSuccess: async (result) => {
      await invalidateUsers(queryClient, result.id);
    }
  });
};

export const useAddUserCenterAccessMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { userId: number; payload: AddUserCenterAccessPayload }) =>
      usersApi.addCenterAccess(input.userId, input.payload),
    onSuccess: async (result) => {
      await invalidateUsers(queryClient, result.id);
    }
  });
};

export const useRemoveUserCenterAccessMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { userId: number; centerId: number }) =>
      usersApi.removeCenterAccess(input.userId, input.centerId),
    onSuccess: async (result) => {
      await invalidateUsers(queryClient, result.id);
    }
  });
};

export const useAddUserCircleAccessMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { userId: number; payload: AddUserCircleAccessPayload }) =>
      usersApi.addCircleAccess(input.userId, input.payload),
    onSuccess: async (result) => {
      await invalidateUsers(queryClient, result.id);
    }
  });
};

export const useRemoveUserCircleAccessMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { userId: number; circleId: number }) =>
      usersApi.removeCircleAccess(input.userId, input.circleId),
    onSuccess: async (result) => {
      await invalidateUsers(queryClient, result.id);
    }
  });
};

export const useAddParentStudentLinkMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { userId: number; payload: AddParentStudentLinkPayload }) =>
      usersApi.addParentStudentLink(input.userId, input.payload),
    onSuccess: async (result) => {
      await invalidateUsers(queryClient, result.id);
    }
  });
};

export const useRemoveParentStudentLinkMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { userId: number; studentId: number }) =>
      usersApi.removeParentStudentLink(input.userId, input.studentId),
    onSuccess: async (result) => {
      await invalidateUsers(queryClient, result.id);
    }
  });
};

export const useAddStudentEnrollmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { userId: number; payload: AddStudentEnrollmentPayload }) =>
      usersApi.addStudentEnrollment(input.userId, input.payload),
    onSuccess: async (result) => {
      await invalidateUsers(queryClient, result.id);
    }
  });
};

export const useRemoveStudentEnrollmentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { userId: number; circleId: number }) =>
      usersApi.removeStudentEnrollment(input.userId, input.circleId),
    onSuccess: async (result) => {
      await invalidateUsers(queryClient, result.id);
    }
  });
};

export const useDeleteUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => usersApi.deleteUser(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.all });
    }
  });
};

export const useResendActivationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => usersApi.resendActivation(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.all });
    }
  });
};

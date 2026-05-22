import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "./auth.api";
import { useAuthStore } from "./auth.store";
import type { CheckUserPayload, ForgotPasswordPayload, LoginPayload, ResetPasswordPayload, SetupPasswordPayload } from "./types";

export const AUTH_ME_QUERY_KEY = ["auth", "me"] as const;

export const useLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (session) => {
      const store = useAuthStore.getState();
      store.setSession(session);
      store.setUser(session.user);

      void queryClient.invalidateQueries({
        queryKey: AUTH_ME_QUERY_KEY
      });
    }
  });
};

export const useMeQuery = (enabled: boolean) => {
  return useQuery({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: () => authApi.me(),
    enabled,
    staleTime: 60_000,
    retry: false
  });
};

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => useAuthStore.getState().logout(),
    onSettled: () => {
      queryClient.removeQueries({
        queryKey: AUTH_ME_QUERY_KEY
      });
      queryClient.removeQueries({
        queryKey: ["dashboard"]
      });
    }
  });
};

export const useForgotPasswordMutation = () => {
  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) => authApi.forgotPassword(payload)
  });
};

export const useResetPasswordMutation = () => {
  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) => authApi.resetPassword(payload)
  });
};

export const useCheckUserMutation = () => {
  return useMutation({
    mutationFn: (payload: CheckUserPayload) => authApi.checkUser(payload)
  });
};

export const useSetupPasswordMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SetupPasswordPayload) => authApi.setupPassword(payload),
    onSuccess: (session) => {
      const store = useAuthStore.getState();
      store.setSession(session);
      store.setUser(session.user);

      void queryClient.invalidateQueries({
        queryKey: AUTH_ME_QUERY_KEY
      });
    }
  });
};

export const useActivateAccountMutation = () => {
  return useMutation({
    mutationFn: (payload: { token: string; newPassword: string }) => authApi.activateAccount(payload)
  });
};

export const useValidateActivationTokenQuery = (token: string, enabled: boolean) => {
  return useQuery({
    queryKey: ["auth", "activation", "validate", token],
    queryFn: () => authApi.validateActivationToken(token),
    enabled: enabled && !!token,
    retry: false,
    staleTime: 0
  });
};

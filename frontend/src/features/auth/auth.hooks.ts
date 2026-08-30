import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "./auth.store";
import type { CheckUserPayload, ForgotPasswordPayload, LoginPayload, ResetPasswordPayload, SetupPasswordPayload } from "./types";

const loadAuthApi = () => import("./auth.api").then((module) => module.authApi);

export const AUTH_ME_QUERY_KEY = ["auth", "me"] as const;

export const useLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginPayload) => loadAuthApi().then((api) => api.login(payload)),
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
    queryFn: () => loadAuthApi().then((api) => api.me()),
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
    mutationFn: (payload: ForgotPasswordPayload) => loadAuthApi().then((api) => api.forgotPassword(payload))
  });
};

export const useResetPasswordMutation = () => {
  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) => loadAuthApi().then((api) => api.resetPassword(payload))
  });
};

export const useCheckUserMutation = () => {
  return useMutation({
    mutationFn: (payload: CheckUserPayload) => loadAuthApi().then((api) => api.checkUser(payload))
  });
};

export const useSetupPasswordMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SetupPasswordPayload) => loadAuthApi().then((api) => api.setupPassword(payload)),
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
    mutationFn: (payload: { token: string; newPassword: string }) => loadAuthApi().then((api) => api.activateAccount(payload))
  });
};

export const useValidateActivationTokenQuery = (token: string, enabled: boolean) => {
  return useQuery({
    queryKey: ["auth", "activation", "validate", token],
    queryFn: () => loadAuthApi().then((api) => api.validateActivationToken(token)),
    enabled: enabled && !!token,
    retry: false,
    staleTime: 0
  });
};

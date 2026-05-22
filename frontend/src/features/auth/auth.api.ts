import { apiClient, ensureFreshAccessToken } from "../../shared/api/http";
import type { ApiResponse } from "../../shared/api/types";
import type {
  AuthSessionResponse,
  AuthUser,
  CheckUserPayload,
  CheckUserResponse,
  ForgotPasswordPayload,
  LoginPayload,
  ResetPasswordPayload,
  SetupPasswordPayload,
  ActivateAccountPayload,
  ActivationTokenResponse
} from "./types";

export const authApi = {
  async login(payload: LoginPayload): Promise<AuthSessionResponse> {
    const response = await apiClient.post<ApiResponse<AuthSessionResponse>>(
      "/auth/login",
      payload
    );

    return response.data.data;
  },

  async checkUser(payload: CheckUserPayload): Promise<CheckUserResponse> {
    const response = await apiClient.post<ApiResponse<CheckUserResponse>>(
      "/auth/check-user",
      payload
    );
    return response.data.data;
  },

  async setupPassword(payload: SetupPasswordPayload): Promise<AuthSessionResponse> {
    const response = await apiClient.post<ApiResponse<AuthSessionResponse>>(
      "/auth/setup-password",
      payload
    );
    return response.data.data;
  },

  async me(): Promise<AuthUser> {
    const response = await apiClient.get<ApiResponse<AuthUser>>("/auth/me");
    return response.data.data;
  },

  async logout(): Promise<void> {
    await apiClient.post<ApiResponse<{ message: string }>>("/auth/logout", {});
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<{ message: string }> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      "/auth/forgot-password",
      payload
    );
    return response.data.data;
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<{ message: string }> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      "/auth/reset-password",
      payload
    );
    return response.data.data;
  },

  async validateActivationToken(token: string): Promise<ActivationTokenResponse> {
    const response = await apiClient.post<ApiResponse<ActivationTokenResponse>>(
      "/auth/activation/validate",
      { token }
    );
    return response.data.data;
  },

  async activateAccount(payload: ActivateAccountPayload): Promise<{ message: string }> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      "/auth/activation/activate",
      payload
    );
    return response.data.data;
  },

  async bootstrapSession(): Promise<string | null> {
    return ensureFreshAccessToken();
  }
};

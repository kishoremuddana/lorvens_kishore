import { apiClient, setSessionToken } from "./api";
import type {
  DashboardResponse,
  MessageResponse,
  TokenResponse,
} from "../types/auth";

export const authService = {
  /**
   * Request a 6-digit OTP for the admin email.
   * Endpoint: POST /api/v1/auth/send-otp
   */
  async sendOtp(email: string): Promise<MessageResponse> {
    return apiClient<MessageResponse>("/api/v1/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
  },

  /**
   * Verify the 6-digit OTP and receive an access token.
   * Endpoint: POST /api/v1/auth/verify-otp
   */
  async verifyOtp(email: string, otp: string): Promise<TokenResponse> {
    const data = await apiClient<TokenResponse>("/api/v1/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      }),
    });
    if (data.access_token) {
      setSessionToken(data.access_token);
    }
    return data;
  },

  /**
   * Revoke the current access token and log out.
   * Endpoint: POST /api/v1/auth/logout
   */
  async logout(): Promise<MessageResponse> {
    try {
      const res = await apiClient<MessageResponse>("/api/v1/auth/logout", {
        method: "POST",
      });
      return res;
    } finally {
      setSessionToken(null);
    }
  },

  /**
   * Fetch authenticated admin dashboard profile details.
   * Endpoint: GET /api/v1/admin/dashboard
   */
  async getDashboardData(): Promise<DashboardResponse> {
    return apiClient<DashboardResponse>("/api/v1/admin/dashboard", {
      method: "GET",
    });
  },
};

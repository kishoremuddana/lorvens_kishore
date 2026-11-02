export interface AdminUser {
  email: string;
  role: string;
  message?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface MessageResponse {
  message: string;
}

export interface DashboardResponse {
  message: string;
  admin_email: string;
  role: string;
}

export interface ApiError {
  detail: string;
}

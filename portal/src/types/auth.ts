
export interface AuthUser {
  id: string;
  full_name: string;
  email: string;
  role: "admin" | "user";
}

export interface DashboardResponse {
  message: string;
  admin_email: string;
  role: string;

  statistics: {
    total_applications: number;
    pending_applications: number;
    total_registered_users: number;
    total_paid_memberships: number;
    total_payments: number;
  };
}

export interface CustomerDashboardResponse {
  user: AuthUser;
  [key: string]: unknown;
}

export interface MessageResponse {
  message: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user_id: string;
  email: string;
  full_name: string;
  role: "admin" | "user";
}

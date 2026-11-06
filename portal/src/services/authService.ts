
import { apiClient, setSessionToken } from "./api";

import type {
  DashboardResponse,
  CustomerDashboardResponse,
  MessageResponse,
  TokenResponse,
} from "../types/auth";

export interface MembershipApplicationPayload {
  application_data: Record<string, unknown>;
  family_members: {
    fullName: string;
    relationship: string;
    dob: string;
  }[];
}

export interface UploadedApplicationDocument {
  document_type: "photo" | "panDocument" | "aadhaarDocument";
  file_name: string;
  content_type?: string;
  size?: number;
  uploaded_at?: string;
  download_url?: string;
}

export interface MembershipApplicationRecord {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
  status?: string;
  submitted?: boolean;
  application_data: Record<string, unknown>;
  family_members: {
    fullName: string;
    relationship: string;
    dob: string;
  }[];
  document_files?: UploadedApplicationDocument[];
  created_at?: string;
  updated_at?: string;
  submitted_at?: string | null;
}

export interface MembershipApplicationResponse {
  message?: string;
  submitted: boolean;
  saved?: boolean;
  application_id?: string;
  submitted_at?: string;
  application?: MembershipApplicationRecord | null;
}

export interface AdminApplication {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
  status?: string;
  submitted_at?: string | null;
}

export interface AdminApplicationsResponse {
  items: AdminApplication[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export const authService = {
  // --------------------------------
  // ADMIN AUTHENTICATION
  // --------------------------------

  async sendOtp(email: string): Promise<MessageResponse> {
    return apiClient<MessageResponse>("/api/v1/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
      }),
    });
  },

  async verifyOtp(email: string, otp: string): Promise<TokenResponse> {
    const data = await apiClient<TokenResponse>(
      "/api/v1/auth/verify-otp",
      {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
        }),
      }
    );

    if (data.access_token) {
      setSessionToken(data.access_token);
    }

    return data;
  },

  // --------------------------------
  // CUSTOMER AUTHENTICATION
  // --------------------------------

  // async sendCustomerOtp(mobile: string): Promise<MessageResponse> {
  //   return apiClient<MessageResponse>(
  //     "/api/v1/auth/customer/send-otp",
  //     {
  //       method: "POST",
  //       body: JSON.stringify({
  //         mobile: mobile.trim(),
  //       }),
  //     }
  //   );
  // },

  // async verifyCustomerOtp(
  //   mobile: string,
  //   otp: string
  // ): Promise<TokenResponse> {
  //   const data = await apiClient<TokenResponse>(
  //     "/api/v1/auth/customer/verify-otp",
  //     {
  //       method: "POST",
  //       body: JSON.stringify({
  //         mobile: mobile.trim(),
  //         otp: otp.trim(),
  //       }),
  //     }
  //   );

  //   if (data.access_token) {
  //     setSessionToken(data.access_token);
  //   }

  //   return data;
  // },

  // --------------------------------
  // ADMIN DASHBOARD
  // --------------------------------

  async getDashboardData(): Promise<DashboardResponse> {
    return apiClient<DashboardResponse>("/api/v1/admin/dashboard");
  },

  async getAdminApplications(
    page = 1,
    limit = 5,
    search = ""
  ): Promise<AdminApplicationsResponse> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (search.trim()) {
      params.append("search", search.trim());
    }

    return apiClient<AdminApplicationsResponse>(
      `/api/v1/admin/applications?${params.toString()}`
    );
  },

  async getAdminApplicationDetails(
    applicationId: string
  ): Promise<Record<string, unknown>> {
    return apiClient<Record<string, unknown>>(
      `/api/v1/admin/applications/${encodeURIComponent(applicationId)}`
    );
  },

  // --------------------------------
  // CUSTOMER DASHBOARD
  // --------------------------------

  async getCustomerDashboard(): Promise<CustomerDashboardResponse> {
    return apiClient<CustomerDashboardResponse>(
      "/api/v1/customer/dashboard"
    );
  },

  async getCustomerApplication(): Promise<MembershipApplicationResponse> {
    return apiClient<MembershipApplicationResponse>(
      "/api/v1/customer/application"
    );
  },

  async saveCustomerApplicationDraft(
    payload: MembershipApplicationPayload
  ): Promise<MembershipApplicationResponse> {
    return apiClient<MembershipApplicationResponse>(
      "/api/v1/customer/application/draft",
      {
        method: "PUT",
        body: JSON.stringify(payload),
      }
    );
  },

  async uploadCustomerApplicationDocument(
    documentType: UploadedApplicationDocument["document_type"],
    file: File
  ): Promise<{
    message: string;
    document: UploadedApplicationDocument;
  }> {
    const body = new FormData();
    body.append("file", file);

    return apiClient<{
      message: string;
      document: UploadedApplicationDocument;
    }>(
      `/api/v1/customer/application/documents?document_type=${encodeURIComponent(
        documentType
      )}`,
      {
        method: "POST",
        body,
      }
    );
  },

  async submitCustomerApplication(
    payload: MembershipApplicationPayload
  ): Promise<MembershipApplicationResponse> {
    return apiClient<MembershipApplicationResponse>(
      "/api/v1/customer/application",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  // --------------------------------
  // LOGOUT
  // --------------------------------

  async logout(role?: string): Promise<void> {
    try {
      if (role === "admin") {
        await apiClient<MessageResponse>("/api/v1/auth/logout", {
          method: "POST",
        });
      }
    } finally {
      setSessionToken(null);
    }
  },
};

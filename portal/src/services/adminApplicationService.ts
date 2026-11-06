import {
  apiClient,
  downloadProtectedFile,
} from "./api";

export interface AdminApplicationRow {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
  submitted_at?: string | null;
}

export interface AdminDocument {
  document_type: "photo" | "panDocument" | "aadhaarDocument";
  file_name: string;
  content_type?: string;
  size?: number;
  uploaded_at?: string;
}

export interface AdminApplicationDetails
  extends AdminApplicationRow {
  application_data: Record<string, unknown>;
  family_members: Array<Record<string, unknown>>;
  document_files: AdminDocument[];
  payments: Array<Record<string, unknown>>;
}

export interface AdminApplicationsResponse {
  items: AdminApplicationRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export const adminApplicationService = {
  getApplications(
    page = 1,
    limit = 10,
    search = ""
  ) {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (search.trim()) {
      query.set("search", search.trim());
    }

    return apiClient<AdminApplicationsResponse>(
      `/api/v1/admin/applications?${query}`
    );
  },

  getDetails(id: string) {
    return apiClient<AdminApplicationDetails>(
      `/api/v1/admin/applications/${encodeURIComponent(id)}`
    );
  },

  viewDocument(
    applicationId: string,
    documentType: AdminDocument["document_type"],
    fileName: string
  ) {
    return downloadProtectedFile(
      `/api/v1/admin/applications/${encodeURIComponent(applicationId)}/documents/${documentType}`,
      fileName,
      false
    );
  },

  downloadDocument(
    applicationId: string,
    documentType: AdminDocument["document_type"],
    fileName: string
  ) {
    return downloadProtectedFile(
      `/api/v1/admin/applications/${encodeURIComponent(applicationId)}/documents/${documentType}?download=true`,
      fileName,
      true
    );
  },
};
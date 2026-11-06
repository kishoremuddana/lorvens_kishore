const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

const SESSION_TOKEN_KEY = "lorvens_admin_session_token";

let inMemoryToken: string | null = null;
let onUnauthorizedCallback: (() => void) | null = null;

export const setSessionToken = (token: string | null) => {
  inMemoryToken = token;
  if (token) {
    sessionStorage.setItem(SESSION_TOKEN_KEY, token);
  } else {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
  }
};

export const getSessionToken = (): string | null => {
  if (inMemoryToken) return inMemoryToken;
  const stored = sessionStorage.getItem(SESSION_TOKEN_KEY);
  if (stored) {
    inMemoryToken = stored;
    return stored;
  }
  return null;
};

export const registerUnauthorizedHandler = (callback: () => void) => {
  onUnauthorizedCallback = callback;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const headers = new Headers(options.headers || {});

  // The browser must set the multipart boundary for FormData requests.
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = getSessionToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    setSessionToken(null);
    if (onUnauthorizedCallback) {
      onUnauthorizedCallback();
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorDetail =
      data.detail ||
      data.message ||
      (Array.isArray(data) && data[0]?.msg) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(errorDetail, response.status);
  }

  return data as T;
}


export async function downloadProtectedFile(
  endpoint: string,
  fileName: string,
  forceDownload: boolean
): Promise<void> {
  const url = `${API_BASE_URL}${
    endpoint.startsWith("/") ? endpoint : `/${endpoint}`
  }`;

  const headers = new Headers();

  const token = getSessionToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  if (response.status === 401) {
    setSessionToken(null);

    if (onUnauthorizedCallback) {
      onUnauthorizedCallback();
    }
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));

    throw new ApiError(
      data.detail || data.message || "Document request failed",
      response.status
    );
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  if (forceDownload) {
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    link.remove();
  } else {
    window.open(objectUrl, "_blank", "noopener,noreferrer");
  }

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 60000);
}
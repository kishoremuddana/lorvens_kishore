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
  headers.set("Content-Type", "application/json");

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

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { authService } from "../services/authService";
import {
  getSessionToken,
  registerUnauthorizedHandler,
  setSessionToken,
} from "../services/api";
import type { AdminUser } from "../types/auth";

interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  pendingEmail: string;
  setPendingEmail: (email: string) => void;
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setTokenState] = useState<string | null>(getSessionToken());
  const [pendingEmail, setPendingEmail] = useState<string>(
    () => sessionStorage.getItem("lorvens_pending_email") || ""
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const handleUpdatePendingEmail = (email: string) => {
    setPendingEmail(email);
    if (email) {
      sessionStorage.setItem("lorvens_pending_email", email);
    } else {
      sessionStorage.removeItem("lorvens_pending_email");
    }
  };

  const handleUnauthorized = useCallback(() => {
    setUser(null);
    setTokenState(null);
    setSessionToken(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(handleUnauthorized);
  }, [handleUnauthorized]);

  // Check existing session token on initial mount
  useEffect(() => {
    const existingToken = getSessionToken();
    if (!existingToken) {
      setIsLoading(false);
      return;
    }

    authService
      .getDashboardData()
      .then((data) => {
        setUser({
          email: data.admin_email,
          role: data.role,
          message: data.message,
        });
        setTokenState(existingToken);
      })
      .catch(() => {
        handleUnauthorized();
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [handleUnauthorized]);

  const sendOtp = async (email: string): Promise<void> => {
    setError(null);
    setIsLoading(true);
    try {
      await authService.sendOtp(email);
      handleUpdatePendingEmail(email);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send OTP";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (otp: string): Promise<void> => {
    setError(null);
    setIsLoading(true);
    try {
      const tokenRes = await authService.verifyOtp(pendingEmail, otp);
      setTokenState(tokenRes.access_token);

      // Fetch admin profile
      const dashboard = await authService.getDashboardData();
      setUser({
        email: dashboard.admin_email,
        role: dashboard.role,
        message: dashboard.message,
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to verify OTP";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch {
      // Continue client cleanup even if network fails
    } finally {
      setUser(null);
      setTokenState(null);
      handleUpdatePendingEmail("");
      setSessionToken(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        error,
        pendingEmail,
        setPendingEmail: handleUpdatePendingEmail,
        sendOtp,
        verifyOtp,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};


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

import type {
  AuthUser,
  CustomerDashboardResponse,
} from "../types/auth";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  customerDashboard: CustomerDashboardResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  pendingEmail: string;
  setPendingEmail: (email: string) => void;

  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<AuthUser>;

  // Customer mobile OTP login is currently disabled.
  // sendCustomerOtp: (mobile: string) => Promise<void>;
  // verifyCustomerOtp: (mobile: string, otp: string) => Promise<AuthUser>;

  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = "lorvens_auth_user";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // --------------------------------
  // STATE
  // --------------------------------

  const [user, setUser] = useState<AuthUser | null>(() => {
    const savedUser = sessionStorage.getItem(USER_STORAGE_KEY);

    if (!savedUser) return null;

    try {
      return JSON.parse(savedUser) as AuthUser;
    } catch {
      sessionStorage.removeItem(USER_STORAGE_KEY);
      return null;
    }
  });

  const [token, setTokenState] = useState<string | null>(
    getSessionToken()
  );

  const [customerDashboard, setCustomerDashboard] =
    useState<CustomerDashboardResponse | null>(null);

  const [pendingEmail, setPendingEmail] = useState<string>(
    () => sessionStorage.getItem("lorvens_pending_email") || ""
  );

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --------------------------------
  // COMMON HELPERS
  // --------------------------------

  const clearError = () => {
    setError(null);
  };

  const handleUpdatePendingEmail = (email: string) => {
    setPendingEmail(email);

    if (email) {
      sessionStorage.setItem("lorvens_pending_email", email);
    } else {
      sessionStorage.removeItem("lorvens_pending_email");
    }
  };

  const saveUser = (authUser: AuthUser) => {
    setUser(authUser);
    sessionStorage.setItem(
      USER_STORAGE_KEY,
      JSON.stringify(authUser)
    );
  };

  const clearAuth = () => {
    setUser(null);
    setTokenState(null);
    setCustomerDashboard(null);
    setSessionToken(null);

    sessionStorage.removeItem(USER_STORAGE_KEY);
  };

  // --------------------------------
  // UNAUTHORIZED HANDLER
  // --------------------------------

  const handleUnauthorized = useCallback(() => {
    clearAuth();
    setIsLoading(false);
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(handleUnauthorized);
  }, [handleUnauthorized]);

  // --------------------------------
  // RESTORE EXISTING SESSION
  // --------------------------------

  useEffect(() => {
    const existingToken = getSessionToken();

    if (!existingToken || !user) {
      if (existingToken && !user) {
        clearAuth();
      }

      setIsLoading(false);
      return;
    }

    const restoreSession = async () => {
      try {
        if (user.role === "admin") {
          const dashboard = await authService.getDashboardData();

          saveUser({
            id: user.id,
            full_name: user.full_name,
            email: dashboard.admin_email,
            role: dashboard.role,
          });
        } else if (user.role === "user") {
          const dashboard = await authService.getCustomerDashboard();

          setCustomerDashboard(dashboard);
          saveUser(dashboard.user);
        } else {
          clearAuth();
        }

        setTokenState(existingToken);
      } catch {
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();

    // Restore once when the provider mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------------------------------
  // ADMIN SEND OTP
  // --------------------------------

  const sendOtp = async (email: string): Promise<void> => {
    setError(null);
    setIsLoading(true);

    try {
      await authService.sendOtp(email);
      handleUpdatePendingEmail(email);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to send OTP";

      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------
  // ADMIN VERIFY OTP
  // --------------------------------

  const verifyOtp = async (otp: string): Promise<AuthUser> => {
    setError(null);
    setIsLoading(true);

    try {
      const tokenResponse = await authService.verifyOtp(
        pendingEmail,
        otp
      );

      setTokenState(tokenResponse.access_token);

      const authenticatedUser: AuthUser = {
        id: tokenResponse.user_id,
        full_name: tokenResponse.full_name,
        email: tokenResponse.email,
        role: tokenResponse.role,
      };

      if (authenticatedUser.role === "admin") {
        await authService.getDashboardData();

        saveUser(authenticatedUser);
        setCustomerDashboard(null);
      } else if (authenticatedUser.role === "user") {
        const dashboard = await authService.getCustomerDashboard();

        setCustomerDashboard(dashboard);
        saveUser(dashboard.user);
      } else {
        throw new Error(
          "Your account does not have an authorized role."
        );
      }

      handleUpdatePendingEmail("");

      return authenticatedUser;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to verify OTP";

      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------
  // CUSTOMER SEND OTP
  // --------------------------------

  // const sendCustomerOtp = async (
  //   mobile: string
  // ): Promise<void> => {
  //   setError(null);
  //   setIsLoading(true);

  //   try {
  //     await authService.sendCustomerOtp(mobile);
  //   } catch (err: unknown) {
  //     const message =
  //       err instanceof Error ? err.message : "Failed to send OTP";

  //     setError(message);
  //     throw err;
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // // --------------------------------
  // // CUSTOMER VERIFY OTP
  // // --------------------------------

  // const verifyCustomerOtp = async (
  //   mobile: string,
  //   otp: string
  // ): Promise<AuthUser> => {
  //   setError(null);
  //   setIsLoading(true);

  //   try {
  //     const tokenResponse = await authService.verifyCustomerOtp(
  //       mobile,
  //       otp
  //     );

  //     if (tokenResponse.role !== "user") {
  //       throw new Error(
  //         "This login is only for customer accounts."
  //       );
  //     }

  //     setTokenState(tokenResponse.access_token);

  //     const dashboard = await authService.getCustomerDashboard();

  //     setCustomerDashboard(dashboard);
  //     saveUser(dashboard.user);

  //     return dashboard.user;
  //   } catch (err: unknown) {
  //     const message =
  //       err instanceof Error ? err.message : "Failed to verify OTP";

  //     setError(message);
  //     throw err;
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // --------------------------------
  // LOGOUT
  // --------------------------------

  const logout = async (): Promise<void> => {
    setIsLoading(true);

    try {
      await authService.logout(user?.role);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAuth();
      handleUpdatePendingEmail("");
      setIsLoading(false);
    }
  };

  // --------------------------------
  // PROVIDER
  // --------------------------------

  return (
  <AuthContext.Provider
    value={{
      user,
      token,
      customerDashboard,
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

// --------------------------------
// CUSTOM HOOK
// --------------------------------

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

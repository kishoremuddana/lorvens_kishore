import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";
import { ApplicationsPage } from "../pages/ApplicationsPage";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { UserDashboard } from "../pages/UserDashboard";
import UserLogin from "../pages/UserLogin";

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/admin/login" element={<LoginPage />} />

      {/* Admin routes */}
      <Route element={<ProtectedRoute allowedRole="admin" />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin/dashboard" element={<DashboardPage />} />
          <Route
            path="/admin/dashboard/applications"
            element={<ApplicationsPage />}
          />
          <Route
            path="/admin/dashboard/members"
            element={<DashboardPage />}
          />
          <Route
            path="/admin/dashboard/security"
            element={<DashboardPage />}
          />
        </Route>
      </Route>

      {/* Customer route */}
      <Route path="/login" element={<UserLogin />} />
      <Route element={<ProtectedRoute allowedRole="user" />}>
        <Route path="/user/dashboard" element={<UserDashboard />} />
      </Route>

      <Route path="/" element={<Navigate to="/admin/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};
import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { ProtectedRoute } from "./ProtectedRoute";

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* PUBLIC AUTH ROUTE */}
      <Route path="/login" element={<LoginPage />} />

      {/* PROTECTED ADMIN ROUTES */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route
            path="/dashboard/applications"
            element={<DashboardPage />}
          />
          <Route
            path="/dashboard/members"
            element={<DashboardPage />}
          />
          <Route
            path="/dashboard/security"
            element={<DashboardPage />}
          />
        </Route>
      </Route>

      {/* ROOT & CATCH-ALL REDIRECTS */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

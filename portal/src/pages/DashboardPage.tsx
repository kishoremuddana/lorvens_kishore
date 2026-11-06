import React, { useCallback, useEffect, useState } from "react";
import {
  Clock,
  CreditCard,
  FileText,
  RefreshCw,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import { authService } from "../services/authService";

import type { DashboardResponse } from "../types/auth";
import type { AdminApplication } from "../services/authService";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [dashboardData, setDashboardData] =
    useState<DashboardResponse | null>(null);

  const [applications, setApplications] = useState<AdminApplication[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (manual = false) => {
    if (manual) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const [dashboardResult, applicationsResult] =
        await Promise.allSettled([
          authService.getDashboardData(),
          authService.getAdminApplications(1, 5),
        ]);

      if (dashboardResult.status === "fulfilled") {
        setDashboardData(dashboardResult.value);
      } else {
        throw dashboardResult.reason;
      }

      if (applicationsResult.status === "fulfilled") {
        setApplications(applicationsResult.value.items || []);
      } else {
        setApplications([]);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load dashboard data.";

      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  const statistics = dashboardData?.statistics;

  const formatDate = (dateValue?: string | null) => {
    if (!dateValue) return "Date unavailable";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusStyle = (status?: string) => {
    const normalizedStatus = (status || "Pending").toLowerCase();

    if (normalizedStatus === "approved") {
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    }

    if (
      normalizedStatus === "rejected" ||
      normalizedStatus === "declined"
    ) {
      return "text-red-400 bg-red-500/10 border-red-500/30";
    }

    if (
      normalizedStatus === "under review" ||
      normalizedStatus === "review"
    ) {
      return "text-sky-400 bg-sky-500/10 border-sky-500/30";
    }

    return "text-amber-400 bg-amber-500/10 border-amber-500/30";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">

      {/* WELCOME HERO BANNER */}
      <div className="relative overflow-hidden rounded-2xl border border-[#D9AD55]/30 bg-gradient-to-r from-[#002B20] via-[#002219] to-[#001711] p-6 sm:p-8 shadow-xl">

        <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-[#D9AD55]/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">

          <div className="space-y-2">

            <div className="inline-flex items-center gap-2 rounded-full border border-[#D9AD55]/30 bg-[#D9AD55]/10 px-3 py-1 text-xs font-semibold tracking-wider uppercase text-[#D9AD55]">
              <Shield className="h-3.5 w-3.5" />
              <span>Lorvens Executive Console</span>
            </div>

            <h1 className="font-[Georgia,serif] text-2xl sm:text-3xl lg:text-4xl font-normal text-white tracking-tight">
              {dashboardData?.message || "Welcome to Lorvens Admin Portal"}
            </h1>

            <p className="text-xs sm:text-sm text-[#B8C2BB] max-w-2xl leading-relaxed">
              Authenticated as{" "}
              <span className="font-semibold text-[#F5F0E4]">
                {dashboardData?.admin_email || user?.email}
              </span>{" "}
              with elevated{" "}
              <span className="text-[#D9AD55] font-semibold">
                {dashboardData?.role || user?.role || "ADMIN"}
              </span>{" "}
              privileges.
            </p>

          </div>

          <button
            onClick={() => void fetchDashboard(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-2 rounded-xl border border-[#D9AD55]/40 bg-[#001711]/60 px-4 py-2.5 text-xs font-semibold text-[#D9AD55] hover:bg-[#D9AD55]/10 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            <span>
              {refreshing ? "Refreshing..." : "Refresh Status"}
            </span>
          </button>

        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-xs text-red-200">
            {error}
          </div>
        )}

      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

        {/* TOTAL APPLICATIONS */}
        <div className="rounded-2xl border border-[#D9AD55]/20 bg-[#002219]/70 p-5 shadow-sm transition-all hover:border-[#D9AD55]/40">

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[#B8C2BB]">
              Total Applications
            </span>

            <div className="h-9 w-9 rounded-xl bg-[#D9AD55]/10 border border-[#D9AD55]/30 flex items-center justify-center text-[#D9AD55]">
              <FileText className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-4">
            <span className="text-2xl font-bold font-serif text-white">
              {loading ? "..." : statistics?.total_applications ?? 0}
            </span>
          </div>

          <p className="mt-1 text-[11px] text-[#B8C2BB]/70">
            Submitted membership applications
          </p>

        </div>

        {/* PENDING APPROVALS */}
        <div className="rounded-2xl border border-[#D9AD55]/20 bg-[#002219]/70 p-5 shadow-sm transition-all hover:border-[#D9AD55]/40">

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[#B8C2BB]">
              Pending Approvals
            </span>

            <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-4">
            <span className="text-2xl font-bold font-serif text-amber-300">
              {loading ? "..." : statistics?.pending_applications ?? 0}
            </span>
          </div>

          <p className="mt-1 text-[11px] text-[#B8C2BB]/70">
            Applications awaiting review
          </p>

        </div>

        {/* PAID MEMBERSHIPS */}
        <div className="rounded-2xl border border-[#D9AD55]/20 bg-[#002219]/70 p-5 shadow-sm transition-all hover:border-[#D9AD55]/40">

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[#B8C2BB]">
              Paid Memberships
            </span>

            <div className="h-9 w-9 rounded-xl bg-[#D9AD55]/10 border border-[#D9AD55]/30 flex items-center justify-center text-[#D9AD55]">
              <Users className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-4">
            <span className="text-2xl font-bold font-serif text-white">
              {loading ? "..." : statistics?.total_paid_memberships ?? 0}
            </span>
          </div>

          <p className="mt-1 text-[11px] text-[#B8C2BB]/70">
            Successful paid membership payments
          </p>

        </div>

        {/* TOTAL PAYMENTS */}
        <div className="rounded-2xl border border-[#D9AD55]/20 bg-[#002219]/70 p-5 shadow-sm transition-all hover:border-[#D9AD55]/40">

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[#B8C2BB]">
              Total Payments
            </span>

            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-4">
            <span className="text-2xl font-bold font-serif text-white">
              {loading ? "..." : statistics?.total_payments ?? 0}
            </span>
          </div>

          <p className="mt-1 text-[11px] text-[#B8C2BB]/70">
            Payment records in the database
          </p>

        </div>

      </div>

      {/* RECENT APPLICATIONS AND SYSTEM STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* RECENT APPLICATIONS */}
        <div className="lg:col-span-2 rounded-2xl border border-[#D9AD55]/20 bg-[#002219]/70 p-6 shadow-sm">

          <div className="flex items-center justify-between border-b border-[#D9AD55]/15 pb-4">

            <div>
              <h2 className="font-serif text-lg font-normal text-white">
                Recent Membership Applications
              </h2>

              <p className="text-xs text-[#B8C2BB] mt-0.5">
                Latest applications submitted through the portal
              </p>
            </div>

            <span className="text-xs font-medium text-[#D9AD55]">
              Live Pipeline
            </span>

          </div>

          <div className="mt-4 divide-y divide-[#D9AD55]/10">

            {loading ? (
              <div className="py-8 text-center text-sm text-[#B8C2BB]">
                Loading applications...
              </div>
            ) : applications.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#B8C2BB]">
                No submitted applications found.
              </div>
            ) : (
              applications.map((application) => (
                <div
                  key={application.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >

                  <div className="min-w-0">

                    <div className="flex flex-wrap items-center gap-2">

                      <span className="font-medium text-sm text-white">
                        {application.full_name}
                      </span>

                      <span className="text-[10px] text-[#D9AD55] font-mono">
                        {application.id.slice(0, 8).toUpperCase()}
                      </span>

                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 text-xs text-[#B8C2BB] mt-1">
                      <span>{application.email}</span>
                      <span>{application.mobile}</span>
                    </div>

                    <p className="text-[11px] text-[#B8C2BB]/70 mt-1">
                      {formatDate(application.submitted_at)}
                    </p>

                  </div>

                  <div className="shrink-0">
                    <span
                      className={`inline-block px-2.5 py-1 text-[11px] font-medium rounded-full border ${getStatusStyle(
                        application.status
                      )}`}
                    >
                      {application.status || "Pending"}
                    </span>
                  </div>

                </div>
              ))
            )}

          </div>

        </div>

        {/* SECURITY AND ENVIRONMENT */}
        <div className="rounded-2xl border border-[#D9AD55]/20 bg-[#002219]/70 p-6 shadow-sm flex flex-col justify-between">

          <div>

            <div className="flex items-center gap-2 border-b border-[#D9AD55]/15 pb-4">
              <Shield className="h-5 w-5 text-[#D9AD55]" />

              <h2 className="font-serif text-lg font-normal text-white">
                Security & Environment
              </h2>
            </div>

            <div className="mt-5 space-y-4 text-xs">

              <div>
                <span className="text-[#B8C2BB] block mb-1">
                  FastAPI Backend
                </span>

                <div className="flex items-center gap-2 text-white font-mono bg-[#001711] p-2 rounded-lg border border-[#D9AD55]/15">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>http://localhost:8000</span>
                </div>
              </div>

              <div>
                <span className="text-[#B8C2BB] block mb-1">
                  Auth Scheme
                </span>

                <div className="text-white bg-[#001711] p-2 rounded-lg border border-[#D9AD55]/15">
                  OTP Authentication
                </div>
              </div>

              <div>
                <span className="text-[#B8C2BB] block mb-1">
                  Session Token
                </span>

                <div className="text-white bg-[#001711] p-2 rounded-lg border border-[#D9AD55]/15">
                  JWT Bearer Token
                </div>
              </div>

              <div>
                <span className="text-[#B8C2BB] block mb-1">
                  Registered Users
                </span>

                <div className="flex items-center gap-2 text-[#D9AD55] font-medium bg-[#001711] p-2 rounded-lg border border-[#D9AD55]/15">
                  <Users className="h-4 w-4" />

                  {loading
                    ? "Loading..."
                    : statistics?.total_registered_users ?? 0}
                </div>
              </div>

              <div>
                <span className="text-[#B8C2BB] block mb-1">
                  Admin Email
                </span>

                <div className="text-[#D9AD55] font-medium bg-[#001711] p-2 rounded-lg border border-[#D9AD55]/15 truncate">
                  {dashboardData?.admin_email || user?.email || "Checking..."}
                </div>
              </div>

            </div>

          </div>

          <div className="mt-6 pt-4 border-t border-[#D9AD55]/15 flex items-center justify-between text-[11px] text-[#B8C2BB]">
            <span>Lorvens Club Tirupati</span>
            <span className="text-[#D9AD55]">v1.0.0</span>
          </div>

        </div>

      </div>

    </div>
  );
};
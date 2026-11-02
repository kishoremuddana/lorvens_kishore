import React, { useEffect, useState } from "react";
import {
  Clock,
  FileText,
  RefreshCw,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../services/authService";
import type { DashboardResponse } from "../types/auth";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await authService.getDashboardData();
      setDashboardData(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load dashboard data.";
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* WELCOME HERO BANNER */}
      <div className="relative overflow-hidden rounded-2xl border border-[#D9AD55]/30 bg-gradient-to-r from-[#002B20] via-[#002219] to-[#001711] p-6 sm:p-8 shadow-xl">
        {/* Decorative corner glow */}
        <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-[#D9AD55]/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D9AD55]/30 bg-[#D9AD55]/10 px-3 py-1 text-xs font-semibold tracking-wider uppercase text-[#D9AD55]">
              <Shield className="h-3.5 w-3.5" />
              <span>Lorvens Executive Console</span>
            </div>
            <h1 className="font-[Georgia,serif] text-2xl sm:text-3xl lg:text-4xl font-normal text-white tracking-tight">
              {dashboardData?.message || `Welcome to Lorvens Admin Portal`}
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

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => fetchDashboard(true)}
              disabled={refreshing || loading}
              className="flex items-center gap-2 rounded-xl border border-[#D9AD55]/40 bg-[#001711]/60 px-4 py-2.5 text-xs font-semibold text-[#D9AD55] hover:bg-[#D9AD55]/10 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              <span>{refreshing ? "Refreshing..." : "Refresh Status"}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-xs text-red-200">
            {error}
          </div>
        )}
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="rounded-2xl border border-[#D9AD55]/20 bg-[#002219]/70 p-5 shadow-sm transition-all hover:border-[#D9AD55]/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[#B8C2BB]">
              Total Applications
            </span>
            <div className="h-9 w-9 rounded-xl bg-[#D9AD55]/10 border border-[#D9AD55]/30 flex items-center justify-center text-[#D9AD55]">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-serif text-white">48</span>
            <span className="text-[11px] font-medium text-emerald-400">
              +6 this week
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#B8C2BB]/70">
            Submitted via public website modal
          </p>
        </div>

        <div className="rounded-2xl border border-[#D9AD55]/20 bg-[#002219]/70 p-5 shadow-sm transition-all hover:border-[#D9AD55]/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[#B8C2BB]">
              Pending Approvals
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-serif text-amber-300">
              7
            </span>
            <span className="text-[11px] font-medium text-amber-400">
              Requires review
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#B8C2BB]/70">
            Awaiting executive board sign-off
          </p>
        </div>

        <div className="rounded-2xl border border-[#D9AD55]/20 bg-[#002219]/70 p-5 shadow-sm transition-all hover:border-[#D9AD55]/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[#B8C2BB]">
              Active Members
            </span>
            <div className="h-9 w-9 rounded-xl bg-[#D9AD55]/10 border border-[#D9AD55]/30 flex items-center justify-center text-[#D9AD55]">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-serif text-white">184</span>
            <span className="text-[11px] font-medium text-emerald-400">
              Active Tier
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#B8C2BB]/70">
            Verified Lorvens Club patrons
          </p>
        </div>

        <div className="rounded-2xl border border-[#D9AD55]/20 bg-[#002219]/70 p-5 shadow-sm transition-all hover:border-[#D9AD55]/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[#B8C2BB]">
              Security Protocol
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-xl font-bold font-serif text-emerald-300">
              HMAC-SHA256
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#B8C2BB]/70">
            Passwordless OTP authentication active
          </p>
        </div>
      </div>

      {/* TWO COLUMN GRID: RECENT APPLICATIONS & SYSTEM STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RECENT APPLICATIONS */}
        <div className="lg:col-span-2 rounded-2xl border border-[#D9AD55]/20 bg-[#002219]/70 p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#D9AD55]/15 pb-4">
            <div>
              <h2 className="font-serif text-lg font-normal text-white">
                Recent Membership Applications
              </h2>
              <p className="text-xs text-[#B8C2BB] mt-0.5">
                Overview of recent requests submitted through the portal
              </p>
            </div>
            <span className="text-xs font-medium text-[#D9AD55]">
              Live Pipeline
            </span>
          </div>

          <div className="mt-4 divide-y divide-[#D9AD55]/10">
            {[
              {
                id: "APP-1082",
                name: "Dr. K. Raghavendra",
                type: "Executive Patron",
                date: "Today, 11:20 AM",
                status: "Pending Review",
                statusColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
              },
              {
                id: "APP-1081",
                name: "Smt. Ananya Reddy",
                type: "Family Membership",
                date: "Yesterday, 4:45 PM",
                status: "Under Review",
                statusColor: "text-sky-400 bg-sky-500/10 border-sky-500/30",
              },
              {
                id: "APP-1080",
                name: "Sri V. Mohan Rao",
                type: "Corporate Patron",
                date: "30 Oct 2026",
                status: "Approved",
                statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
              },
              {
                id: "APP-1079",
                name: "Sri G. Suresh",
                type: "Individual Life",
                date: "28 Oct 2026",
                status: "Approved",
                statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
              },
            ].map((app) => (
              <div
                key={app.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-white">
                      {app.name}
                    </span>
                    <span className="text-[10px] text-[#D9AD55] font-mono">
                      {app.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#B8C2BB] mt-0.5">
                    <span>{app.type}</span>
                    <span>•</span>
                    <span className="text-[11px] text-[#B8C2BB]/70">
                      {app.date}
                    </span>
                  </div>
                </div>
                <div>
                  <span
                    className={`inline-block px-2.5 py-1 text-[11px] font-medium rounded-full border ${app.statusColor}`}
                  >
                    {app.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SYSTEM STATUS CARD */}
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
                <span className="text-[#B8C2BB] block mb-1">FastAPI Backend</span>
                <div className="flex items-center gap-2 text-white font-mono bg-[#001711] p-2 rounded-lg border border-[#D9AD55]/15">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>http://localhost:8000</span>
                </div>
              </div>

              <div>
                <span className="text-[#B8C2BB] block mb-1">Auth Scheme</span>
                <div className="text-white bg-[#001711] p-2 rounded-lg border border-[#D9AD55]/15">
                  OTP with HMAC-SHA256 verification
                </div>
              </div>

              <div>
                <span className="text-[#B8C2BB] block mb-1">Session Token</span>
                <div className="text-white bg-[#001711] p-2 rounded-lg border border-[#D9AD55]/15">
                  PyJWT Bearer Token (sessionStorage)
                </div>
              </div>

              <div>
                <span className="text-[#B8C2BB] block mb-1">Admin Email</span>
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

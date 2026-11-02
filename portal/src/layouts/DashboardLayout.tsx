import React, { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Award,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  X,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const navItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Applications",
    path: "/dashboard/applications",
    icon: FileText,
    badge: "New",
  },
  {
    name: "Members Directory",
    path: "/dashboard/members",
    icon: Award,
  },
  {
    name: "Audit & Security",
    path: "/dashboard/security",
    icon: ShieldCheck,
  },
];

export const DashboardLayout: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      navigate("/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#001711] text-[#F5F0E4] flex overflow-x-hidden">
      {/* MOBILE OVERLAY */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#002219] border-r border-[#D9AD55]/20 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* SIDEBAR HEADER / BRANDING */}
        <div className="p-6 border-b border-[#D9AD55]/15 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="flex items-center gap-3.5 group cursor-pointer"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="h-10 w-10 rounded-full border border-[#D9AD55] bg-gradient-to-br from-[#002D20] to-[#001711] flex items-center justify-center text-[#D9AD55] font-serif text-lg font-bold shadow-md shadow-[#D9AD55]/10 group-hover:scale-105 transition-transform">
              L
            </div>
            <div>
              <div className="font-serif text-sm font-semibold tracking-[2px] text-white">
                LORVENS CLUB
              </div>
              <div className="text-[10px] uppercase tracking-[1.5px] text-[#D9AD55]">
                Admin Portal
              </div>
            </div>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-[#B8C2BB] hover:text-white p-1 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[2px] text-[#B8C2BB]/60">
            Main Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/dashboard"}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-[#D9AD55]/20 to-[#D9AD55]/5 text-[#F5F0E4] border border-[#D9AD55]/40 shadow-sm shadow-[#D9AD55]/10 font-semibold"
                      : "text-[#B8C2BB] hover:text-white hover:bg-white/5"
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-[#D9AD55]" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] bg-[#D9AD55]/20 text-[#D9AD55] px-2 py-0.5 rounded-full border border-[#D9AD55]/30">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* ADMIN PROFILE CHIP & LOGOUT FOOTER */}
        <div className="p-4 border-t border-[#D9AD55]/15 bg-[#001B14]/60">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#001711]/70 border border-[#D9AD55]/15 mb-3">
            <div className="h-9 w-9 rounded-full bg-[#D9AD55]/15 border border-[#D9AD55]/30 flex items-center justify-center text-[#D9AD55] font-serif font-bold text-sm">
              {user?.email?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-white truncate">
                {user?.email || "Admin User"}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] uppercase tracking-wider text-[#D9AD55]">
                  {user?.role || "ADMIN"}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut || isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 bg-red-950/20 text-xs font-medium text-red-300 hover:bg-red-900/40 hover:text-red-200 transition-all cursor-pointer disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            <span>{isLoggingOut ? "Signing Out..." : "Sign Out"}</span>
          </button>
        </div>
      </aside>

      {/* MAIN WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* TOP BAR */}
        <header className="sticky top-0 z-30 h-16 bg-[#002219]/90 backdrop-blur-md border-b border-[#D9AD55]/15 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-[#B8C2BB] hover:text-white hover:bg-white/5"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:block">
              <span className="text-xs text-[#B8C2BB]">Lorvens Club</span>
              <span className="mx-2 text-[#D9AD55]">/</span>
              <span className="text-xs font-medium text-white">
                Admin Management
              </span>
            </div>
          </div>

          {/* RIGHT BADGES */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#001711]/60 border border-[#D9AD55]/20 text-xs text-[#B8C2BB]">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>System Online</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#F5F0E4]">
              <span className="hidden sm:inline font-serif text-[#D9AD55]">
                Role:
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[#D9AD55]/15 border border-[#D9AD55]/30 text-[#D9AD55] font-semibold text-[11px] tracking-wider uppercase">
                {user?.role || "ADMIN"}
              </span>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

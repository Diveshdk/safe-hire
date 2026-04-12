"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { SafeHireSearch } from "@/components/dashboard/safehire-search"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import {
  LayoutDashboard,
  Briefcase,
  Users,
  ShieldCheck,
  FileText,
  Award,
  GraduationCap,
  Bot,
  User,
  CalendarDays,
  Menu,
  X,
  LogOut,
  ChevronDown,
} from "lucide-react"
import { useState, useRef, useEffect } from "react"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const NAV_MAP: Record<string, NavItem[]> = {
  employee: [
    { label: "Overview", href: "/dashboard/employee", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "Company Verification", href: "/dashboard/employee/verify-company", icon: <ShieldCheck className="h-4 w-4" /> },
    { label: "Jobs", href: "/dashboard/employee/jobs", icon: <Briefcase className="h-4 w-4" /> },
    { label: "Applicants", href: "/dashboard/employee/applicants", icon: <Users className="h-4 w-4" /> },
    { label: "My Profile", href: "/dashboard/profile", icon: <User className="h-4 w-4" /> },
  ],
  employer_admin: [
    { label: "Overview", href: "/dashboard/employee", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "Company Verification", href: "/dashboard/employee/verify-company", icon: <ShieldCheck className="h-4 w-4" /> },
    { label: "Jobs", href: "/dashboard/employee/jobs", icon: <Briefcase className="h-4 w-4" /> },
    { label: "Applicants", href: "/dashboard/employee/applicants", icon: <Users className="h-4 w-4" /> },
    { label: "My Profile", href: "/dashboard/profile", icon: <User className="h-4 w-4" /> },
  ],
  job_seeker: [
    { label: "Overview", href: "/dashboard/job-seeker", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "Find Jobs", href: "/dashboard/job-seeker/jobs", icon: <Briefcase className="h-4 w-4" /> },
    { label: "Check Company", href: "/dashboard/job-seeker/verify-company", icon: <ShieldCheck className="h-4 w-4" /> },
    { label: "Documents", href: "/dashboard/job-seeker/documents", icon: <FileText className="h-4 w-4" /> },
    { label: "Certificates", href: "/dashboard/job-seeker/certificates", icon: <Award className="h-4 w-4" /> },
    { label: "University Results", href: "/dashboard/job-seeker/university", icon: <GraduationCap className="h-4 w-4" /> },
    { label: "AI Resume Review", href: "/dashboard/job-seeker/ai-resume", icon: <Bot className="h-4 w-4" /> },
  ],
  organisation: [
    { label: "Overview", href: "/dashboard/organisation", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "Check Company", href: "/dashboard/organisation/verify-company", icon: <ShieldCheck className="h-4 w-4" /> },
    { label: "Manage Events", href: "/dashboard/organisation/events", icon: <CalendarDays className="h-4 w-4" /> },
    { label: "University Results", href: "/dashboard/organisation/university-results", icon: <GraduationCap className="h-4 w-4" /> },
    { label: "My Profile", href: "/dashboard/profile", icon: <User className="h-4 w-4" /> },
  ],
}

const ROLE_META: Record<string, { label: string; avatarBg: string; avatarText: string }> = {
  employee:       { label: "Employer",      avatarBg: "bg-amber-100",  avatarText: "text-amber-700" },
  employer_admin: { label: "Employer",      avatarBg: "bg-amber-100",  avatarText: "text-amber-700" },
  job_seeker:     { label: "Job Seeker",    avatarBg: "bg-blue-100",   avatarText: "text-blue-700"  },
  organisation:   { label: "Organisation",  avatarBg: "bg-purple-100", avatarText: "text-purple-700"},
}

interface DashboardShellProps {
  children: React.ReactNode
  role: string
  displayName: string
  safeHireId: string | null
  aadhaarVerified: boolean
}

export function DashboardShell({ children, role, displayName, safeHireId, aadhaarVerified }: DashboardShellProps) {
  const pathname = usePathname()
  const navItems = NAV_MAP[role] || NAV_MAP.job_seeker
  const meta = ROLE_META[role] || ROLE_META.job_seeker

  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // Close mobile on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  async function handleSignOut() {
    setSigningOut(true)
    try {
      const supabase = getSupabaseBrowser()
      await supabase.auth.signOut()
    } finally {
      window.location.href = "/"
    }
  }

  return (
    <div className="min-h-dvh bg-[#F4F4F6] flex overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[240px] bg-white border-r border-[#E4E4E7] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-[#E4E4E7] shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-lg bg-[#18181B] flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="text-white text-xs font-bold">SH</span>
            </div>
            <span className="font-bold text-[#18181B] text-sm">Safe Hire</span>
          </Link>
          <button
            className="lg:hidden p-1.5 rounded-lg hover:bg-[#F4F4F6] transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-4 w-4 text-[#71717A]" />
          </button>
        </div>

        {/* Nav label */}
        <div className="px-4 pt-4 pb-1 shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#A1A1AA]">Navigation</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-1 overflow-y-auto">
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-[#18181B] text-white shadow-sm"
                      : "text-[#52525B] hover:bg-[#F4F4F6] hover:text-[#18181B]"
                  )}
                >
                  <span className={cn("shrink-0 transition-colors", isActive ? "text-white" : "text-[#A1A1AA]")}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Sidebar footer — role badge only (no name/sign out) */}
        <div className="border-t border-[#E4E4E7] px-4 py-3 shrink-0">
          <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold", meta.avatarBg, meta.avatarText)}>
            {meta.label}
            {aadhaarVerified && (
              <span className="flex items-center gap-0.5 ml-1 text-emerald-700">
                <ShieldCheck className="h-3 w-3" /> Verified
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#E4E4E7] px-4 sm:px-6 h-14 flex items-center gap-3 shadow-sm shrink-0">
          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 rounded-xl bg-[#F4F4F6] hover:bg-[#E4E4E7] transition-all shrink-0"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-[#18181B]" />
          </button>

          {/* Logo (mobile only) */}
          <Link href="/dashboard" className="lg:hidden flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-[#18181B] flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">SH</span>
            </div>
          </Link>

          <div className="flex-1" />

          {/* Search */}
          <div className="hidden sm:block w-64">
            <SafeHireSearch />
          </div>

          {/* ── Profile Dropdown ── */}
          <div className="relative shrink-0" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(prev => !prev)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border-2 transition-all duration-200",
                profileOpen ? "border-[#18181B] shadow-sm" : "border-transparent hover:border-[#E4E4E7]"
              )}
              aria-label="Profile menu"
            >
              <div className={cn(
                "h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shadow-sm select-none",
                meta.avatarBg, meta.avatarText
              )}>
                {initials}
              </div>
              <ChevronDown className={cn(
                "h-3.5 w-3.5 text-[#71717A] mr-1 transition-transform duration-200",
                profileOpen && "rotate-180"
              )} />
            </button>

            {/* Dropdown */}
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-[#E4E4E7] shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                {/* User info header */}
                <div className="px-4 py-3 border-b border-[#F4F4F6]">
                  <p className="text-sm font-bold text-[#18181B] truncate">{displayName}</p>
                  {safeHireId && (
                    <p className="text-[11px] text-[#A1A1AA] font-mono mt-0.5 truncate">{safeHireId}</p>
                  )}
                </div>

                {/* My Profile */}
                <Link
                  href="/dashboard/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-[#18181B] hover:bg-[#F4F4F6] transition-colors font-medium"
                >
                  <User className="h-4 w-4 text-[#71717A]" />
                  My Profile
                </Link>

                {/* Sign Out */}
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium border-t border-[#F4F4F6] disabled:opacity-60"
                >
                  {signingOut ? (
                    <>
                      <span className="h-4 w-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin shrink-0" />
                      Signing out…
                    </>
                  ) : (
                    <>
                      <LogOut className="h-4 w-4 shrink-0" />
                      Sign Out
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="max-w-5xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  )
}

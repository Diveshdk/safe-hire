"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { SignOutButton } from "@/components/auth/sign-out-button"
import { SafeHireSearch } from "@/components/dashboard/safehire-search"
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
  Building2,
  PlusCircle,
  CalendarDays,
  Menu,
  X,
} from "lucide-react"
import { useState } from "react"

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
    { label: "My Profile", href: "/dashboard/profile", icon: <User className="h-4 w-4" /> },
  ],
  organisation: [
    { label: "Overview", href: "/dashboard/organisation", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "Check Company", href: "/dashboard/organisation/verify-company", icon: <ShieldCheck className="h-4 w-4" /> },
    { label: "Create Event", href: "/dashboard/organisation/events", icon: <PlusCircle className="h-4 w-4" /> },
    { label: "Manage Events", href: "/dashboard/organisation/events", icon: <CalendarDays className="h-4 w-4" /> },
    { label: "University Results", href: "/dashboard/organisation/university-results", icon: <GraduationCap className="h-4 w-4" /> },
    { label: "My Profile", href: "/dashboard/profile", icon: <User className="h-4 w-4" /> },
  ],
}

const ROLE_LABELS: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  employee: { label: "Employer", bg: "bg-amber-100", text: "text-amber-700", icon: <Briefcase className="h-3 w-3" /> },
  employer_admin: { label: "Employer", bg: "bg-amber-100", text: "text-amber-700", icon: <Briefcase className="h-3 w-3" /> },
  job_seeker: { label: "Job Seeker", bg: "bg-blue-100", text: "text-blue-700", icon: <User className="h-3 w-3" /> },
  organisation: { label: "Organisation", bg: "bg-purple-100", text: "text-purple-700", icon: <Building2 className="h-3 w-3" /> },
}

// Pastel initials avatar colors per role
const AVATAR_COLORS: Record<string, string> = {
  employee: "bg-amber-100 text-amber-700",
  employer_admin: "bg-amber-100 text-amber-700",
  job_seeker: "bg-blue-100 text-blue-700",
  organisation: "bg-purple-100 text-purple-700",
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
  const roleMeta = ROLE_LABELS[role] || ROLE_LABELS.job_seeker
  const avatarColor = AVATAR_COLORS[role] || AVATAR_COLORS.job_seeker
  const [mobileOpen, setMobileOpen] = useState(false)

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="min-h-dvh bg-[#F4F4F6] flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-[#E4E4E7] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto shadow-sm",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="px-5 py-5 flex items-center justify-between border-b border-[#E4E4E7]">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#18181B] flex items-center justify-center">
              <span className="text-white text-xs font-bold">SH</span>
            </div>
            <span className="font-bold text-[#18181B]">Safe Hire</span>
          </Link>
          <button className="lg:hidden p-1.5 rounded-lg hover:bg-[#F4F4F6]" onClick={() => setMobileOpen(false)}>
            <X className="h-4 w-4 text-[#71717A]" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-[#F4F4F6]">
          <SafeHireSearch />
        </div>

        {/* Nav section label */}
        <div className="px-4 pt-4 pb-1">
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
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    isActive
                      ? "bg-[#18181B] text-white shadow-sm"
                      : "text-[#52525B] hover:bg-[#F4F4F6] hover:text-[#18181B]"
                  )}
                >
                  <span className={cn(
                    "shrink-0 transition-colors",
                    isActive ? "text-white" : "text-[#A1A1AA]"
                  )}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* User card */}
        <div className="border-t border-[#E4E4E7] px-4 py-4">
          <div className="flex items-center gap-3">
            <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0 font-semibold text-sm", avatarColor)}>
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate text-[#18181B]">{displayName}</p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className={cn(
                  "inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5",
                  roleMeta.bg, roleMeta.text
                )}>
                  {roleMeta.icon} {roleMeta.label}
                </span>
                {aadhaarVerified && (
                  <span className="flex items-center gap-0.5 text-[10px] text-emerald-700 bg-emerald-100 rounded-full px-2 py-0.5 font-semibold">
                    <ShieldCheck className="h-2.5 w-2.5" /> Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {safeHireId && (
            <div className="mt-2.5 bg-[#F4F4F6] rounded-lg px-3 py-2">
              <p className="text-[10px] text-[#A1A1AA] mb-0.5">Safe Hire ID</p>
              <p className="font-mono text-xs font-semibold text-[#18181B]">{safeHireId}</p>
            </div>
          )}

          <div className="mt-3">
            <SignOutButton />
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[#E4E4E7] px-4 sm:px-6 lg:px-10 h-16 flex items-center gap-4 shadow-sm">
          <button
            className="lg:hidden p-2.5 rounded-xl bg-[#F4F4F6] hover:bg-[#E4E4E7] transition-all"
            onClick={() => setMobileOpen(true)}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5 text-[#18181B]" />
          </button>
          <div className="flex-1" />
          <div className="hidden sm:block w-72">
            <SafeHireSearch />
          </div>
          {/* User initials mini */}
          <div className={cn("h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm", avatarColor)}>
            {initials}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 sm:py-10">
          <div className="max-w-6xl mx-auto space-y-8">{children}</div>
        </main>
      </div>
    </div>
  )
}

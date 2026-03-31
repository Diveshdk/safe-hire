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
    { label: "Documents", href: "/dashboard/job-seeker/documents", icon: <FileText className="h-4 w-4" /> },
    { label: "Certificates", href: "/dashboard/job-seeker/certificates", icon: <Award className="h-4 w-4" /> },
    { label: "University Results", href: "/dashboard/job-seeker/university", icon: <GraduationCap className="h-4 w-4" /> },
    { label: "AI Resume Review", href: "/dashboard/job-seeker/ai-resume", icon: <Bot className="h-4 w-4" /> },
    { label: "My Profile", href: "/dashboard/profile", icon: <User className="h-4 w-4" /> },
  ],
  organisation: [
    { label: "Overview", href: "/dashboard/organisation", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "Create Event", href: "/dashboard/organisation/events", icon: <PlusCircle className="h-4 w-4" /> },
    { label: "Manage Events", href: "/dashboard/organisation/events", icon: <CalendarDays className="h-4 w-4" /> },
    { label: "University Results", href: "/dashboard/organisation/university-results", icon: <GraduationCap className="h-4 w-4" /> },
    { label: "My Profile", href: "/dashboard/profile", icon: <User className="h-4 w-4" /> },
  ],
}

const ROLE_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  employee: { label: "Employee", color: "bg-amber-500/10 text-amber-600", icon: <Briefcase className="h-3 w-3" /> },
  employer_admin: { label: "Employer", color: "bg-amber-500/10 text-amber-600", icon: <Briefcase className="h-3 w-3" /> },
  job_seeker: { label: "Job Seeker", color: "bg-blue-500/10 text-blue-600", icon: <User className="h-3 w-3" /> },
  organisation: { label: "Organisation", color: "bg-purple-500/10 text-purple-600", icon: <Building2 className="h-3 w-3" /> },
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
  const [mobileOpen, setMobileOpen] = useState(false)

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="min-h-dvh bg-background flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[260px] bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo area */}
        <div className="px-5 py-5 flex items-center justify-between border-b border-sidebar-border">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">SH</span>
            </div>
            <span className="font-semibold text-sidebar-foreground">Safe Hire</span>
          </Link>
          <button className="lg:hidden p-1" onClick={() => setMobileOpen(false)}>
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <SafeHireSearch />
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
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <span className={cn(isActive ? "text-sidebar-primary" : "text-muted-foreground")}>{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* User card */}
        <div className="border-t border-sidebar-border px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-primary text-xs font-semibold">{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate text-sidebar-foreground">{displayName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-1.5 py-0.5", roleMeta.color)}>
                  {roleMeta.icon} {roleMeta.label}
                </span>
                {aadhaarVerified && (
                  <span className="flex items-center gap-0.5 text-[10px] text-green-600 bg-green-500/10 rounded-full px-1.5 py-0.5">
                    <ShieldCheck className="h-2.5 w-2.5" /> Verified
                  </span>
                )}
              </div>
            </div>
          </div>
          {safeHireId && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              ID: <span className="font-mono font-medium text-sidebar-foreground">{safeHireId}</span>
            </p>
          )}
          <div className="mt-3">
            <SignOutButton />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-4 lg:px-8 h-14 flex items-center gap-4">
          <button className="lg:hidden p-1.5 rounded-lg hover:bg-accent" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <div className="hidden sm:block w-64">
            <SafeHireSearch />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
          <div className="max-w-5xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}

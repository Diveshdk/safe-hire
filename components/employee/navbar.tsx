"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SignOutButton } from "@/components/auth/sign-out-button"
import { VerifiedBadge } from "@/components/shared/verified-badge"
import { 
  LayoutDashboard, 
  Search, 
  FileText, 
  GraduationCap, 
  User, 
  BrainCircuit
} from "lucide-react"

interface EmployeeNavbarProps {
  profile: any
}

export function EmployeeNavbar({ profile }: EmployeeNavbarProps) {
  const pathname = usePathname()

  const navItems = [
    { href: "/employee/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/employee/jobs", label: "Find Jobs", icon: Search },
    { href: "/employee/academic-verification", label: "Credentials", icon: GraduationCap },
    { href: "/employee/profile", label: "Profile", icon: User },
  ]

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-6">
            <Link href="/employee/dashboard" className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
                <span className="text-primary font-semibold">SH</span>
              </div>
              <span className="font-semibold">Safe Hire</span>
              <Badge variant="secondary" className="text-xs">Job Seeker</Badge>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Button
                  key={item.href}
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  asChild
                >
                  <Link href={item.href} className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                </Button>
              )
            })}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">
                  {profile?.aadhaar_full_name || profile?.full_name || "Job Seeker"}
                </p>
                {profile?.aadhaar_verified && <VerifiedBadge />}
              </div>
              <p className="text-xs text-muted-foreground">
                {profile?.safe_hire_id ? (
                  <span>ID: <code className="text-xs">{profile.safe_hire_id.slice(0, 8)}...</code></span>
                ) : (
                  "Setting up profile..."
                )}
              </p>
            </div>
            <SignOutButton />
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden mt-4 flex items-center gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Button
                key={item.href}
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                asChild
                className="flex-shrink-0"
              >
                <Link href={item.href} className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="text-xs">{item.label}</span>
                </Link>
              </Button>
            )
          })}
        </nav>
      </div>
    </header>
  )
}

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SignOutButton } from "@/components/auth/sign-out-button"
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  MessageSquare, 
  Building, 
  Settings 
} from "lucide-react"

interface RecruiterNavbarProps {
  profile: any
}

export function RecruiterNavbar({ profile }: RecruiterNavbarProps) {
  const pathname = usePathname()

  const navItems = [
    { href: "/recruiter/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/recruiter/jobs", label: "Jobs", icon: Briefcase },
    { href: "/recruiter/applications", label: "Applications", icon: Users },
    { href: "/recruiter/feedback", label: "Feedback", icon: MessageSquare },
    { href: "/recruiter/company", label: "Company", icon: Building },
  ]

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-6">
            <Link href="/recruiter/dashboard" className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
                <span className="text-primary font-semibold">SH</span>
              </div>
              <span className="font-semibold">Safe Hire</span>
              <Badge variant="secondary" className="text-xs">Recruiter</Badge>
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
              <p className="text-sm font-medium">
                {profile?.full_name || "Recruiter"}
              </p>
              <p className="text-xs text-muted-foreground">
                {profile?.role === "employer_admin" ? "Company Admin" : "Recruiter"}
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

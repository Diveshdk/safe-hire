"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SignOutButton } from "@/components/auth/sign-out-button"
import { Badge } from "@/components/ui/badge"
import { 
  GraduationCap, 
  Award, 
  FileText, 
  Users, 
  Settings,
  Home,
  Calendar
} from "lucide-react"

interface InstitutionNavbarProps {
  profile: any
}

export function InstitutionNavbar({ profile }: InstitutionNavbarProps) {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/institution/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <span className="font-semibold">Safe Hire</span>
              <Badge variant="outline" className="text-xs">Institution</Badge>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <Link href="/institution/dashboard">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/institution/certificates">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Certificates
                </Button>
              </Link>
              <Link href="/institution/certificates/create">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Issue Certificate
                </Button>
              </Link>
              <Link href="/institution/events">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Events
                </Button>
              </Link>
              <Link href="/institution/verification-requests">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Verifications
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{profile?.institution_name || profile?.email}</p>
              <p className="text-xs text-muted-foreground">Institution Portal</p>
            </div>
            <SignOutButton />
          </div>
        </div>
      </div>
    </nav>
  )
}

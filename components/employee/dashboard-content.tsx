"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { VerifiedBadge } from "@/components/shared/verified-badge"
import { AiResumeReviewer } from "@/components/dashboard/ai-resume-reviewer"
import { NFTCertificates } from "@/components/employee/nft-certificates"
import { Notifications } from "@/components/shared/notifications"
import { 
  Search, 
  FileText, 
  BrainCircuit, 
  Trophy,
  Briefcase,
  Building,
  Clock,
  Eye,
  Plus
} from "lucide-react"

interface EmployeeDashboardContentProps {
  profile: any
}

export function EmployeeDashboardContent({ profile }: EmployeeDashboardContentProps) {
  return (
    <section className="max-w-7xl mx-auto px-6 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, {profile?.aadhaar_full_name || profile?.full_name}!
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-muted-foreground">
                Safe Hire ID: <code className="text-sm bg-muted px-2 py-1 rounded">{profile?.safe_hire_id}</code>
              </p>
              {profile?.aadhaar_verified && <VerifiedBadge />}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="w-5 h-5 text-blue-600" />
              Find Jobs
            </CardTitle>
            <CardDescription className="text-sm">
              Browse verified job openings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/employee/jobs">
                Browse Jobs
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-green-600" />
              Applications
            </CardTitle>
            <CardDescription className="text-sm">
              Track your job applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full">
              <Link href="/employee/applications">
                View Applications
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BrainCircuit className="w-5 h-5 text-purple-600" />
              AI Review
            </CardTitle>
            <CardDescription className="text-sm">
              Get resume feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full">
              <Link href="/employee/resume-review">
                Review Resume
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="w-5 h-5 text-orange-600" />
              Profile
            </CardTitle>
            <CardDescription className="text-sm">
              Manage your credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full">
              <Link href="/employee/profile">
                View Profile
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* AI Resume Reviewer */}
      <div className="mb-8">
        <AiResumeReviewer />
      </div>

      {/* NFT Certificates */}
      <div className="mb-8">
        <NFTCertificates userId={profile?.user_id} />
      </div>

      {/* Dashboard Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Applications */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Recent Applications
              </CardTitle>
              <CardDescription>
                Your latest job applications and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Placeholder for recent applications */}
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No applications yet</p>
                  <p className="text-sm">Start applying to jobs to see them here</p>
                  <Button asChild className="mt-4">
                    <Link href="/employee/jobs">
                      <Search className="w-4 h-4 mr-2" />
                      Find Jobs
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications & Profile Status */}
        <div className="space-y-6">
          <Notifications userId={profile?.user_id} userRole="job_seeker" />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm">Identity Verified</span>
                </div>
                <VerifiedBadge size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Safe Hire ID</span>
                </div>
                <Badge variant="secondary" className="text-xs">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span className="text-sm">Academic Verification</span>
                </div>
                <Badge variant="outline" className="text-xs">Pending</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Applications</span>
                </div>
                <Badge variant="secondary">0</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Profile Views</span>
                </div>
                <Badge variant="secondary">0</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-purple-600" />
                  <span className="text-sm">Companies Viewed</span>
                </div>
                <Badge variant="secondary">0</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="text-sm">In Review</span>
                </div>
                <Badge variant="secondary">0</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recommended Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Complete academic verification</p>
                    <p className="text-xs text-muted-foreground">Boost your profile credibility</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/10">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <span className="text-green-600 text-sm font-medium">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Get AI resume feedback</p>
                    <p className="text-xs text-muted-foreground">Improve your application success</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Notifications } from "@/components/shared/notifications"
import { SafeHireIDLookup } from "@/components/recruiter/safe-hire-id-lookup"
import { 
  Plus, 
  Briefcase, 
  Users, 
  TrendingUp, 
  CheckCircle,
  Clock,
  Eye
} from "lucide-react"

interface RecruiterDashboardContentProps {
  company: any
  jobs: any[]
  applicationCount: number
}

export function RecruiterDashboardContent({ company, jobs, applicationCount }: RecruiterDashboardContentProps) {
  return (
    <section className="max-w-7xl mx-auto px-6 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome back!</h1>
            <p className="text-muted-foreground mt-1">
              Managing recruitment for <span className="font-medium">{company.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
              <CheckCircle className="w-3 h-3 mr-1" />
              Verified Company
            </Badge>
          </div>
        </div>
        
        {/* SUPER PROMINENT APPLICATIONS BUTTON */}
        <div className="mt-4 p-4 bg-gradient-to-r from-orange-100 to-red-100 border-2 border-orange-300 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-orange-800">📋 Review Job Applications</h2>
              <p className="text-orange-700">
                {applicationCount > 0 
                  ? `You have ${applicationCount} applications waiting for review!`
                  : "Check for new job applications"}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <a
                href="/recruiter/applications"
                className="px-6 py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors text-center"
                style={{ textDecoration: 'none' }}
              >
                🔍 VIEW APPLICATIONS
              </a>
              <a
                href="/simple-applications"
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors text-center"
                style={{ textDecoration: 'none' }}
              >
                📝 Simple View
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plus className="w-5 h-5 text-blue-600" />
              Post New Job
            </CardTitle>
            <CardDescription>
              Create a new job opening and start receiving applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/recruiter/jobs/new">
                Create Job Posting
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-orange-600" />
              Review Applications
              {applicationCount > 0 && (
                <Badge className="bg-orange-100 text-orange-800 ml-2">
                  {applicationCount} pending
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {applicationCount > 0 
                ? `You have ${applicationCount} applications to review!`
                : "View and manage candidate applications"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              asChild 
              className={`w-full ${applicationCount > 0 ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
            >
              <Link href="/recruiter/applications">
                {applicationCount > 0 ? `Review ${applicationCount} Applications` : 'View Applications'}
              </Link>
            </Button>
            {/* Fallback direct link */}
            <div className="mt-2 text-center">
              <a 
                href="/recruiter/applications" 
                className="text-sm text-orange-600 hover:underline"
                onClick={(e) => {
                  e.preventDefault()
                  window.location.href = '/recruiter/applications'
                }}
              >
                Direct link →
              </a>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Analytics
            </CardTitle>
            <CardDescription>
              Track your hiring metrics and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full">
              <Link href="/recruiter/analytics">
                View Analytics
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Safe Hire ID Lookup */}
      <div className="mb-8">
        <SafeHireIDLookup />
      </div>

      {/* Dashboard Overview */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Jobs */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Recent Job Postings
              </CardTitle>
              <CardDescription>
                Your latest job openings and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobs.length > 0 ? (
                  jobs.slice(0, 3).map((job: any) => (
                    <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{job.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                          <span>•</span>
                          <Badge 
                            variant={job.status === 'open' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {job.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/recruiter/jobs/${job.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No job postings yet</p>
                    <p className="text-sm">Create your first job posting to get started</p>
                    <Button asChild className="mt-4">
                      <Link href="/recruiter/jobs/new">
                        <Plus className="w-4 h-4 mr-2" />
                        Post Your First Job
                      </Link>
                    </Button>
                  </div>
                )}
                {jobs.length > 3 && (
                  <div className="text-center pt-4 border-t">
                    <Button variant="outline" asChild>
                      <Link href="/recruiter/jobs">
                        View All Jobs ({jobs.length})
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications & Quick Stats */}
        <div className="space-y-6">
          <Notifications userId={company?.owner_user_id} userRole="recruiter" />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Active Jobs</span>
                </div>
                <Badge variant="secondary">{jobs.filter(job => job.status === 'open').length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Applications</span>
                </div>
                <Badge variant="secondary">{applicationCount}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-purple-600" />
                  <span className="text-sm">Profile Views</span>
                </div>
                <Badge variant="secondary">0</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="text-sm">Pending Reviews</span>
                </div>
                <Badge variant="secondary">0</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Create your first job</p>
                    <p className="text-xs text-muted-foreground">Start attracting candidates</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground text-sm font-medium">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Review applications</p>
                    <p className="text-xs text-muted-foreground">When candidates apply</p>
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

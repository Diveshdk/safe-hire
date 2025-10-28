"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { VerifiedBadge } from "@/components/shared/verified-badge"
import { 
  Briefcase,
  Building,
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  ExternalLink
} from "lucide-react"
import Link from "next/link"

interface Application {
  id: string
  status: string
  cover_letter: string
  resume_url?: string
  created_at: string
  jobs: {
    id: string
    title: string
    location?: string
    salary_range?: string
    company_id: string
  }
  companies: {
    id: string
    name: string
    location?: string
    verified: boolean
    verification_status: string
  }
}

interface ApplicationsHistoryProps {
  applications: Application[]
}

export function ApplicationsHistory({ applications }: ApplicationsHistoryProps) {
  const getStatusBadgeProps = (status: string) => {
    switch (status) {
      case "pending":
        return { 
          variant: "secondary" as const, 
          icon: Clock, 
          text: "Under Review",
          bgColor: "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-800"
        }
      case "accepted":
        return { 
          variant: "default" as const, 
          icon: CheckCircle, 
          text: "Accepted",
          bgColor: "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800"
        }
      case "rejected":
        return { 
          variant: "destructive" as const, 
          icon: XCircle, 
          text: "Not Selected",
          bgColor: "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800"
        }
      default:
        return { 
          variant: "secondary" as const, 
          icon: Clock, 
          text: "Unknown",
          bgColor: "bg-gray-50 border-gray-200 dark:bg-gray-900/10 dark:border-gray-800"
        }
    }
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
          <p className="text-muted-foreground mb-6">
            Start applying to jobs to track your applications here
          </p>
          <Button asChild>
            <Link href="/employee/jobs">
              Browse Jobs
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {applications.map((application) => {
        const statusProps = getStatusBadgeProps(application.status)
        const StatusIcon = statusProps.icon

        return (
          <Card key={application.id} className={`hover:shadow-md transition-shadow ${statusProps.bgColor}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-xl">{application.jobs.title}</CardTitle>
                    {application.companies.verification_status === "verified" && (
                      <VerifiedBadge size="sm" />
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      <span className="font-medium">{application.companies.name}</span>
                    </div>
                    {application.jobs.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{application.jobs.location}</span>
                      </div>
                    )}
                    {application.jobs.salary_range && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span>{application.jobs.salary_range}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Applied {new Date(application.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={statusProps.variant} className="flex items-center gap-1">
                    <StatusIcon className="w-3 h-3" />
                    {statusProps.text}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Cover Letter Preview */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    Cover Letter
                  </h4>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {application.cover_letter}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/employee/jobs/${application.jobs.id}`}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Job
                      </Link>
                    </Button>
                    {application.resume_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(application.resume_url, '_blank')}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Resume
                      </Button>
                    )}
                  </div>
                  
                  {application.status === 'accepted' && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-700 dark:text-green-400">
                        🎉 Congratulations!
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        You've been selected for this role
                      </p>
                    </div>
                  )}
                  
                  {application.status === 'rejected' && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Thank you for your interest
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Keep applying to find the right fit
                      </p>
                    </div>
                  )}
                  
                  {application.status === 'pending' && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Application under review
                      </p>
                      <p className="text-xs text-muted-foreground">
                        We'll notify you of any updates
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

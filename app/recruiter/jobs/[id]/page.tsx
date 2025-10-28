import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { RecruiterNavbar } from "@/components/recruiter/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { VerifiedBadge } from "@/components/shared/verified-badge"
import { 
  MapPin, 
  DollarSign, 
  Calendar, 
  Users, 
  Building,
  Mail,
  Phone,
  GraduationCap,
  Briefcase
} from "lucide-react"
import Link from "next/link"

export default async function RecruiterJobDetailsPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/sign-in")
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  if (profile?.role !== "recruiter") {
    redirect("/")
  }

  // Get job details with company info
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select(`
      *,
      companies (
        id,
        name,
        owner_user_id
      )
    `)
    .eq("id", params.id)
    .single()

  if (jobError || !job) {
    return (
      <main className="min-h-dvh bg-background">
        <RecruiterNavbar profile={profile} />
        <section className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Job Not Found</h1>
            <p className="text-muted-foreground mb-4">
              The job you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Link href="/recruiter/jobs">
              <Button>← Back to Jobs</Button>
            </Link>
          </div>
        </section>
      </main>
    )
  }

  // Check if user owns this job
  const company = job.companies as any
  if (company?.owner_user_id !== user.id) {
    return (
      <main className="min-h-dvh bg-background">
        <RecruiterNavbar profile={profile} />
        <section className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-4">
              You don't have permission to view this job.
            </p>
            <Link href="/recruiter/jobs">
              <Button>← Back to Jobs</Button>
            </Link>
          </div>
        </section>
      </main>
    )
  }

  // Get applications for this job
  const { data: applications } = await supabase
    .from("applications")
    .select(`
      *,
      profiles (
        id,
        full_name,
        email,
        phone,
        location,
        skills,
        experience_years,
        education,
        bio,
        aadhaar_verified,
        safe_hire_id
      )
    `)
    .eq("job_id", params.id)
    .order("created_at", { ascending: false })

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return "Salary not specified"
    if (!max) return `$${min?.toLocaleString()}+`
    if (!min) return `Up to $${max?.toLocaleString()}`
    return `$${min?.toLocaleString()} - $${max?.toLocaleString()}`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending Review</Badge>
      case "accepted":
        return <Badge className="bg-green-100 text-green-800">Accepted</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <main className="min-h-dvh bg-background">
      <RecruiterNavbar profile={profile} />
      
      <section className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/recruiter/jobs">
            <Button variant="ghost" className="mb-4">
              ← Back to Jobs
            </Button>
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
              <div className="flex items-center gap-4 text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  <span>{company?.name}</span>
                </div>
                {job.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{job.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>
                  {job.status === 'open' ? 'Active' : job.status}
                </Badge>
                <Badge variant="outline">
                  <Users className="w-3 h-3 mr-1" />
                  {applications?.length || 0} Applications
                </Badge>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Link href={`/recruiter/jobs/${job.id}/edit`}>
                <Button variant="outline">Edit Job</Button>
              </Link>
              <Link href="/recruiter/applications">
                <Button>View All Applications</Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Job Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Description */}
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{job.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            {job.requirements && (
              <Card>
                <CardHeader>
                  <CardTitle>Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap">{job.requirements}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Applications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Applications ({applications?.length || 0})
                </CardTitle>
                <CardDescription>
                  Review and manage candidate applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {applications && applications.length > 0 ? (
                  <div className="space-y-4">
                    {applications.map((application) => {
                      const applicant = application.profiles as any
                      return (
                        <div key={application.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${applicant?.full_name}`} />
                                <AvatarFallback>
                                  {applicant?.full_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold">
                                    {applicant?.full_name || 'Anonymous User'}
                                  </h4>
                                  {applicant?.aadhaar_verified && (
                                    <VerifiedBadge size="sm" />
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  {applicant?.email && (
                                    <div className="flex items-center gap-1">
                                      <Mail className="w-3 h-3" />
                                      <span>{applicant.email}</span>
                                    </div>
                                  )}
                                  {applicant?.experience_years && (
                                    <div className="flex items-center gap-1">
                                      <Briefcase className="w-3 h-3" />
                                      <span>{applicant.experience_years} years exp</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(application.status)}
                            </div>
                          </div>

                          {application.cover_letter && (
                            <div className="mb-3">
                              <p className="text-sm font-medium mb-1">Cover Letter:</p>
                              <p className="text-sm text-muted-foreground">{application.cover_letter}</p>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              Applied {new Date(application.created_at).toLocaleDateString()}
                            </span>
                            
                            {application.status === 'pending' && (
                              <div className="flex gap-2">
                                <a
                                  href={`/api/applications/${application.id}/simple-decision?action=accept`}
                                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                >
                                  Accept
                                </a>
                                <button
                                  onClick={(e) => {
                                    const reason1 = prompt('Enter first reason (e.g., experience):')
                                    const reason2 = prompt('Enter second reason (e.g., skills):')
                                    if (reason1 && reason2) {
                                      window.location.href = `/api/applications/${application.id}/simple-decision?action=reject&reason1=${encodeURIComponent(reason1)}&reason2=${encodeURIComponent(reason2)}`
                                    }
                                  }}
                                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
                    <p className="text-muted-foreground">
                      Applications will appear here when job seekers apply to this position
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Job Info */}
            <Card>
              <CardHeader>
                <CardTitle>Job Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Employment Type</p>
                  <p className="capitalize">{job.employment_type?.replace('_', ' ')}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Salary Range</p>
                  <p>{formatSalary(job.salary_min, job.salary_max)}</p>
                </div>

                {job.location && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Location</p>
                    <p>{job.location}</p>
                  </div>
                )}

                {job.application_deadline && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Application Deadline</p>
                    <p>{new Date(job.application_deadline).toLocaleDateString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Application Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Applications</span>
                  <span className="font-semibold">{applications?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Pending Review</span>
                  <span className="font-semibold">
                    {applications?.filter(app => app.status === 'pending').length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Accepted</span>
                  <span className="font-semibold text-green-600">
                    {applications?.filter(app => app.status === 'accepted').length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Rejected</span>
                  <span className="font-semibold text-red-600">
                    {applications?.filter(app => app.status === 'rejected').length || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  )
}

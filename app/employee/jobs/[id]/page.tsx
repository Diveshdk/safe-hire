import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { EmployeeNavbar } from "@/components/employee/navbar"
import { JobApplication } from "@/components/employee/job-application"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { VerifiedBadge } from "@/components/shared/verified-badge"
import { 
  MapPin, 
  Briefcase, 
  Building, 
  DollarSign, 
  Calendar,
  Users,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"

interface JobDetailsPageProps {
  params: {
    id: string
  }
}

export default async function JobDetailsPage({ params }: JobDetailsPageProps) {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get user profile (optional for testing)
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user?.id)
    .maybeSingle()

  // Allow viewing job details without authentication for testing
  // In production, uncomment these checks:
  // if (!user) redirect("/sign-in")
  // if (profile?.role !== "job_seeker") redirect("/")
  // if (!profile?.aadhaar_verified) redirect("/aadhaar")

  // Get job details
  const { data: job } = await supabase
    .from("jobs")
    .select(`
      *,
      companies (
        id,
        name,
        verification_status
      )
    `)
    .eq("id", params.id)
    .eq("status", "open")
    .maybeSingle()

  // Handle demo jobs if real job not found
  let displayJob = job

  if (!job && params.id.startsWith('demo-')) {
    displayJob = {
      id: params.id,
      title: params.id === 'demo-1' ? "Frontend Developer" : 
             params.id === 'demo-2' ? "Backend Engineer" : "Product Manager",
      description: params.id === 'demo-1' ? "Build amazing user interfaces with React and TypeScript. Join our team to create delightful user experiences that impact thousands of users daily." :
                  params.id === 'demo-2' ? "Develop scalable APIs and services using Node.js. Work with a team of experienced engineers to build the backbone of our platform." :
                  "Lead product strategy and coordinate with engineering teams to deliver exceptional products that delight our customers.",
      requirements: params.id === 'demo-1' ? "• 2+ years of React experience\n• Strong TypeScript skills\n• Experience with modern CSS frameworks\n• Knowledge of state management" :
                    params.id === 'demo-2' ? "• 3+ years of Node.js experience\n• Strong database design skills\n• Experience with RESTful APIs\n• Knowledge of cloud platforms" :
                    "• 3+ years of product management experience\n• Strong analytical skills\n• Experience with agile methodologies\n• Excellent communication skills",
      benefits: params.id === 'demo-1' ? "• Competitive salary\n• Health insurance\n• Flexible work hours\n• Professional development budget" :
                params.id === 'demo-2' ? "• Remote work options\n• Equity package\n• Health benefits\n• Learning stipend" :
                "• Competitive salary\n• Stock options\n• Career growth opportunities\n• Flexible schedule",
      salary_range: params.id === 'demo-1' ? "$80,000 - $120,000" :
                    params.id === 'demo-2' ? "$90,000 - $130,000" : "$100,000 - $150,000",
      location: params.id === 'demo-1' ? "San Francisco, CA" :
                params.id === 'demo-2' ? "Remote" : "New York, NY",
      employment_type: "full-time",
      status: "open",
      created_at: new Date().toISOString(),
      deadline: null,
      companies: {
        id: "demo-company",
        name: "TechCorp Inc",
        verification_status: "verified"
      }
    }
  }

  if (!displayJob) {
    notFound()
  }

  // Check if user already applied (only if authenticated)
  const { data: existingApplication } = user ? await supabase
    .from("applications")
    .select("id, status")
    .eq("job_id", params.id)
    .eq("applicant_id", user.id)
    .maybeSingle() : { data: null }

  // Get application count (only for real jobs)
  const { count: applicationCount } = job ? await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("job_id", params.id) : { count: 0 }

  return (
    <main className="min-h-dvh bg-background">
      {profile ? (
        <EmployeeNavbar profile={profile} />
      ) : (
        <header className="border-b bg-background/95 backdrop-blur">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
                  <span className="text-primary font-semibold">SH</span>
                </div>
                <span className="font-semibold">Safe Hire - Job Details</span>
              </div>
              <Button asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </div>
          </div>
        </header>
      )}
      
      <section className="max-w-4xl mx-auto px-6 py-8">
        {/* Back button */}
        <Button variant="ghost" className="mb-6" asChild>
          <Link href="/employee/jobs">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Job Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-2xl">{displayJob.title}</CardTitle>
                      {displayJob.companies?.verification_status === "verified" && (
                        <VerifiedBadge size="sm" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Building className="w-4 h-4" />
                        <span className="font-medium">{displayJob.companies?.name}</span>
                      </div>
                      {displayJob.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{displayJob.location}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      {displayJob.salary_range && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-medium">{displayJob.salary_range}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        <Badge variant="secondary">
                          {displayJob.employment_type || "Full-time"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap">{displayJob.description}</div>
              </CardContent>
            </Card>

            {displayJob.requirements && (
              <Card>
                <CardHeader>
                  <CardTitle>Requirements</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap">{displayJob.requirements}</div>
                </CardContent>
              </Card>
            )}

            {displayJob.benefits && (
              <Card>
                <CardHeader>
                  <CardTitle>Benefits</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap">{displayJob.benefits}</div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Application Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>Posted {new Date(displayJob.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4" />
                  <span>{applicationCount || 0} applicants</span>
                </div>
                {displayJob.deadline && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>Apply by {new Date(displayJob.deadline).toLocaleDateString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Application Form */}
            {!user ? (
              <Card>
                <CardHeader>
                  <CardTitle>Apply for this Job</CardTitle>
                  <CardDescription>
                    Sign up to apply for this position
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-4">
                      Create an account to apply for this job and track your applications
                    </p>
                    <div className="space-y-2">
                      <Button asChild className="w-full">
                        <Link href={`/sign-up?redirect=/employee/jobs/${params.id}`}>
                          Sign Up to Apply
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full">
                        <Link href={`/sign-in?redirect=/employee/jobs/${params.id}`}>
                          Already have an account? Sign In
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : existingApplication ? (
              <Card>
                <CardHeader>
                  <CardTitle>Application Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <Badge 
                      variant={
                        existingApplication.status === "accepted" ? "default" :
                        existingApplication.status === "rejected" ? "destructive" :
                        "secondary"
                      }
                      className="mb-4"
                    >
                      {existingApplication.status.charAt(0).toUpperCase() + existingApplication.status.slice(1)}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      You have already applied for this job
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <JobApplication jobId={displayJob.id} />
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

import { EmployeeNavbar } from "@/components/employee/navbar"
import { getSupabaseServer } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { VerifiedBadge } from "@/components/shared/verified-badge"
import { 
  MapPin, 
  Briefcase, 
  Building, 
  DollarSign, 
  Search,
  Filter,
  ExternalLink
} from "lucide-react"
import Link from "next/link"

export default async function EmployeeJobsPage() {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user?.id)
    .maybeSingle()

  // Get jobs from verified companies (public for testing)
  const { data: jobs } = await supabase
    .from("jobs")
    .select(`
      *,
      companies (
        name,
        verification_status
      )
    `)
    .eq("status", "open")
    .order("created_at", { ascending: false })

  // Add demo jobs if no real jobs exist (for testing)
  const demoJobs = jobs && jobs.length > 0 ? jobs : [
    {
      id: "demo-1",
      title: "Frontend Developer",
      description: "Build amazing user interfaces with React and TypeScript. Join our team to create delightful user experiences.",
      requirements: "• 2+ years React experience\n• TypeScript proficiency\n• Modern CSS knowledge",
      benefits: "• Competitive salary\n• Health insurance\n• Flexible hours",
      salary_range: "$80,000 - $120,000",
      location: "San Francisco, CA",
      employment_type: "full-time",
      status: "open",
      created_at: new Date().toISOString(),
      companies: {
        name: "TechCorp Inc",
        verification_status: "verified"
      }
    },
    {
      id: "demo-2",
      title: "Backend Engineer",
      description: "Develop scalable APIs and services using Node.js. Work with a team of experienced engineers.",
      requirements: "• 3+ years Node.js experience\n• Database design skills\n• API development",
      benefits: "• Remote work\n• Equity package\n• Learning budget",
      salary_range: "$90,000 - $130,000",
      location: "Remote",
      employment_type: "full-time",
      status: "open",
      created_at: new Date().toISOString(),
      companies: {
        name: "TechCorp Inc",
        verification_status: "verified"
      }
    },
    {
      id: "demo-3",
      title: "Product Manager",
      description: "Lead product strategy and coordinate with engineering teams to deliver exceptional products.",
      requirements: "• 3+ years PM experience\n• Analytical mindset\n• Agile methodology",
      benefits: "• Competitive salary\n• Stock options\n• Career growth",
      salary_range: "$100,000 - $150,000",
      location: "New York, NY",
      employment_type: "full-time",
      status: "open",
      created_at: new Date().toISOString(),
      companies: {
        name: "TechCorp Inc",
        verification_status: "verified"
      }
    }
  ]

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
                <span className="font-semibold">Safe Hire - Jobs</span>
              </div>
              <Button asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </div>
          </div>
        </header>
      )}
      
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Find Jobs</h1>
          <p className="text-muted-foreground mt-1">
            Discover opportunities with verified companies
          </p>
          {!user && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This is a preview mode. <Link href="/sign-up" className="underline">Sign up</Link> to apply for jobs.
              </p>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search jobs, companies, or skills..."
                className="pl-10"
              />
            </div>
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Jobs Grid */}
        <div className="space-y-6">
          {jobs && jobs.length > 0 ? (
            jobs.map((job: any) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl">{job.title}</CardTitle>
                        <VerifiedBadge size="sm" />
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Building className="w-4 h-4" />
                          <span>{job.companies?.name}</span>
                        </div>
                        {job.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{job.location}</span>
                          </div>
                        )}
                        {job.salary_range && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            <span>{job.salary_range}</span>
                          </div>
                        )}
                      </div>
                      <CardDescription className="line-clamp-2">
                        {job.description}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge variant="secondary" className="text-xs">
                        <Briefcase className="w-3 h-3 mr-1" />
                        Full-time
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>0 applicants</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={user ? `/employee/jobs/${job.id}` : `/sign-up`}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Details
                        </Link>
                      </Button>
                      <Button size="sm" asChild>
                        <Link href={user ? `/employee/jobs/${job.id}` : `/sign-up?redirect=/employee/jobs/${job.id}`}>
                          {user ? "Apply Now" : "Sign Up to Apply"}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No jobs available</h3>
                <p className="text-muted-foreground mb-6">
                  Check back later for new opportunities from verified companies
                </p>
                <Button variant="outline">
                  Set up job alerts
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </main>
  )
}

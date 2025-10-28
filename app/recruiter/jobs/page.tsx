import { RecruiterNavbar } from "@/components/recruiter/navbar"
import { getSupabaseServer } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Briefcase, Eye, Users } from "lucide-react"
import Link from "next/link"

export default async function RecruiterJobsPage() {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("user_id", user?.id)
    .maybeSingle()

  // Get company and jobs
  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("owner_user_id", user?.id)
    .maybeSingle()

  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .eq("company_id", company?.id)
    .order("created_at", { ascending: false })

  return (
    <main className="min-h-dvh bg-background">
      <RecruiterNavbar profile={profile} />
      
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Job Postings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your job openings and track applications
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/recruiter/jobs/new">
              <Plus className="w-4 h-4 mr-2" />
              Post New Job
            </Link>
          </Button>
        </div>

        {/* Jobs List */}
        <div className="space-y-6">
          {jobs && jobs.length > 0 ? (
            jobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{job.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {job.description?.substring(0, 150)}...
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>0 views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>0 applications</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/recruiter/jobs/${job.id}/edit`}>
                          Edit
                        </Link>
                      </Button>
                      <Button size="sm" asChild>
                        <Link href={`/recruiter/jobs/${job.id}`}>
                          View Details
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
                <h3 className="text-lg font-semibold mb-2">No job postings yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first job posting to start attracting qualified candidates
                </p>
                <Button asChild size="lg">
                  <Link href="/recruiter/jobs/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Post Your First Job
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </main>
  )
}

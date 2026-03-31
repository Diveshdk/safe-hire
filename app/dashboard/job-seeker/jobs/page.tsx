import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ApplyButton } from "@/components/dashboard/apply-button"
import { MyApplications } from "@/components/dashboard/my-applications"
import { Briefcase } from "lucide-react"

async function getJobs(supabase: any) {
  const { data } = await supabase
    .from("jobs")
    .select("id, title, description, status, location, salary_range, companies(name)")
    .eq("status", "open")
    .limit(20)
  return data || []
}

async function getMyApplications(supabase: any, userId: string) {
  const { data } = await supabase
    .from("applications")
    .select("id, job_id, status, rejection_reasons, ai_rejection_report, jobs(title, companies(name))")
    .eq("seeker_user_id", userId)
  return data || []
}

export default async function JobSeekerJobsPage() {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/sign-in")

  const jobs = await getJobs(supabase)
  const myApplications = await getMyApplications(supabase, user.id)
  const appliedJobIds = new Set(myApplications.map((a: any) => a.job_id))

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-primary" /> Open Positions
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Browse and apply to available job openings.</p>
      </div>

      {/* Jobs Grid */}
      {jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">No open jobs yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {jobs.map((j: any) => {
            const applied = appliedJobIds.has(j.id)
            return (
              <div
                key={j.id}
                className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between gap-3 hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div>
                  <div className="font-semibold">{j.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{j.companies?.name || "Company"}</div>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{j.description}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    {j.location && <span>📍 {j.location}</span>}
                    {j.salary_range && <span>💰 {j.salary_range}</span>}
                  </div>
                </div>
                <ApplyButton jobId={j.id} applied={applied} />
              </div>
            )
          })}
        </div>
      )}

      {/* Your Applications — Client Component with Rejection Analysis */}
      <MyApplications applications={myApplications} />
    </div>
  )
}

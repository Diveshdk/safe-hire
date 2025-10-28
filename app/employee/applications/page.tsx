import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { EmployeeNavbar } from "@/components/employee/navbar"
import { ApplicationsHistory } from "@/components/employee/applications-history"

export default async function EmployeeApplicationsPage() {
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

  if (profile?.role !== "job_seeker") {
    redirect("/")
  }

  if (!profile?.aadhaar_verified) {
    redirect("/aadhaar")
  }

  // Get user's applications
  const { data: applications } = await supabase
    .from("applications")
    .select(`
      *,
      jobs (
        id,
        title,
        location,
        salary_range,
        company_id
      ),
      companies (
        id,
        name,
        location,
        verified,
        verification_status
      )
    `)
    .eq("applicant_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <main className="min-h-dvh bg-background">
      <EmployeeNavbar profile={profile} />
      
      <section className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Applications</h1>
          <p className="text-muted-foreground mt-1">
            Track the status of your job applications
          </p>
        </div>

        <ApplicationsHistory applications={applications || []} />
      </section>
    </main>
  )
}

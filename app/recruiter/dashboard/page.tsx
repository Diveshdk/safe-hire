import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { RecruiterNavbar } from "@/components/recruiter/navbar"
import { CompanyVerificationCheck } from "@/components/recruiter/company-verification-check"
import { RecruiterDashboardContent } from "@/components/recruiter/dashboard-content"

export default async function RecruiterDashboard() {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/sign-in")
  }

  // Get user profile and company information
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("user_id", user.id)
    .maybeSingle()

  // Check if user has a company
  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("owner_user_id", user.id)
    .maybeSingle()

  // If no company exists or company is not verified, show verification flow
  if (!company || company.verification_status !== "verified") {
    return (
      <main className="min-h-dvh bg-background">
        <RecruiterNavbar profile={profile} />
        <CompanyVerificationCheck company={company} />
      </main>
    )
  }

  // Get company's jobs
  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false })

  // Get application count for this company's jobs
  const { count: applicationCount } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .in("job_id", jobs?.map(job => job.id) || [])

  // Show main recruiter dashboard
  return (
    <main className="min-h-dvh bg-background">
      <RecruiterNavbar profile={profile} />
      <RecruiterDashboardContent 
        company={company} 
        jobs={jobs || []}
        applicationCount={applicationCount || 0}
      />
    </main>
  )
}

import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { RecruiterNavbar } from "@/components/recruiter/navbar"
import { ApplicationsManagement } from "@/components/recruiter/applications-management"

export default async function RecruiterApplicationsPage() {
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

  // Get recruiter's company (both verified and pending)
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, verification_status")
    .eq("owner_user_id", user.id)

  if (!companies || companies.length === 0) {
    redirect("/recruiter/company")
  }

  const company = companies[0]
  
  // If company is not verified, show message but don't redirect
  if (company.verification_status !== "verified") {
    return (
      <main className="min-h-dvh bg-background">
        <RecruiterNavbar profile={profile} />
        <section className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Job Applications</h1>
            <p className="text-muted-foreground mt-1">
              Review and manage applications from job seekers
            </p>
          </div>
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">Company verification required</h3>
            <p className="text-muted-foreground mb-4">
              Your company needs to be verified before you can receive job applications.
            </p>
            <a href="/recruiter/company" className="text-primary hover:underline">
              Complete company verification →
            </a>
          </div>
        </section>
      </main>
    )
  }

  const companyId = company.id

  // Get applications for the recruiter's jobs
  const { data: applications } = await supabase
    .from("applications")
    .select(`
      *,
      jobs (
        id,
        title,
        location,
        company_id
      ),
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
    .eq("jobs.company_id", companyId)
    .order("created_at", { ascending: false })

  return (
    <main className="min-h-dvh bg-background">
      <RecruiterNavbar profile={profile} />
      
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Job Applications</h1>
          <p className="text-muted-foreground mt-1">
            Review and manage applications from job seekers
          </p>
        </div>

        <ApplicationsManagement 
          applications={applications || []} 
          companyId={companyId}
        />
      </section>
    </main>
  )
}

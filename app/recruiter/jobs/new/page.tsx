import { RecruiterNavbar } from "@/components/recruiter/navbar"
import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CreateJobForm } from "@/components/recruiter/create-job-form"

export default async function NewJobPage() {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/sign-in")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  if (profile?.role !== "employer_admin") {
    redirect("/")
  }

  // Get user's company
  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("owner_user_id", user.id)
    .maybeSingle()

  if (!company) {
    redirect("/recruiter/dashboard") // Redirect to set up company first
  }

  return (
    <main className="min-h-dvh bg-background">
      <RecruiterNavbar profile={profile} />
      
      <section className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Post New Job</h1>
          <p className="text-muted-foreground mt-1">
            Create a new job posting for {company.name}
          </p>
        </div>

        <CreateJobForm company={company} />
      </section>
    </main>
  )
}

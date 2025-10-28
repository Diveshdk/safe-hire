import { getSupabaseServer } from "@/lib/supabase/server"

export default async function DebugApplicationsPage() {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>Not authenticated</div>
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  // Get user's companies
  const { data: companies, error: companiesError } = await supabase
    .from("companies")
    .select("*")
    .eq("owner_user_id", user.id)

  // Get applications if company exists
  let applications = null
  let applicationsError = null
  if (companies && companies.length > 0) {
    const companyId = companies[0].id
    const result = await supabase
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
    
    applications = result.data
    applicationsError = result.error
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Applications</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">User Info:</h2>
          <pre className="bg-gray-100 p-2 rounded">{JSON.stringify({ user: user.id, email: user.email }, null, 2)}</pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Profile:</h2>
          <pre className="bg-gray-100 p-2 rounded">{JSON.stringify({ profile, profileError }, null, 2)}</pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Companies:</h2>
          <pre className="bg-gray-100 p-2 rounded">{JSON.stringify({ companies, companiesError }, null, 2)}</pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Applications:</h2>
          <pre className="bg-gray-100 p-2 rounded">{JSON.stringify({ applications, applicationsError }, null, 2)}</pre>
        </div>
      </div>
    </div>
  )
}

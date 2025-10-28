import { getSupabaseServer } from "@/lib/supabase/server"

export default async function DebugRecruiterPage() {
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

  // Get jobs
  let jobs = null
  let jobsError = null
  if (companies && companies.length > 0) {
    const result = await supabase
      .from("jobs")
      .select("*")
      .eq("company_id", companies[0].id)
    
    jobs = result.data
    jobsError = result.error
  }

  // Get applications
  let applications = null
  let applicationsError = null
  if (companies && companies.length > 0) {
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
          aadhaar_verified,
          safe_hire_id
        )
      `)
      .eq("company_id", companies[0].id)
      .order("created_at", { ascending: false })
    
    applications = result.data
    applicationsError = result.error
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Debug Recruiter Data</h1>
      
      <div>
        <h2 className="text-lg font-semibold mb-2">User Info:</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          User ID: {user.id}
          Email: {user.email}
        </pre>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Profile:</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify({ profile, profileError }, null, 2)}
        </pre>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Companies:</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify({ companies, companiesError }, null, 2)}
        </pre>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Jobs:</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify({ jobs, jobsError }, null, 2)}
        </pre>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Applications:</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify({ applications, applicationsError }, null, 2)}
        </pre>
      </div>

      <div className="flex gap-4">
        <a 
          href="/recruiter/applications" 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Go to Applications Page
        </a>
        <a 
          href="/recruiter/dashboard" 
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Go to Dashboard
        </a>
        <a 
          href="/recruiter/company" 
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
        >
          Go to Company Page
        </a>
      </div>
    </div>
  )
}

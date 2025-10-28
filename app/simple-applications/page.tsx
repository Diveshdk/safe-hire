import { getSupabaseServer } from "@/lib/supabase/server"
import { ApplicationsManagement } from "@/components/recruiter/applications-management"

export default async function SimpleApplicationsPage() {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
        <p>You need to be signed in as a recruiter to view applications.</p>
        <a href="/sign-in" className="text-blue-600 hover:underline">Sign In →</a>
      </div>
    )
  }

  // Get all applications (simplified approach)
  const { data: applications, error } = await supabase
    .from("applications")
    .select(`
      *,
      jobs (
        id,
        title,
        location,
        company_id,
        companies (
          name,
          owner_user_id
        )
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
    .order("created_at", { ascending: false })

  const userApplications = applications?.filter(app => {
    const job = app.jobs as any
    return job?.companies?.owner_user_id === user.id
  }) || []

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Job Applications</h1>
      
      <div className="mb-4 p-4 bg-blue-50 rounded">
        <p><strong>User ID:</strong> {user.id}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Total Applications Found:</strong> {applications?.length || 0}</p>
        <p><strong>Your Applications:</strong> {userApplications.length}</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 rounded">
          <p><strong>Error:</strong> {error.message}</p>
        </div>
      )}

      {userApplications.length === 0 ? (
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
          <p className="text-gray-600 mb-4">
            Applications will appear here when job seekers apply to your job postings.
          </p>
          <p className="text-sm text-gray-500">
            Make sure you have:
            <br />• Created a verified company
            <br />• Posted at least one job
            <br />• Job seekers have applied to your jobs
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {userApplications.map((application) => (
            <div key={application.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold">
                    {(application.profiles as any)?.full_name || 'Anonymous'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Applied for: {(application.jobs as any)?.title}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a 
                    href={`/api/applications/${application.id}/simple-decision?action=accept`}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    Accept
                  </a>
                  <a 
                    href="#"
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    onClick={(e) => {
                      e.preventDefault()
                      const reason1 = prompt('Enter first reason (e.g., experience):')
                      const reason2 = prompt('Enter second reason (e.g., skills):')
                      if (reason1 && reason2) {
                        window.location.href = `/api/applications/${application.id}/simple-decision?action=reject&reason1=${encodeURIComponent(reason1)}&reason2=${encodeURIComponent(reason2)}`
                      }
                    }}
                  >
                    Reject
                  </a>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                <p><strong>Status:</strong> {application.status}</p>
                <p><strong>Applied:</strong> {new Date(application.created_at).toLocaleDateString()}</p>
                {application.cover_letter && (
                  <p><strong>Cover Letter:</strong> {application.cover_letter}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}


    </div>
  )
}

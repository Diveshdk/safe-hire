import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile to verify recruiter role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || profile?.role !== 'employer_admin') {
      return NextResponse.json({ error: "Access denied - Recruiter role required" }, { status: 403 })
    }

    // Get applications for this recruiter's company jobs
    const { data: applications, error: applicationsError } = await supabase
      .from('applications')
      .select(`
        id,
        job_id,
        applicant_id,
        status,
        cover_letter,
        resume_text,
        applied_at,
        reviewed_at,
        rejection_reason,
        jobs (
          id,
          title,
          location,
          employment_type
        ),
        profiles!applications_applicant_id_fkey (
          user_id,
          aadhaar_full_name,
          full_name,
          safe_hire_id,
          aadhaar_verified
        )
      `)
      .eq('companies.owner_user_id', user.id)
      .order('applied_at', { ascending: false })

    if (applicationsError) {
      console.error('Applications fetch error:', applicationsError)
      return NextResponse.json({ 
        error: "Failed to fetch applications", 
        details: applicationsError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      applications: applications || []
    })

  } catch (error) {
    console.error('Applications API error:', error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

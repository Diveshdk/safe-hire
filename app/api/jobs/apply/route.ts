import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { job_id, cover_letter, resume_text } = await request.json()

    if (!job_id) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
    }

    // Get user profile to verify job seeker role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, aadhaar_verified, safe_hire_id, aadhaar_full_name, full_name')
      .eq('user_id', user.id)
      .single()

    if (profileError || profile?.role !== 'job_seeker') {
      return NextResponse.json({ error: "Access denied - Job seeker role required" }, { status: 403 })
    }

    if (!profile?.aadhaar_verified) {
      return NextResponse.json({ error: "Aadhaar verification required to apply for jobs" }, { status: 403 })
    }

    // Get job and company details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(`
        id, title, company_id, status,
        companies (
          id, name, owner_user_id
        )
      `)
      .eq('id', job_id)
      .eq('status', 'open')
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found or not accepting applications" }, { status: 404 })
    }

    // Check if already applied
    const { data: existingApplication } = await supabase
      .from('applications')
      .select('id')
      .eq('job_id', job_id)
      .eq('applicant_id', user.id)
      .single()

    if (existingApplication) {
      return NextResponse.json({ error: "You have already applied for this job" }, { status: 409 })
    }

    // Create application
    const { data: application, error: applicationError } = await supabase
      .from('applications')
      .insert({
        job_id,
        applicant_id: user.id,
        company_id: job.company_id,
        cover_letter: cover_letter || null,
        resume_text: resume_text || null,
        status: 'pending',
        applied_at: new Date().toISOString()
      })
      .select()
      .single()

    if (applicationError) {
      console.error('Application creation error:', applicationError)
      return NextResponse.json({ 
        error: "Failed to submit application", 
        details: applicationError.message 
      }, { status: 500 })
    }

    // Create notification for the recruiter
    try {
      const company = job.companies as any
      await supabase
        .from('notifications')
        .insert({
          user_id: company?.owner_user_id,
          type: 'application_received',
          title: 'New Job Application',
          message: `${profile.full_name || profile.aadhaar_full_name || 'A job seeker'} has applied for ${job.title}`,
          related_application_id: application.id,
          created_at: new Date().toISOString()
        })
    } catch (notificationError) {
      // Don't fail the application if notification fails
      console.error('Failed to create notification:', notificationError)
    }

    return NextResponse.json({ 
      success: true, 
      application,
      message: `Successfully applied for ${job.title}`
    })

  } catch (error) {
    console.error('Apply API error:', error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const applicationId = params.id
    const { status, rejectionReasons } = await request.json()

    if (!status || !['accepted', 'rejected', 'reviewing'].includes(status)) {
      return NextResponse.json({ error: "Valid status required (accepted, rejected, reviewing)" }, { status: 400 })
    }

    // Get user profile to verify recruiter role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || profile?.role !== 'recruiter') {
      return NextResponse.json({ error: "Access denied - Recruiter role required" }, { status: 403 })
    }

    // Get application and verify ownership
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select(`
        id, applicant_id, job_id, status,
        jobs (
          id, title,
          companies (
            id, owner_user_id
          )
        )
      `)
      .eq('id', applicationId)
      .single()

    if (appError || !application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    // Check if the current user owns the company that posted this job
    const job = application.jobs as any
    if (!job?.companies || job.companies.owner_user_id !== user.id) {
      return NextResponse.json({ error: "Access denied - Not your company's application" }, { status: 403 })
    }

    let ai_rejection_response = null

    // Generate AI rejection response if rejecting
    if (status === 'rejected' && rejectionReasons && rejectionReasons.length > 0) {
      const jobTitle = (application.jobs as any)?.title
      ai_rejection_response = await generateAIRejectionResponse(rejectionReasons, jobTitle)
    }

    // Update application
    const updateData: any = {
      status,
      reviewed_at: new Date().toISOString(),
      reviewer_id: user.id
    }

    if (status === 'rejected') {
      updateData.rejection_reason = rejectionReasons?.join(', ') || null
      updateData.rejection_keywords = rejectionReasons
      updateData.ai_rejection_response = ai_rejection_response
    }

    const { data: updatedApplication, error: updateError } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', applicationId)
      .select()
      .single()

    if (updateError) {
      console.error('Application update error:', updateError)
      return NextResponse.json({ 
        error: "Failed to update application", 
        details: updateError.message 
      }, { status: 500 })
    }

    // Create notification for the job seeker
    try {
      const notificationMessage = status === 'accepted' 
        ? `Your application for ${(application.jobs as any)?.title} has been accepted!`
        : status === 'rejected'
        ? ai_rejection_response || `Your application for ${(application.jobs as any)?.title} was not selected.`
        : `Your application for ${(application.jobs as any)?.title} is under review.`

      await supabase
        .from('notifications')
        .insert({
          user_id: application.applicant_id,
          type: 'application_status',
          title: `Application ${status === 'accepted' ? 'Accepted' : status === 'rejected' ? 'Update' : 'Under Review'}`,
          message: notificationMessage,
          related_application_id: application.id,
          created_at: new Date().toISOString()
        })
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError)
    }

    return NextResponse.json({ 
      success: true, 
      application: updatedApplication,
      message: `Application ${status} successfully`,
      ai_response: ai_rejection_response
    })

  } catch (error) {
    console.error('Application decision API error:', error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function generateAIRejectionResponse(keywords: string[], jobTitle?: string): Promise<string> {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) {
      return generateFallbackRejectionResponse(keywords)
    }

    const keywordsText = keywords.join(', ')
    const prompt = `You are a professional and empathetic HR assistant. A job application for "${jobTitle || 'a position'}" has been rejected based on these key areas: ${keywordsText}.

Write a constructive, encouraging rejection response that:
1. Is professional but empathetic 
2. Briefly mentions the key areas for improvement without being harsh
3. Provides actionable advice for future applications
4. Ends on an encouraging note
5. Keep it concise (2-3 sentences max)

Do not mention specific company names or be overly detailed about the rejection reasons.`

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.6,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 200,
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (aiResponse) {
      return aiResponse.trim()
    } else {
      return generateFallbackRejectionResponse(keywords)
    }

  } catch (error) {
    console.error('AI rejection response error:', error)
    return generateFallbackRejectionResponse(keywords)
  }
}

function generateFallbackRejectionResponse(keywords: string[]): string {
  const keywordResponses: { [key: string]: string } = {
    'experience': 'Consider gaining more relevant experience through projects or internships.',
    'skills': 'Focus on developing the technical skills mentioned in the job requirements.',
    'education': 'Additional certifications or coursework could strengthen your background.',
    'qualifications': 'Review the job requirements and work on building the necessary qualifications.',
    'fit': 'Consider how to better align your background with similar role requirements.',
    'communication': 'Practice presenting your experience more clearly in applications.',
    'requirements': 'Ensure your application fully addresses all stated job requirements.'
  }

  const advice = keywords
    .map(keyword => keywordResponses[keyword.toLowerCase()] || `Work on improving your ${keyword} to strengthen future applications.`)
    .slice(0, 2) // Limit to 2 pieces of advice
    .join(' ')

  return `Thank you for your interest in this position. ${advice} We encourage you to apply for future opportunities that match your evolving skills and experience.`
}

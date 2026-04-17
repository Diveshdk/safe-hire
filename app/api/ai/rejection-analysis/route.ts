import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { Client } from "@gradio/client"

export async function POST(req: Request) {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  const { application_id } = await req.json().catch(() => ({})) as { application_id?: string }
  if (!application_id) {
    return NextResponse.json({ ok: false, message: "Missing application_id" }, { status: 400 })
  }

  // Fetch the application with rejection reasons and job title
  const { data: app, error: appErr } = await supabase
    .from("applications")
    .select(`
      id, status, rejection_reasons, ai_rejection_report, seeker_user_id,
      jobs(title, description)
    `)
    .eq("id", application_id)
    .maybeSingle()

  if (appErr || !app) {
    return NextResponse.json({ ok: false, message: "Application not found" }, { status: 404 })
  }

  // Only the applicant can request their own rejection analysis
  if (app.seeker_user_id !== user.id) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 })
  }

  if (app.status !== "rejected") {
    return NextResponse.json({ ok: false, message: "Application is not rejected" }, { status: 400 })
  }

  if (!app.rejection_reasons || (app.rejection_reasons as string[]).length === 0) {
    return NextResponse.json({ ok: false, message: "No rejection reasons available" }, { status: 400 })
  }

  // Return cached report if available
  if (app.ai_rejection_report) {
    return NextResponse.json({ ok: true, report: app.ai_rejection_report })
  }

  const reasons = app.rejection_reasons as string[]
  const jobTitle = (app as any).jobs?.title || "the position"
  const jobDescription = (app as any).jobs?.description || ""

  try {
    // Initialize Hugging Face Client
    const client = await Client.connect("girishwangikar/ResumeATS")
    
    // Craft a pseudo-resume text containing the rejection feedback
    // This allows us to use the ATS agent to analyze why these specific areas were gaps
    const pseudoResumeText = `REJECTION FEEDBACK FROM EMPLOYER:\n${reasons.map((r, i) => `${i+1}. ${r}`).join('\n')}\n\nPlease analyze these rejection reasons against the job description and provide professional advice to the applicant.`

    // Call the analyze_resume endpoint
    const result = await client.predict("/analyze_resume", { 		
      resume_text: pseudoResumeText, 		
      job_description: `Role: ${jobTitle}\n\nDescription: ${jobDescription}`, 		
      with_job_description: true, 		
      temperature: 0.7, 		
      max_tokens: 1536, 
    }) as any

    let report = String(result.data?.[0] || "")
    
    // Fallback to local report if AI returned nothing or is too short
    if (report.length < 100) {
      report = generateLocalReport(reasons, jobTitle)
    }

    // Save the report
    await supabase
      .from("applications")
      .update({ ai_rejection_report: report })
      .eq("id", application_id)

    return NextResponse.json({ ok: true, report })
  } catch (e: any) {
    console.error("HF Rejection Analysis Error:", e)
    // Fallback to local report on error so the user still gets something
    const fallbackReport = generateLocalReport(reasons, jobTitle)
    return NextResponse.json({ ok: true, report: fallbackReport, isFallback: true })
  }
}

function generateLocalReport(reasons: string[], jobTitle: string): string {
  const sections = reasons.map((reason, i) => {
    const areaMap: Record<string, string> = {
      "experience": "Consider gaining more hands-on experience through internships, freelance projects, or open-source contributions related to this field.",
      "skills": "Invest in upskilling through online courses (Coursera, Udemy, LinkedIn Learning), certifications, or bootcamps. Practice with real-world projects.",
      "communication": "Work on your communication skills through public speaking clubs (Toastmasters), writing practice, or presentation workshops.",
      "technical": "Strengthen your technical foundation by solving problems on platforms like LeetCode, HackerRank, or building portfolio projects.",
      "qualification": "Consider pursuing additional certifications or courses that align with the job requirements.",
      "fit": "Research companies and roles thoroughly before applying. Tailor your application to show alignment with the company's values and culture.",
    }

    let advice = "Focus on addressing this specific feedback by seeking mentorship, taking relevant courses, and gaining practical experience in this area."
    for (const [keyword, suggestion] of Object.entries(areaMap)) {
      if (reason.toLowerCase().includes(keyword)) {
        advice = suggestion
        break
      }
    }

    return `📋 Area ${i + 1}: ${reason}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
What this means: The employer felt this was a gap in your application for the ${jobTitle} role.
How to improve: ${advice}
`
  })

  return `
╔══════════════════════════════════════════╗
    REJECTION ANALYSIS REPORT
    Role: ${jobTitle}
╚══════════════════════════════════════════╝

📊 OVERVIEW
This report analyzes the feedback provided by the employer and identifies key areas where you can improve to strengthen future applications.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${sections.join("\n")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 ACTION PLAN
1. Address each feedback area systematically — start with the most impactful one
2. Update your resume and portfolio to showcase improvements
3. Seek mentorship or peer feedback on your weak areas
4. Practice mock interviews focusing on the identified gaps
5. Apply to similar roles again once you've addressed these areas

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💪 REMEMBER
Every rejection is a stepping stone to your ideal role. The fact that you received specific feedback means you were considered seriously. Use this as fuel to grow stronger. Your SafeHire profile becomes more valuable with every improvement you make!
`.trim()
}

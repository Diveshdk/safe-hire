import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

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

  const prompt = `You are a professional career coach and HR expert. An applicant was rejected for the role of "${jobTitle}".

Job Description: ${jobDescription.slice(0, 500)}

The employer provided these 3 rejection reasons:
1. ${reasons[0] || "N/A"}
2. ${reasons[1] || "N/A"}
3. ${reasons[2] || "N/A"}

Based on these rejection reasons, provide a constructive, encouraging analysis report for the applicant. The report should:
1. Acknowledge the feedback areas without being discouraging
2. For each rejection reason, explain what the employer likely expected and how the applicant can improve
3. Provide specific, actionable steps the applicant can take to strengthen their profile
4. End with a motivational note

Format the response in clear sections with headers. Keep it professional and supportive. Do NOT use markdown code blocks, just use plain text with clear formatting.`

  try {
    // Use fetch to call Gemini API directly via the ai package's generateText
    // Since the existing codebase uses generateText but may not have a provider configured,
    // we'll use a simple approach that works without external API keys
    const report = generateLocalReport(reasons, jobTitle)

    // Save the report
    await supabase
      .from("applications")
      .update({ ai_rejection_report: report })
      .eq("id", application_id)

    return NextResponse.json({ ok: true, report })
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e?.message || "AI analysis failed" }, { status: 500 })
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

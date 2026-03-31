import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  const { resumeText } = await req.json().catch(() => ({}))
  if (!resumeText || String(resumeText).length < 50) {
    return NextResponse.json({ ok: false, message: "Please paste your resume text (50+ chars)" }, { status: 400 })
  }

  try {
    // Generate a comprehensive resume review using local analysis
    const review = analyzeResume(resumeText)
    return NextResponse.json({ ok: true, ...review })
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e?.message || "AI review failed" }, { status: 500 })
  }
}

function analyzeResume(text: string): {
  review: string
  ats_score: number
  strengths: string[]
  skill_gaps: string[]
  suggestions: string[]
  summary: string
} {
  const lowerText = text.toLowerCase()
  const wordCount = text.split(/\s+/).length
  const lines = text.split("\n").filter(l => l.trim())

  // Scoring criteria
  let score = 50 // Base score

  // Check for key sections
  const sections = {
    experience: /experience|work\s*history|employment/i.test(text),
    education: /education|degree|university|college|school/i.test(text),
    skills: /skills|technologies|proficien|competenc/i.test(text),
    contact: /email|phone|@|linkedin/i.test(text),
    summary: /summary|objective|about|profile/i.test(text),
    projects: /projects?|portfolio/i.test(text),
    certifications: /certif|license|credential/i.test(text),
  }

  // Score adjustments
  if (sections.experience) score += 8
  if (sections.education) score += 7
  if (sections.skills) score += 8
  if (sections.contact) score += 5
  if (sections.summary) score += 5
  if (sections.projects) score += 5
  if (sections.certifications) score += 4

  // Length checks
  if (wordCount > 200) score += 3
  if (wordCount > 400) score += 3
  if (wordCount > 800) score -= 2 // Too long

  // Action verbs
  const actionVerbs = ["managed", "developed", "implemented", "designed", "led", "created", "built", "optimized", "achieved", "delivered", "improved", "increased", "reduced", "launched", "coordinated"]
  const verbCount = actionVerbs.filter(v => lowerText.includes(v)).length
  score += Math.min(verbCount * 2, 8)

  // Quantified achievements
  const hasNumbers = /\d+%|\$\d|increased by|reduced by|saved|grew/i.test(text)
  if (hasNumbers) score += 5

  // Technical keywords
  const techKeywords = ["javascript", "python", "react", "node", "sql", "aws", "docker", "git", "api", "database", "machine learning", "typescript", "java", "html", "css", "cloud"]
  const techCount = techKeywords.filter(k => lowerText.includes(k)).length
  score += Math.min(techCount * 1.5, 8)

  score = Math.min(Math.max(Math.round(score), 15), 95)

  // Build strengths
  const strengths: string[] = []
  if (sections.experience) strengths.push("Work experience section is present and well-structured")
  if (sections.education) strengths.push("Educational background is clearly mentioned")
  if (sections.skills) strengths.push("Skills section included — helps with ATS keyword matching")
  if (sections.contact) strengths.push("Contact information is provided for recruiter outreach")
  if (sections.projects) strengths.push("Projects section showcases practical abilities")
  if (verbCount > 3) strengths.push("Good use of action verbs to describe achievements")
  if (hasNumbers) strengths.push("Quantified achievements add credibility and impact")
  if (techCount > 3) strengths.push("Strong technical keyword density for ATS scanning")
  if (strengths.length === 0) strengths.push("Resume text has been provided for review")

  // Build skill gaps
  const skillGaps: string[] = []
  if (!sections.experience) skillGaps.push("Missing work experience section — this is critical for most roles")
  if (!sections.education) skillGaps.push("No education section found — add your academic qualifications")
  if (!sections.skills) skillGaps.push("Skills section not detected — add a dedicated skills/technologies list")
  if (!sections.contact) skillGaps.push("Contact information appears missing — include email and phone")
  if (!sections.summary) skillGaps.push("No professional summary — a 2-3 line overview helps first impressions")
  if (!sections.projects) skillGaps.push("No projects section — add relevant projects to showcase abilities")
  if (!hasNumbers) skillGaps.push("Lack of quantified metrics — add numbers to show impact (e.g., 'increased sales by 25%')")
  if (verbCount < 3) skillGaps.push("Insufficient action verbs — use words like 'developed', 'managed', 'implemented'")
  if (wordCount < 150) skillGaps.push("Resume appears too brief — aim for 300-600 words for a complete picture")

  // Build suggestions
  const suggestions: string[] = []
  suggestions.push("Tailor your resume for each job application — match keywords from the job description")
  if (!sections.summary) suggestions.push("Add a professional summary at the top (2-3 impactful sentences)")
  if (!hasNumbers) suggestions.push("Add measurable achievements: numbers, percentages, and dollar figures")
  if (!sections.certifications) suggestions.push("Consider adding relevant certifications to stand out")
  suggestions.push("Use a clean, single-column format — most ATS systems prefer simple layouts")
  if (wordCount > 800) suggestions.push("Consider trimming to 1-2 pages maximum — be concise and impactful")
  suggestions.push("Proofread for spelling and grammar — errors can be an instant rejection")

  // Summary
  let summaryText = ""
  if (score >= 75) {
    summaryText = `Strong resume with an ATS score of ${score}/100. The resume covers key sections effectively and uses good professional language. Focus on quantifying more achievements and tailoring keywords for specific roles to push it even higher.`
  } else if (score >= 50) {
    summaryText = `Decent resume with room for improvement (ATS score: ${score}/100). Some key sections are present but could be strengthened. Adding missing sections, quantified achievements, and role-specific keywords would significantly boost your chances.`
  } else {
    summaryText = `Resume needs significant improvement (ATS score: ${score}/100). Several critical sections are missing or incomplete. Focus on adding a professional summary, detailed work experience with metrics, and a clear skills section to improve ATS compatibility.`
  }

  // Build formatted review
  const review = `
╔══════════════════════════════════════════╗
    AI RESUME ANALYSIS REPORT
    ATS Compatibility Score: ${score}/100
╚══════════════════════════════════════════╝

📊 OVERVIEW
${summaryText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ STRENGTHS
${strengths.map((s, i) => `${i + 1}. ${s}`).join("\n")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ AREAS TO IMPROVE
${skillGaps.map((s, i) => `${i + 1}. ${s}`).join("\n")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 SUGGESTIONS
${suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 SECTIONS DETECTED
${Object.entries(sections).map(([k, v]) => `• ${k.charAt(0).toUpperCase() + k.slice(1)}: ${v ? "✅ Found" : "❌ Missing"}`).join("\n")}
`.trim()

  return {
    review,
    ats_score: score,
    strengths,
    skill_gaps: skillGaps,
    suggestions,
    summary: summaryText,
  }
}

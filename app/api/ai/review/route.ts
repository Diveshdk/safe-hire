import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { Client } from "@gradio/client"

export async function POST(req: Request) {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  const { resumeText, jobDescription } = await req.json().catch(() => ({}))
  if (!resumeText || String(resumeText).length < 50) {
    return NextResponse.json({ ok: false, message: "Please paste your resume text (50+ chars)" }, { status: 400 })
  }

  try {
    // Initialize Hugging Face Client
    const client = await Client.connect("girishwangikar/ResumeATS")
    
    // Call the analyze_resume endpoint
    const result = await client.predict("/analyze_resume", { 		
      resume_text: resumeText, 		
      job_description: jobDescription || "General Professional Role", 		
      with_job_description: !!jobDescription, 		
      temperature: 0.5, 		
      max_tokens: 1024, 
    }) as any

    const reportText = String(result.data?.[0] || "")
    
    // Parse the response to fit existing frontend expectations
    const analysis = parseHuggingFaceResponse(reportText)
    
    return NextResponse.json({ ok: true, ...analysis })
  } catch (e: any) {
    console.error("HF Inference Error:", e)
    return NextResponse.json({ ok: false, message: e?.message || "AI review failed" }, { status: 500 })
  }
}

/**
 * Parses the string response from Hugging Face into structured sections
 * to maintain compatibility with the existing dashboard UI.
 */
function parseHuggingFaceResponse(text: string) {
  // Try to find a score in the text with various patterns
  const scoreMatch = text.match(/(?:score|rating|compatibility|attainment|match|percentage):\s*(\d+)/i) || 
                     text.match(/(\d+)\s*\/\s*100/) || 
                     text.match(/(\d+)%/)
  
  const score = scoreMatch ? Math.min(Math.max(parseInt(scoreMatch[1]), 0), 100) : 75

  // Determine summary based on score
  let summaryText = ""
  if (score >= 80) summaryText = "Excellent resume alignment. Your profile strongly matches the key requirements and demonstrates high professional impact."
  else if (score >= 60) summaryText = "Good foundation found. There are several positive elements, but strategic optimizations are needed to stand out to ATS filters."
  else summaryText = "Critical gaps detected. Significant restructuring and keyword optimization are required to improve your chances in automated screenings."

  // Extract sections based on a wide range of common headers
  const strengths: string[] = []
  const skillGaps: string[] = []
  const suggestions: string[] = []

  const lines = text.split('\n')
  let currentSection = ""

  lines.forEach(line => {
    const cleanLine = line.trim()
    if (!cleanLine) return

    // Section header detection
    const lower = cleanLine.toLowerCase()
    if (/(?:strength|pros|highlights|positive|good|correct|matches|what went well)/i.test(lower) && cleanLine.length < 35) {
      currentSection = "strengths"
    } else if (/(?:weakness|gaps|missing|improvement|cons|negative|concerns|areas to improve|room for growth)/i.test(lower) && cleanLine.length < 40) {
      currentSection = "gaps"
    } else if (/(?:suggestion|recommendation|advice|tips|next steps|how to fix|actionable)/i.test(lower) && cleanLine.length < 40) {
      currentSection = "suggestions"
    } 
    // Item detection (bullets, numbers, asterisks)
    else if (cleanLine.startsWith('-') || cleanLine.startsWith('*') || /^\d+[.)]/.test(cleanLine) || cleanLine.startsWith('•')) {
      const item = cleanLine.replace(/^[-*•\d.)]+\s*/, '').trim()
      if (item.length > 5) {
        if (currentSection === "strengths") strengths.push(item)
        else if (currentSection === "gaps") skillGaps.push(item)
        else if (currentSection === "suggestions") suggestions.push(item)
      }
    }
  })

  // Final fallbacks if sections are still empty despite the text being long
  if (strengths.length === 0) strengths.push("Check the 'Full Report' section for specific strengths identified.")
  if (skillGaps.length === 0) skillGaps.push("Review the detailed feedback for potential gaps.")
  if (suggestions.length === 0) suggestions.push("Look at the action plan in the detailed report.")

  return {
    review: text,
    ats_score: score,
    strengths: strengths.slice(0, 10),
    skill_gaps: skillGaps.slice(0, 10),
    suggestions: suggestions.slice(0, 10),
    summary: summaryText,
  }
}

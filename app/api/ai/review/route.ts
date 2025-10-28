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

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) {
    // Fallback to mock analysis if no API key is configured
    const mockAnalysis = generateMockAnalysis(resumeText)
    return NextResponse.json({ ok: true, review: mockAnalysis })
  }

  try {
    const prompt = `You are an expert technical recruiter and career advisor. Please analyze the following resume text and provide a comprehensive review in markdown format.

Please structure your response as follows:

## Resume Analysis Results

### 📊 Overall Score: [X]/100

**Rationale:** [1-2 sentences explaining the score]

### ✅ Strengths Identified:
[List 3-5 key strengths with bullet points]

### ⚠️ Areas for Improvement:
[List 3-5 areas that need work with bullet points]

### 🎯 Actionable Recommendations:
[Provide 5-6 specific, actionable recommendations numbered 1-6]

### 💡 Pro Tips:
[3-4 professional tips for resume enhancement]

Resume text to analyze:
${resumeText}

Please provide honest, constructive feedback that will help the job seeker improve their resume and increase their chances of getting hired.`

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
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response from Gemini API')
    }

    const analysis = data.candidates[0].content.parts[0].text
    return NextResponse.json({ ok: true, review: analysis })
    
  } catch (e: any) {
    console.error('AI analysis error:', e)
    // Fallback to mock analysis if API fails
    const mockAnalysis = generateMockAnalysis(resumeText)
    return NextResponse.json({ 
      ok: true, 
      review: mockAnalysis,
      fallback: true,
      error: e.message 
    })
  }
}

function generateMockAnalysis(resumeText: string): string {
  const textLength = resumeText.length
  const words = resumeText.toLowerCase().split(/\s+/)
  
  // Basic analysis based on content
  const hasExperience = words.some(word => ['experience', 'worked', 'developed', 'managed', 'led'].includes(word))
  const hasSkills = words.some(word => ['javascript', 'python', 'react', 'node', 'sql', 'aws', 'docker'].includes(word))
  const hasEducation = words.some(word => ['university', 'college', 'degree', 'bachelor', 'master', 'phd'].includes(word))
  const hasAchievements = words.some(word => ['award', 'achievement', 'recognition', 'certified', 'published'].includes(word))
  
  let score = 60 // Base score
  
  if (hasExperience) score += 15
  if (hasSkills) score += 15
  if (hasEducation) score += 10
  if (hasAchievements) score += 10
  if (textLength > 500) score += 5
  
  score = Math.min(score, 95) // Cap at 95
  
  return `## Resume Analysis Results

### 📊 Overall Score: ${score}/100

**Rationale:** ${score >= 80 ? 'Strong candidate profile with good experience and skills representation.' : 
                score >= 60 ? 'Decent profile but could benefit from improvements.' : 
                'Resume needs significant enhancement to stand out.'}

### ✅ Strengths Identified:
${hasExperience ? '• Professional experience clearly demonstrated\n' : ''}${hasSkills ? '• Technical skills mentioned\n' : ''}${hasEducation ? '• Educational background included\n' : ''}${hasAchievements ? '• Notable achievements highlighted\n' : ''}• Resume length is ${textLength > 300 ? 'appropriate' : 'concise'}

### ⚠️ Areas for Improvement:
${!hasExperience ? '• Add more specific work experience and responsibilities\n' : ''}${!hasSkills ? '• Include relevant technical skills and technologies\n' : ''}${!hasEducation ? '• Add educational qualifications\n' : ''}${!hasAchievements ? '• Highlight achievements and certifications\n' : ''}${textLength < 300 ? '• Expand with more detailed descriptions\n' : ''}• Consider adding quantifiable results and metrics

### 🎯 Actionable Recommendations:
1. **Quantify Impact:** Add numbers, percentages, and metrics to demonstrate results
2. **Keywords:** Include industry-relevant keywords for ATS optimization  
3. **Format:** Ensure clean, professional formatting with clear sections
4. **Relevance:** Tailor content to match specific job requirements
5. **Proofread:** Check for grammar, spelling, and consistency errors

### 💡 Pro Tips:
• Use action verbs like "developed," "implemented," "managed," "improved"
• Include soft skills alongside technical competencies
• Add links to portfolio, GitHub, or LinkedIn profile
• Keep it concise but comprehensive (1-2 pages ideal)

*Note: This is a basic analysis. For detailed feedback, consider professional resume review services.*`
}

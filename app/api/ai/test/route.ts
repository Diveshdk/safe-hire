import { NextResponse } from "next/server"

export async function GET() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  
  if (!apiKey) {
    return NextResponse.json({ 
      status: "error", 
      message: "Google Gemini API key not configured" 
    })
  }

  try {
    // Test basic API connectivity
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
                text: "Say 'Hello from Gemini AI' in exactly 5 words."
              }
            ]
          }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    // Test resume analysis
    const resumeText = "John Doe - Software Engineer with 5 years experience in JavaScript, React, Node.js. Graduated from Stanford University with Computer Science degree. Built multiple web applications and worked at tech startups."
    
    const resumeResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
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
                text: `Analyze this resume and give it a score out of 100: ${resumeText}`
              }
            ]
          }
        ]
      })
    })

    const resumeData = await resumeResponse.json()
    
    return NextResponse.json({ 
      status: "success",
      message: "Google Gemini AI is working!",
      basicTest: data.candidates?.[0]?.content?.parts?.[0]?.text || "No response text",
      resumeTest: resumeData.candidates?.[0]?.content?.parts?.[0]?.text || "No resume analysis",
      model: "gemini-2.0-flash",
      apiKeyConfigured: true
    })
    
  } catch (error: any) {
    return NextResponse.json({ 
      status: "error", 
      message: error.message,
      details: "Failed to connect to Gemini API"
    })
  }
}

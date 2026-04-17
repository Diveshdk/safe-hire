import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { Client } from "@gradio/client"

export async function POST(req: Request) {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json({ ok: false, message: "No file provided" }, { status: 400 })
    }

    // Initialize Hugging Face Client
    const client = await Client.connect("girishwangikar/ResumeATS")
    
    // Convert File to Blob for Gradio client
    const buffer = await file.arrayBuffer()
    const blob = new Blob([buffer], { type: file.type })

    // Call the process_resume endpoint
    const result = await client.predict("/process_resume", { 
      file: blob, 
    }) as any

    const parsedText = String(result.data?.[0] || "")

    return NextResponse.json({ ok: true, text: parsedText })
  } catch (e: any) {
    console.error("Resume Parsing Error:", e)
    return NextResponse.json({ ok: false, message: e?.message || "Failed to parse resume" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, aadhaar_verified")
    .eq("user_id", user.id)
    .maybeSingle()

  if (profile?.role !== "job_seeker") {
    return NextResponse.json({ ok: false, message: "Only job seekers can apply for jobs" }, { status: 403 })
  }
  if (!profile?.aadhaar_verified) {
    return NextResponse.json({ ok: false, message: "Complete Aadhaar verification before applying" }, { status: 403 })
  }

  const { job_id } = await req.json().catch(() => ({})) as { job_id?: string }
  if (!job_id) return NextResponse.json({ ok: false, message: "Missing job_id" }, { status: 400 })

  // Get safe_hire_id
  const { data: fullProfile } = await supabase
    .from("profiles")
    .select("safe_hire_id")
    .eq("user_id", user.id)
    .maybeSingle()

  const { data, error } = await supabase
    .from("applications")
    .insert({
      job_id,
      seeker_user_id: user.id,
      safe_hire_id: fullProfile?.safe_hire_id || null,
      status: "applied",
    })
    .select()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ ok: false, message: "You have already applied for this job" }, { status: 409 })
    }
    console.error("[apply] insert error:", JSON.stringify({ code: error.code, message: error.message, details: error.details, hint: error.hint }))
    return NextResponse.json({ ok: false, message: error.message, code: error.code }, { status: 500 })
  }

  return NextResponse.json({ ok: true, application: data })
}

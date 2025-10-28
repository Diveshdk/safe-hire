import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

function randomCode(len = 6) {
  const n = Math.floor(Math.random() * 10 ** len)
  return String(n).padStart(len, "0")
}

export async function POST() {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("user_id, role, safe_hire_id")
    .eq("user_id", user.id)
    .maybeSingle()
  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 })

  const role = profile?.role || "job_seeker"
  if (profile?.safe_hire_id) return NextResponse.json({ ok: true, safe_hire_id: profile.safe_hire_id })

  const prefix = role === "employer_admin" ? "EX" : role === "institution" ? "IN" : "JS"
  const safeId = `${prefix}${randomCode(6)}`
  const { error: upsertErr } = await supabase.from("profiles").update({ safe_hire_id: safeId }).eq("user_id", user.id)
  if (upsertErr) return NextResponse.json({ ok: false, message: upsertErr.message }, { status: 500 })

  return NextResponse.json({ ok: true, safe_hire_id: safeId })
}

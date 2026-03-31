import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const safeHireId = searchParams.get("id")

  if (!safeHireId) {
    return NextResponse.json({ ok: false, message: "Missing id parameter" }, { status: 400 })
  }

  const supabase = getSupabaseServer()

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("user_id, full_name, aadhaar_full_name, aadhaar_verified, safe_hire_id, role")
    .eq("safe_hire_id", safeHireId.trim())
    .maybeSingle()

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
  }

  if (!profile) {
    return NextResponse.json({ ok: false, message: "Profile not found" }, { status: 404 })
  }

  return NextResponse.json({ ok: true, profile })
}

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { full_name, role } = body as { full_name?: string; role?: string }

  if (!role || !["job_seeker", "employee", "employer_admin", "organisation"].includes(role)) {
    return NextResponse.json({ ok: false, message: "Invalid role" }, { status: 400 })
  }

  const { error } = await supabase
    .from("profiles")
    .upsert({ user_id: user.id, full_name: full_name ?? null, role }, { onConflict: "user_id" })

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

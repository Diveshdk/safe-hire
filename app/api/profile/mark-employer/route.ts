import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function POST() {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  const { error } = await supabase
    .from("profiles")
    .upsert({ user_id: user.id, role: "employer_admin" }, { onConflict: "user_id" })
  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

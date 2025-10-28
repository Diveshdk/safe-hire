import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function GET() {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })
  const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle()
  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
  
  // Return the profile data directly for compatibility with the component
  return NextResponse.json(data || {})
}

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { company_id, title, description } = body
  if (!company_id || !title) return NextResponse.json({ ok: false, message: "Missing fields" }, { status: 400 })

  // Ensure this company belongs to user
  const { data: company } = await supabase
    .from("companies")
    .select("id, owner_user_id")
    .eq("id", company_id)
    .eq("owner_user_id", user.id)
    .maybeSingle()
  if (!company) return NextResponse.json({ ok: false, message: "Not your company" }, { status: 403 })

  const { data: job, error } = await supabase
    .from("jobs")
    .insert({ company_id, title, description, status: "open" })
    .select()
    .single()
  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, job })
}

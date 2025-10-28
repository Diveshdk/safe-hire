import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function GET() {
  const supabase = getSupabaseServer()
  const { data, error } = await supabase
    .from("jobs")
    .select("id, title, description, company_id, status, created_at, companies(name)")
    .eq("status", "open")
    .order("created_at", { ascending: false })
  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, jobs: data })
}

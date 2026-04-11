import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function GET() {
  const supabase = getSupabaseServer()
  const { data, error } = await supabase
    .from("institutes")
    .select("id, name, domain")
    .order("name", { ascending: true })

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, institutes: data || [] })
}

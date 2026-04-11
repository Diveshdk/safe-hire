import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const institute_id = searchParams.get("institute_id")

  if (!institute_id) {
    return NextResponse.json({ ok: false, message: "institute_id is required" }, { status: 400 })
  }

  const supabase = getSupabaseServer()
  const { data, error } = await supabase
    .from("committees")
    .select("id, name, institute_id")
    .eq("institute_id", institute_id)
    .order("name", { ascending: true })

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, committees: data || [] })
}

import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function GET(req: Request) {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  // Allow viewing another user's documents (for profile pages)
  const { searchParams } = new URL(req.url)
  const targetUserId = searchParams.get("user_id") || user.id

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", targetUserId)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, documents: data })
}

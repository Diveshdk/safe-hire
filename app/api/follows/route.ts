import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

// GET ?entity_id=X&entity_type=Y → { following, count }
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const entity_id = searchParams.get("entity_id")
  const entity_type = searchParams.get("entity_type")

  if (!entity_id || !entity_type) {
    return NextResponse.json({ ok: false, message: "entity_id and entity_type required" }, { status: 400 })
  }

  const supabase = getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  // Count followers for this entity (public)
  const { count } = await supabase
    .from("follows")
    .select("id", { count: "exact", head: true })
    .eq("entity_id", entity_id)
    .eq("entity_type", entity_type)

  // Check if current user follows it
  let following = false
  if (user) {
    const { data: row } = await supabase
      .from("follows")
      .select("id")
      .eq("user_id", user.id)
      .eq("entity_id", entity_id)
      .eq("entity_type", entity_type)
      .maybeSingle()
    following = !!row
  }

  return NextResponse.json({ ok: true, following, count: count ?? 0 })
}

// POST { entity_id, entity_type } → toggle follow
export async function POST(req: Request) {
  const supabase = getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  const { entity_id, entity_type } = await req.json().catch(() => ({}))
  if (!entity_id || !entity_type) {
    return NextResponse.json({ ok: false, message: "entity_id and entity_type required" }, { status: 400 })
  }

  // Check existing follow
  const { data: existing } = await supabase
    .from("follows")
    .select("id")
    .eq("user_id", user.id)
    .eq("entity_id", entity_id)
    .eq("entity_type", entity_type)
    .maybeSingle()

  if (existing) {
    // Unfollow
    await supabase.from("follows").delete().eq("id", existing.id)
    return NextResponse.json({ ok: true, following: false })
  }

  // Follow
  await supabase.from("follows").insert({ user_id: user.id, entity_id, entity_type })
  return NextResponse.json({ ok: true, following: true })
}

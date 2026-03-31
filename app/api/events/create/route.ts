import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle()

  if (profile?.role !== "organisation") {
    return NextResponse.json({ ok: false, message: "Only organisations can create events" }, { status: 403 })
  }

  const { title, achievement, custom_fields, event_date, event_type, event_description } = await req.json().catch(() => ({}))
  if (!title?.trim() || !achievement?.trim()) {
    return NextResponse.json({ ok: false, message: "Title and achievement are required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      org_user_id: user.id,
      title: title.trim(),
      achievement: achievement.trim(),
      custom_fields: custom_fields || [],
      event_date: event_date || null,
      event_type: event_type || null,
      description: event_description || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, event: data })
}

export async function GET() {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("org_user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, events: data })
}

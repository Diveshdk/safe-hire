import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const supabase = getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  // Verify role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single()

  if (profile?.role !== "organisation") {
    return NextResponse.json({ ok: false, message: "Only organisations can create social posts" }, { status: 403 })
  }

  const { content, image_url } = await req.json().catch(() => ({}))

  if (!content?.trim()) {
    return NextResponse.json({ ok: false, message: "Post content is required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      org_user_id: user.id,
      content: content.trim(),
      image_url: image_url || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, post: data })
}

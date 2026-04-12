import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  if (!id) return NextResponse.json({ ok: false, message: "Missing post ID" }, { status: 400 })

  const supabase = getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  // Ensure user owns this post
  const { data: post, error: fetchError } = await supabase
    .from("posts")
    .select("org_user_id")
    .eq("id", id)
    .single()

  if (fetchError || !post) {
    return NextResponse.json({ ok: false, message: "Post not found" }, { status: 404 })
  }

  if (post.org_user_id !== user.id) {
    return NextResponse.json({ ok: false, message: "Forbidden: You are not the owner of this post" }, { status: 403 })
  }

  const { error: deleteError } = await supabase
    .from("posts")
    .delete()
    .eq("id", id)

  if (deleteError) {
    return NextResponse.json({ ok: false, message: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

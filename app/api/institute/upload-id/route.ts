import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const supabase = getSupabaseServer()

  const formData = await req.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json({ ok: false, message: "No file uploaded" }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ ok: false, message: "File too large. Max 5MB." }, { status: 400 })
  }

  const ext = file.name.split(".").pop() || "jpg"
  const fileName = `id-cards/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error } = await supabase.storage
    .from("institute-ids")
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 })

  const { data: publicUrlData } = supabase.storage
    .from("institute-ids")
    .getPublicUrl(fileName)

  return NextResponse.json({ ok: true, url: publicUrlData.publicUrl })
}

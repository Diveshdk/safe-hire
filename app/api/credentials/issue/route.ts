// In later phases we will issue a JWT VC and store encrypted payload + hash.
import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  const { type, payload } = await req.json().catch(() => ({}))
  if (!type) return NextResponse.json({ ok: false, message: "Missing credential type" }, { status: 400 })

  // TODO: real issuance -> sign VC JWT, encrypt at rest, compute hash
  const vcJwtEncrypted = "encrypted.jwt.payload" // placeholder
  const vcHash = "hash-placeholder"

  const { data, error } = await supabase
    .from("credentials")
    .insert({
      subject_user_id: user.id,
      type,
      vc_jwt_encrypted: vcJwtEncrypted,
      vc_hash: vcHash,
      expiry: null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, credential: data })
}

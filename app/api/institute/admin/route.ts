import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

// GET — list all pending requests (admin only)
export async function GET() {
  const supabase = getSupabaseServer()

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .maybeSingle()

  if (!profile?.is_admin) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 })
  }

  const { data, error } = await supabase
    .from("institute_verification_requests")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, requests: data || [] })
}

// POST — approve or reject a request
export async function POST(req: Request) {
  const supabase = getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!profile?.is_admin) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 })
  }

  const { request_id, action } = await req.json().catch(() => ({}))
  if (!request_id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ ok: false, message: "Invalid payload" }, { status: 400 })
  }

  const { data: ivr, error: fetchErr } = await supabase
    .from("institute_verification_requests")
    .select("*")
    .eq("id", request_id)
    .maybeSingle()

  if (fetchErr || !ivr) {
    return NextResponse.json({ ok: false, message: "Request not found" }, { status: 404 })
  }

  if (action === "approve") {
    // Insert into institutes table
    const { data: inst, error: instErr } = await supabase
      .from("institutes")
      .insert({ name: ivr.institute_name, domain: ivr.domain })
      .select()
      .single()

    if (instErr) {
      return NextResponse.json({ ok: false, message: instErr.message }, { status: 500 })
    }

    // Update request status
    await supabase
      .from("institute_verification_requests")
      .update({ status: "approved" })
      .eq("id", request_id)

    return NextResponse.json({ ok: true, message: "Institute approved", institute: inst })
  }

  // Reject
  await supabase
    .from("institute_verification_requests")
    .update({ status: "rejected" })
    .eq("id", request_id)

  return NextResponse.json({ ok: true, message: "Request rejected" })
}

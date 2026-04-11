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
    return NextResponse.json({ ok: false, message: "Forbidden: Admin access required" }, { status: 403 })
  }

  const { data, error } = await supabase
    .from("institute_verification_requests")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[Admin API] Fetch requests error:", error)
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
  }
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
    return NextResponse.json({ ok: false, message: "Forbidden: Only admins can perform this action" }, { status: 403 })
  }

  const { request_id, action } = await req.json().catch(() => ({}))
  if (!request_id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ ok: false, message: "Invalid payload: request_id and action (approve/reject) are required." }, { status: 400 })
  }

  // 1. Fetch the request details
  const { data: ivr, error: fetchErr } = await supabase
    .from("institute_verification_requests")
    .select("*")
    .eq("id", request_id)
    .maybeSingle()

  if (fetchErr) {
    console.error("[Admin API] Failed to fetch request:", fetchErr)
    return NextResponse.json({ ok: false, message: `Database error during fetch: ${fetchErr.message}` }, { status: 500 })
  }

  if (!ivr) {
    return NextResponse.json({ ok: false, message: "Request not found" }, { status: 404 })
  }

  if (action === "approve") {
    // 2. Insert into institutes table
    // Ensure all required fields are present
    if (!ivr.institute_name || !ivr.domain) {
      return NextResponse.json({ ok: false, message: "Missing required data in request (Name or Domain)" }, { status: 400 })
    }

    const { data: inst, error: instErr } = await supabase
      .from("institutes")
      .insert({ 
        name: ivr.institute_name, 
        domain: ivr.domain 
      })
      .select()
      .maybeSingle()

    if (instErr) {
      console.error("[Admin API] Failed to insert institute:", instErr)
      return NextResponse.json({ 
        ok: false, 
        message: `Failed to create institute: ${instErr.message}. This might be a permission issue or a duplicate domain.` 
      }, { status: 500 })
    }

    // 3. Update request status
    const { error: updateErr } = await supabase
      .from("institute_verification_requests")
      .update({ status: "approved" })
      .eq("id", request_id)
    
    if (updateErr) {
      console.error("[Admin API] Failed to update request status:", updateErr)
      // We don't return 500 here because the institute was already created
      return NextResponse.json({ ok: true, message: "Institute created, but failed to mark request as approved.", institute: inst })
    }

    return NextResponse.json({ ok: true, message: "Institute approved successfully", institute: inst })
  }

  // Reject logic
  const { error: rejectErr } = await supabase
    .from("institute_verification_requests")
    .update({ status: "rejected" })
    .eq("id", request_id)

  if (rejectErr) {
    console.error("[Admin API] Failed to reject request:", rejectErr)
    return NextResponse.json({ ok: false, message: rejectErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, message: "Request rejected" })
}

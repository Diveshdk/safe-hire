import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

/**
 * POST /api/university/results/approve
 * Principal approval for university results
 */
export async function POST(req: Request) {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  // Verify user is a university principal
  const { data: principal } = await supabase
    .from("university_principals")
    .select("*")
    .eq("user_id", user.id)
    .eq("verification_status", "verified")
    .maybeSingle()

  if (!principal) {
    return NextResponse.json(
      { ok: false, message: "Only verified university principals can approve results" },
      { status: 403 }
    )
  }

  try {
    const body = await req.json()
    const { result_id, action, digital_signature } = body

    if (!result_id || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { ok: false, message: "Invalid request parameters" },
        { status: 400 }
      )
    }

    // Get the result
    const { data: result, error: resultError } = await supabase
      .from("university_results")
      .select("*")
      .eq("id", result_id)
      .maybeSingle()

    if (resultError || !result) {
      return NextResponse.json({ ok: false, message: "Result not found" }, { status: 404 })
    }

    // Verify principal belongs to the same university
    if (result.university_name !== principal.university_name) {
      return NextResponse.json(
        { ok: false, message: "You can only approve results from your university" },
        { status: 403 }
      )
    }

    // Check daily approval limit
    const { data: canApprove } = await supabase.rpc("can_principal_approve_result", {
      p_principal_user_id: user.id,
    })

    if (!canApprove) {
      return NextResponse.json(
        { ok: false, message: "Daily approval limit reached or signature expired" },
        { status: 429 }
      )
    }

    const updateData: any = {
      principal_name: principal.full_name,
      principal_designation: principal.designation,
      principal_signature_timestamp: new Date().toISOString(),
      verified_by_user_id: user.id,
      verified_at: new Date().toISOString(),
    }

    if (action === "approve") {
      updateData.principal_verification_status = "approved"
      updateData.principal_signature_hash = principal.digital_signature_hash
      updateData.is_active = true
      updateData.activated_at = new Date().toISOString()
    } else {
      updateData.principal_verification_status = "rejected"
      updateData.is_active = false
    }

    // Update the result
    const { data: updatedResult, error: updateError } = await supabase
      .from("university_results")
      .update(updateData)
      .eq("id", result_id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ ok: false, message: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      message: `Result ${action === "approve" ? "approved" : "rejected"} successfully`,
      result: updatedResult,
    })
  } catch (error: any) {
    console.error("[university/results/approve] Error:", error)
    return NextResponse.json(
      { ok: false, message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

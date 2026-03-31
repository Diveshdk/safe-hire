import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

/**
 * GET /api/certificates/list
 * Get certificates for the authenticated user
 */
export async function GET(req: Request) {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("user_id") || user.id
    const certificateType = searchParams.get("type") // 'winner' or 'participant'

    let query = supabase
      .from("certificates")
      .select(
        `
        *,
        events:event_id (
          id,
          title,
          achievement,
          event_date,
          event_type
        )
      `
      )
      .eq("recipient_user_id", userId)
      .eq("verification_status", "verified")
      .order("issued_at", { ascending: false })

    if (certificateType && ["winner", "participant"].includes(certificateType)) {
      query = query.eq("certificate_type", certificateType)
    }

    const { data: certificates, error } = await query

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      certificates: certificates || [],
      total: certificates?.length || 0,
    })
  } catch (error: any) {
    console.error("[certificates/list] Error:", error)
    return NextResponse.json({ ok: false, message: error.message || "Internal server error" }, { status: 500 })
  }
}

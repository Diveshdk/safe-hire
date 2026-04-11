import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { sendReportEmail } from "@/lib/email"

const DAILY_REPORT_LIMIT = 3

export async function POST(req: Request) {
  const supabase = getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  const { entity_id, entity_type, reason, description } = await req.json().catch(() => ({}))

  if (!entity_id || !entity_type || !reason?.trim()) {
    return NextResponse.json({ ok: false, message: "entity_id, entity_type, and reason are required" }, { status: 400 })
  }

  // Daily rate-limit check
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { count: todayCount } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("reporter_id", user.id)
    .gte("created_at", todayStart.toISOString())

  if ((todayCount ?? 0) >= DAILY_REPORT_LIMIT) {
    return NextResponse.json({
      ok: false,
      message: `You can only submit ${DAILY_REPORT_LIMIT} reports per day. Try again tomorrow.`,
    }, { status: 429 })
  }

  // Get profile for safe_hire_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("safe_hire_id")
    .eq("user_id", user.id)
    .maybeSingle()

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    reporter_email: user.email!,
    entity_id,
    entity_type,
    reason,
    description: description?.trim() || null,
  })

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 })

  // Send alert email (non-blocking)
  sendReportEmail({
    reporterEmail: user.email!,
    reporterSafeHireId: profile?.safe_hire_id || "Unknown",
    entityId: entity_id,
    entityType: entity_type,
    reason,
    description: description || "",
  }).catch(console.error)

  return NextResponse.json({ ok: true, message: "Report submitted. Thank you for helping keep SafeHire safe." })
}

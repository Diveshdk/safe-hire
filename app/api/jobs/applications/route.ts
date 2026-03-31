import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function GET(req: Request) {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  // Check for job_id filter
  const { searchParams } = new URL(req.url)
  const jobIdFilter = searchParams.get("job_id")

  // Build query
  let query = supabase
    .from("applications")
    .select(`
      id, status, safe_hire_id, created_at, seeker_user_id, rejection_reasons, ai_rejection_report,
      jobs!inner(id, title, company_id, companies!inner(name, owner_user_id))
    `)
    .filter("jobs.companies.owner_user_id", "eq", user.id)
    .order("created_at", { ascending: false })

  if (jobIdFilter) {
    query = query.eq("job_id", jobIdFilter)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 })

  // Enrich with applicant profile
  const enriched = await Promise.all(
    (data || []).map(async (app: any) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, aadhaar_full_name, aadhaar_verified, safe_hire_id, role")
        .eq("user_id", app.seeker_user_id)
        .maybeSingle()

      const { data: docs } = await supabase
        .from("documents")
        .select("id, doc_type, title, verification_status, file_url, created_at")
        .eq("user_id", app.seeker_user_id)

      return {
        ...app,
        applicant: profile,
        documents: docs || [],
      }
    })
  )

  return NextResponse.json({ ok: true, applications: enriched })
}

export async function PATCH(req: Request) {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  const { application_id, status, rejection_reasons } = await req.json().catch(() => ({})) as {
    application_id?: string
    status?: string
    rejection_reasons?: string[]
  }

  if (!application_id || !["applied", "verified", "not_authentic", "hired", "rejected"].includes(status || "")) {
    return NextResponse.json({ ok: false, message: "Invalid application_id or status" }, { status: 400 })
  }

  // If rejecting, require 3 reasons
  if (status === "rejected") {
    if (!rejection_reasons || !Array.isArray(rejection_reasons) || rejection_reasons.filter(r => r.trim()).length < 3) {
      return NextResponse.json({ ok: false, message: "Please provide 3 rejection reasons" }, { status: 400 })
    }
  }

  // Build update payload
  const updatePayload: any = { status }
  if (status === "rejected" && rejection_reasons) {
    updatePayload.rejection_reasons = rejection_reasons.map(r => r.trim())
    updatePayload.reviewed_by = user.id
    updatePayload.reviewed_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from("applications")
    .update(updatePayload)
    .eq("id", application_id)

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

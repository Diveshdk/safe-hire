import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  const { job_id, company_id, title, description, location, salary_range, job_type, status } = await req.json().catch(() => ({}))

  if (!job_id) {
    return NextResponse.json({ ok: false, message: "Missing job_id" }, { status: 400 })
  }

  // Verify the job belongs to a company owned by this user
  const { data: job } = await supabase
    .from("jobs")
    .select("id, company_id, companies!inner(owner_user_id)")
    .eq("id", job_id)
    .single()

  if (!job || (job.companies as any).owner_user_id !== user.id) {
    return NextResponse.json({ ok: false, message: "You can only edit your own jobs" }, { status: 403 })
  }

  // Update the job
  const updateData: any = {}
  if (company_id) updateData.company_id = company_id
  if (title) updateData.title = title
  if (description !== undefined) updateData.description = description
  if (location !== undefined) updateData.location = location
  if (salary_range !== undefined) updateData.salary_range = salary_range
  if (job_type) updateData.job_type = job_type
  if (status) updateData.status = status
  updateData.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from("jobs")
    .update(updateData)
    .eq("id", job_id)
    .select()

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, job: data })
}

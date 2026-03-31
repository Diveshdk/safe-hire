import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  const { job_id } = await req.json().catch(() => ({}))

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
    return NextResponse.json({ ok: false, message: "You can only delete your own jobs" }, { status: 403 })
  }

  // Delete the job (this will also cascade delete applications due to ON DELETE CASCADE)
  const { error } = await supabase
    .from("jobs")
    .delete()
    .eq("id", job_id)

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, message: "Job deleted successfully" })
}

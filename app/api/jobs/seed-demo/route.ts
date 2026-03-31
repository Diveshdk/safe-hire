import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

const DEMO_JOBS = (company_id: string) => [
  { company_id, title: "Frontend Engineer", description: "React + TypeScript, build delightful UIs.", status: "open" },
  { company_id, title: "Backend Engineer", description: "Node + Postgres, APIs and services.", status: "open" },
  { company_id, title: "Data Analyst", description: "SQL + dashboards, insights for growth.", status: "open" },
]

export async function POST() {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  // use first company owned by user, otherwise create a demo one
  let { data: company } = await supabase.from("companies").select("id, name").eq("owner_user_id", user.id).maybeSingle()
  if (!company) {
    const { data: created, error: cErr } = await supabase
      .from("companies")
      .insert({
        owner_user_id: user.id,
        name: "Demo Co",
        registration_number: "DEMO000000",
        verification_status: "verified",
        verifier_source: "demo",
        verified_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (cErr) return NextResponse.json({ ok: false, message: cErr.message }, { status: 500 })
    company = created
  }

  const { error } = await supabase.from("jobs").insert(DEMO_JOBS(company!.id))
  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

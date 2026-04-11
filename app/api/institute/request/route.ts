import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const supabase = getSupabaseServer()

  const body = await req.json().catch(() => ({}))
  const { institute_name, email, id_card_url } = body

  if (!institute_name?.trim() || !email?.trim()) {
    return NextResponse.json({ ok: false, message: "Institute name and email are required" }, { status: 400 })
  }

  // Extract domain from email
  const domain = email.trim().split("@")[1]?.toLowerCase()
  if (!domain) {
    return NextResponse.json({ ok: false, message: "Invalid email address" }, { status: 400 })
  }

  // Guard duplicate: same domain already pending or approved
  const { data: existing } = await supabase
    .from("institute_verification_requests")
    .select("id, status")
    .eq("domain", domain)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({
      ok: false,
      message: `A request for domain @${domain} is already ${existing.status}. Please wait for admin review.`,
    }, { status: 409 })
  }

  // Also check if domain is already an approved institute
  const { data: approvedInst } = await supabase
    .from("institutes")
    .select("id, name")
    .eq("domain", domain)
    .maybeSingle()

  if (approvedInst) {
    return NextResponse.json({
      ok: false,
      message: `@${domain} is already registered as "${approvedInst.name}". Please select it from the dropdown.`,
    }, { status: 409 })
  }

  const { error } = await supabase.from("institute_verification_requests").insert({
    institute_name: institute_name.trim(),
    email: email.trim().toLowerCase(),
    domain,
    id_card_url: id_card_url || null,
  })

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 })

  return NextResponse.json({
    ok: true,
    message: "Verification request submitted. An admin will review it shortly.",
  })
}

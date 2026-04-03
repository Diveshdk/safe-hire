import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { verifyCIN, isNameMatch, isDomainMatch } from "@/lib/verification/cin"

async function saveCompany(
  supabase: ReturnType<typeof getSupabaseServer>,
  userId: string,
  name: string,
  registrationNumber: string,
  status: "verified" | "demo" | "pending",
  source: string,
  verificationMethod?: string,
) {
  await supabase.from("companies").delete().eq("owner_user_id", userId)

  return supabase
    .from("companies")
    .insert({
      owner_user_id: userId,
      name,
      registration_number: registrationNumber || "DEMO",
      verification_status: status,
      verifier_source: source,
      verification_method: verificationMethod,
      verified_at: new Date().toISOString(),
    })
    .select()
    .single()
}

// ── GET: Lookup-only — no DB write, no auth needed ──────────────────────────
// Used by the sign-up form to auto-fetch the official company name from a CIN
// without creating any record.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const cin = searchParams.get("cin")
  if (!cin || cin.trim().length < 5) {
    return NextResponse.json({ ok: false, message: "A valid CIN is required." }, { status: 400 })
  }
  try {
    const res = await verifyCIN(cin.trim().toUpperCase())
    if (!res.success) {
      return NextResponse.json(
        { ok: false, message: res.message || "No company found for this CIN." },
        { status: 404 }
      )
    }
    return NextResponse.json({
      ok: true,
      name: res.name,
      status: res.status,
      source: res.source,
    })
  } catch (e) {
    return NextResponse.json({ ok: false, message: (e as Error).message }, { status: 500 })
  }
}

// ── POST: Full verification + save ──────────────────────────────────────────
export async function POST(req: Request) {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { registrationNumber, name, demo } = body ?? {}

  if (!name || name.trim().length < 2) {
    return NextResponse.json({ ok: false, message: "Please provide a valid company name." }, { status: 400 })
  }

  // Fetch user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle()

  const isOrg = profile?.role === "organisation"

  // Organizations skip CIN verification
  if (isOrg) {
    const { data: inserted, error } = await saveCompany(
      supabase, user.id, name, "INSTITUTE", "verified", "manual", "representative_identity"
    )
    if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, company: inserted, verifiedName: name, method: "representative_identity" })
  }

  if (!registrationNumber && !demo) {
    return NextResponse.json({ ok: false, message: "CIN or PAN is required for verification." }, { status: 400 })
  }

  try {
    const res = await verifyCIN(registrationNumber || "DEMO")

    if (demo || (!res.success && !process.env.GRIDLINES_API_KEY)) {
      const { data, error } = await saveCompany(
        supabase, user.id, name, registrationNumber || "DEMO", "demo", "demo"
      )
      if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, company: data, demo: true })
    }

    if (!res.success) {
      return NextResponse.json({ ok: false, message: res.message || "CIN verification failed." }, { status: 400 })
    }

    const officialName = res.name || ""
    if (!isNameMatch(name, officialName)) {
      return NextResponse.json(
        {
          ok: false,
          message: `Name mismatch. Official name for this CIN is "${officialName}". Please use the correct registered name.`,
        },
        { status: 400 }
      )
    }

    const canAutoVerify = isDomainMatch(user.email || "", officialName)

    if (canAutoVerify) {
      const { data: inserted, error } = await saveCompany(
        supabase, user.id, officialName, registrationNumber, "verified", res.source, "work_email"
      )
      if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, company: inserted, verifiedName: officialName, method: "work_email" })
    }

    const { data: pending, error: pendingError } = await saveCompany(
      supabase, user.id, officialName, registrationNumber, "pending", res.source
    )
    if (pendingError) return NextResponse.json({ ok: false, message: pendingError.message }, { status: 500 })

    return NextResponse.json({
      ok: true,
      company: pending,
      verifiedName: officialName,
      requiresProof: true,
      message: "Authorization required. Please upload a document proof.",
    })
  } catch (e) {
    return NextResponse.json({ ok: false, message: (e as Error).message }, { status: 500 })
  }
}

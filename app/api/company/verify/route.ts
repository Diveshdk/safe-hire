import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { verifyCIN, isNameMatch } from "@/lib/verification/cin"

async function saveCompany(
  supabase: ReturnType<typeof getSupabaseServer>,
  userId: string,
  name: string,
  registrationNumber: string,
  status: "verified" | "demo" | "pending",
  source: string,
) {
  // Remove existing company record for this user
  await supabase.from("companies").delete().eq("owner_user_id", userId)

  return supabase
    .from("companies")
    .insert({
      owner_user_id: userId,
      name,
      registration_number: registrationNumber || "DEMO",
      verification_status: status,
      verifier_source: source,
      verified_at: new Date().toISOString(),
    })
    .select()
    .single()
}

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

  // 1. Mandatory CIN/PAN for non-demo registration
  if (!registrationNumber && !demo) {
    return NextResponse.json({ ok: false, message: "CIN or PAN is required for verification." }, { status: 400 })
  }

  // 2. Run Verification
  try {
    const res = await verifyCIN(registrationNumber || "DEMO")
    
    // If demo is requested or verification fails but we want to allow demo
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

    // 3. Name Matching Logic
    const officialName = res.name || ""
    if (!isNameMatch(name, officialName)) {
      return NextResponse.json({ 
        ok: false, 
        message: `Name mismatch. Official name for this CIN is "${officialName}". Please use the correct registered name.` 
      }, { status: 400 })
    }

    // 4. Save Verified Company
    const { data: inserted, error } = await saveCompany(
      supabase, user.id, officialName, registrationNumber, "verified", res.source
    )
    if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
    
    return NextResponse.json({ ok: true, company: inserted, verifiedName: officialName })
  } catch (e) {
    return NextResponse.json({ ok: false, message: (e as Error).message }, { status: 500 })
  }
}

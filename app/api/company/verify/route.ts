import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

const GRIDLINES_BASE = "https://api.gridlines.io"
const GRIDLINES_API_KEY = process.env.GRIDLINES_API_KEY

function detectIdType(id: string) {
  const v = id.trim().toUpperCase()
  // Very lightweight heuristics: PAN is 10 chars alphanumeric pattern, CIN ~21 chars often starts with U/L
  const isPAN = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v)
  const isCIN = /^[UL][0-9A-Z]{20}$/.test(v) || v.length >= 15
  return isPAN ? "PAN" : isCIN ? "CIN" : "UNKNOWN"
}

export async function POST(req: Request) {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { registrationNumber, name } = body ?? {}
  if (!registrationNumber || !name) {
    return NextResponse.json({ ok: false, message: "Missing name or registrationNumber" }, { status: 400 })
  }

  // Guard: require API key
  if (!GRIDLINES_API_KEY) {
    return NextResponse.json(
      { ok: false, message: "Missing GRIDLINES_API_KEY env var. Add it in Project Settings." },
      { status: 500 },
    )
  }

  const idType = detectIdType(registrationNumber)
  try {
    // Build request payload for Gridlines fetch-company
    const endpoint = `${GRIDLINES_BASE}/mca-api/fetch-company`
    const payload = idType === "PAN" ? { pan: registrationNumber } : { cin: registrationNumber } // fallback to CIN style

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-API-Key": GRIDLINES_API_KEY,
      },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}) as any)

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, source: "gridlines", status: "failed", error: data?.message || "Verification failed" },
        { status: 400 },
      )
    }

    // Normalize company info; adapt keys as per Gridlines response
    const company = {
      owner_user_id: user.id,
      name,
      registration_number: registrationNumber,
      verification_status: "verified" as const,
      verifier_source: "gridlines",
      verified_at: new Date().toISOString(),
      meta: data, // store raw payload for now
    }

    const { data: inserted, error } = await supabase.from("companies").insert(company).select().single()
    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, company: inserted })
  } catch (e) {
    return NextResponse.json({ ok: false, message: (e as Error).message }, { status: 500 })
  }
}

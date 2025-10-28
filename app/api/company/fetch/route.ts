import { NextResponse } from "next/server"

const GRIDLINES_BASE = "https://api.gridlines.io"
const GRIDLINES_API_KEY = process.env.GRIDLINES_API_KEY

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const cin = searchParams.get("cin")?.toUpperCase().trim()
  const pan = searchParams.get("pan")?.toUpperCase().trim()

  if (!cin && !pan) {
    return NextResponse.json({ ok: false, message: "Provide ?cin= or ?pan=" }, { status: 400 })
  }
  if (!GRIDLINES_API_KEY) {
    return NextResponse.json({ ok: false, message: "Missing GRIDLINES_API_KEY env var" }, { status: 500 })
  }

  const endpoint = `${GRIDLINES_BASE}/mca-api/fetch-company`
  const payload = cin ? { cin } : { pan }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-API-Key": GRIDLINES_API_KEY,
      },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json({ ok: false, source: "gridlines", error: data }, { status: 400 })
    }
    return NextResponse.json({ ok: true, data })
  } catch (e) {
    return NextResponse.json({ ok: false, message: (e as Error).message }, { status: 500 })
  }
}

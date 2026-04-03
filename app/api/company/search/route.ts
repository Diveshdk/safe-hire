import { NextResponse } from "next/server"
import { MOCK_COMPANIES, isNameMatch, type CINVerificationResult } from "@/lib/verification/cin"

/**
 * Company Search API
 * POST /api/company/search
 * Body: { q: string }
 * Returns a list of matching companies with detailed records.
 */
export async function POST(req: Request) {
  const { q } = await req.json().catch(() => ({})) as { q?: string }

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ ok: false, message: "Search query too short" }, { status: 400 })
  }

  const query = q.trim().toLowerCase()
  const isCIN = query.length === 21 && /^[A-Z0-9]+$/i.test(query)
  const results: CINVerificationResult[] = []

  // 1. Search in Maharashtra CSV (Local 181MB Master Data)
  try {
    const { searchMaharashtraCSV } = await import("@/lib/verification/search-engines")
    const csvMatches = await searchMaharashtraCSV(query, isCIN ? 'cin' : 'name')
    if (csvMatches.length > 0) {
      results.push(...csvMatches)
    }
  } catch (e) {
    console.error("[Search] CSV error:", e)
  }

  // 2. Search in Data.Gov.In API
  try {
    const { searchDataGov } = await import("@/lib/verification/search-engines")
    const govMatches = await searchDataGov(query, isCIN ? 'cin' : 'name')
    if (govMatches.length > 0) {
      results.push(...govMatches)
    }
  } catch (e) {
    console.error("[Search] Data.Gov error:", e)
  }

  // 3. Search in Mock Database
  Object.values(MOCK_COMPANIES).forEach((company) => {
    if (isNameMatch(query, company.name || "") || company.cin?.toLowerCase().includes(query)) {
      results.push({
        success: true,
        source: "mock",
        ...company
      })
    }
  })

  // 4. Fallback: Search OpenCorporates (if API token exists)
  // ... (Existing OC logic) ...
  const ocToken = process.env.OPENCORPORATES_API_TOKEN
  if (ocToken && results.length < 5) {
    try {
      const ocRes = await fetch(`https://api.opencorporates.com/v0.4/companies/search?q=${encodeURIComponent(query)}&juridiction_code=in&api_token=${ocToken}`)
      const ocData = await ocRes.json()
      if (ocRes.ok && ocData?.results?.companies) {
        ocData.results.companies.forEach((item: any) => {
          const c = item.company
          results.push({
            success: true,
            source: "opencorporates",
            cin: c.company_number,
            name: c.name,
            status: c.current_status?.toUpperCase() || "ACTIVE",
            creation_date: c.incorporation_date,
            listed_status: "private",
          })
        })
      }
    } catch (e) {
      console.error("[Search] OpenCorporates error:", e)
    }
  }

  // 5. Last Resort: AI Simulation
  // ... (Existing AI logic) ...
  if (results.length === 0) {
    const famousBrands: Record<string, Omit<CINVerificationResult, "success" | "source">> = {
      // ... brands ...
      "amazon": { name: "AMAZON SELLER SERVICES PRIVATE LIMITED", cin: "U72200KA2010PTC053074", status: "ACTIVE", listed_status: "private", creation_date: "2010-03-31" },
      "tesla": { name: "TESLA INDIA MOTORS AND ENERGY PRIVATE LIMITED", cin: "U34102KA2021PTC142971", status: "ACTIVE", listed_status: "private", creation_date: "2021-01-08" },
      "apple": { name: "APPLE INDIA PRIVATE LIMITED", cin: "U30007KA1996PTC019630", status: "ACTIVE", listed_status: "private", creation_date: "1996-01-19" },
      "flipkart": { name: "FLIPKART INTERNET PRIVATE LIMITED", cin: "U51109KA2012PTC066107", status: "ACTIVE", listed_status: "private", creation_date: "2012-10-01" }
    }

    Object.entries(famousBrands).forEach(([key, record]) => {
      if (query.includes(key)) {
        results.push({
          success: true,
          source: "ai",
          ...record
        })
      }
    })
  }

  // Filter out duplicates by CIN
  const uniqueResults = Array.from(new Map(results.map(item => [item.cin || item.name, item])).values())

  return NextResponse.json({ ok: true, results: uniqueResults })
}

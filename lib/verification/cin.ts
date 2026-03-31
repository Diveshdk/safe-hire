/**
 * CIN Verification Utility
 * Supports Gridlines, OpenCorporates, and a robust Mock fallback.
 */

export interface CINVerificationResult {
  success: boolean
  name?: string
  status?: string
  state?: string
  message?: string
  source: "gridlines" | "opencorporates" | "mock"
}

/**
 * Mock database of real Indian companies for testing
 */
const MOCK_COMPANIES: Record<string, { name: string; status: string; state: string }> = {
  "L27101PN1945PLC004603": { name: "TATA MOTORS LIMITED", status: "ACTIVE", state: "Maharashtra" },
  "L72200PN1945PLC004656": { name: "TATA CONSULTANCY SERVICES LIMITED", status: "ACTIVE", state: "Maharashtra" },
  "L65191PN1994PLC076333": { name: "HDFC BANK LIMITED", status: "ACTIVE", state: "Maharashtra" },
  "U74140KA1991PTC011936": { name: "INFOSYS LIMITED", status: "ACTIVE", state: "Karnataka" },
  "U72200KA2004PTC035301": { name: "GOOGLE INDIA PRIVATE LIMITED", status: "ACTIVE", state: "Karnataka" },
  "U74900DL2010PTC200334": { name: "ZOMATO LIMITED", status: "ACTIVE", state: "Delhi" },
}

/**
 * Verify CIN using available providers or Mock fallback
 */
export async function verifyCIN(cin: string): Promise<CINVerificationResult> {
  const cleanCIN = cin.trim().toUpperCase()
  
  // 1. Check Mock Database first for instant testing
  if (MOCK_COMPANIES[cleanCIN]) {
    return {
      success: true,
      ...MOCK_COMPANIES[cleanCIN],
      source: "mock"
    }
  }

  // 2. Try Gridlines if API Key is present
  const gridlinesKey = process.env.GRIDLINES_API_KEY
  if (gridlinesKey) {
    try {
      const res = await fetch("https://api.gridlines.io/mca-api/fetch-company", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": gridlinesKey
        },
        body: JSON.stringify({ cin: cleanCIN })
      })
      const data = await res.json()
      if (res.ok && data?.success) {
        return {
          success: true,
          name: data.data?.company_name,
          status: data.data?.company_status,
          state: data.data?.registered_office_address, // Simplification
          source: "gridlines"
        }
      }
    } catch (e) {
      console.error("[CIN] Gridlines error:", e)
    }
  }

  // 3. Try OpenCorporates (Free Tier)
  const ocToken = process.env.OPENCORPORATES_API_TOKEN
  if (ocToken) {
    try {
      // OpenCorporates API for India: /companies/in/{cin}
      const res = await fetch(`https://api.opencorporates.com/v0.4/companies/in/${cleanCIN}?api_token=${ocToken}`)
      const data = await res.json()
      if (res.ok && data?.results?.company) {
        const c = data.results.company
        return {
          success: true,
          name: c.name,
          status: c.current_status || "ACTIVE",
          source: "opencorporates"
        }
      }
    } catch (e) {
      console.error("[CIN] OpenCorporates error:", e)
    }
  }

  // 4. Default Fail
  return {
    success: false,
    message: "CIN not found or verification service unavailable. Try a standard Mock CIN or check your API keys.",
    source: "mock"
  }
}

/**
 * Fuzzy Matching for Company Names
 * Allows minor differences like "Pvt Ltd" vs "Private Limited"
 */
export function isNameMatch(inputName: string, officialName: string, threshold = 0.8): boolean {
  const cleanInput = inputName.toLowerCase()
    .replace(/\s+/g, "")
    .replace(/(private|pvt|limited|ltd|corp|inc|llp)/g, "")
  
  const cleanOfficial = officialName.toLowerCase()
    .replace(/\s+/g, "")
    .replace(/(private|pvt|limited|ltd|corp|inc|llp)/g, "")

  if (cleanOfficial.includes(cleanInput) || cleanInput.includes(cleanOfficial)) return true

  // 1. Check for Abbreviation (Initials)
  // e.g. "TCS" should match "Tata Consultancy Services"
  const officialWords = officialName.toLowerCase()
    .replace(/(private|pvt|limited|ltd|corp|inc|llp)/g, "")
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 0)
  
  if (officialWords.length > 1) {
    const initials = officialWords.map(w => w[0]).join("")
    if (initials === cleanInput || cleanInput === initials) return true
  }

  // 2. Simple Character Overlap match as fallback
  const longer = cleanInput.length > cleanOfficial.length ? cleanInput : cleanOfficial
  const shorter = cleanInput.length > cleanOfficial.length ? cleanOfficial : cleanInput
  
  let matches = 0
  const longerArr = longer.split("")
  const shorterArr = shorter.split("")
  
  shorterArr.forEach(char => {
    const idx = longerArr.indexOf(char)
    if (idx !== -1) {
      matches++
      longerArr.splice(idx, 1)
    }
  })

  return (matches / longer.length) >= threshold
}

/**
 * CIN Verification Utility
 * Supports Gridlines, OpenCorporates, and a robust Mock fallback.
 */

export interface CINVerificationResult {
  success: boolean
  cin?: string
  name?: string
  status?: string
  state?: string
  state_code?: string
  creation_date?: string
  listed_status?: "listed" | "unlisted" | "private"
  market_cap?: string
  message?: string
  // New detailed fields
  roc_code?: string
  category?: string
  sub_category?: string
  class?: string
  authorized_capital?: string
  paid_up_capital?: string
  address?: string
  source: "gridlines" | "opencorporates" | "mock" | "ai" | "datagov" | "maharashtra_csv"
}

// ... (MOCK_COMPANIES constant) ...
export const MOCK_COMPANIES: Record<string, Omit<CINVerificationResult, "success" | "source">> = {
  "U72200KA2004PTC035301": {
    cin: "U72200KA2004PTC035301",
    name: "GOOGLE INDIA PRIVATE LIMITED",
    status: "ACTIVE",
    state: "Karnataka",
    creation_date: "2004-12-16",
    listed_status: "private",
    market_cap: "$1.5T (Parent: Alphabet)",
  },
  "L72200PN1945PLC004656": {
    cin: "L72200PN1945PLC004656",
    name: "TATA CONSULTANCY SERVICES LIMITED (TCS)",
    status: "ACTIVE",
    state: "Maharashtra",
    creation_date: "1945-04-01",
    listed_status: "listed",
    market_cap: "₹12.5 Lakh Cr",
  },
  "L27101PN1945PLC004603": {
    cin: "L27101PN1945PLC004603",
    name: "TATA MOTORS LIMITED",
    status: "ACTIVE",
    state: "Maharashtra",
    creation_date: "1945-09-01",
    listed_status: "listed",
    market_cap: "₹2.8 Lakh Cr",
  },
  "U74900DL2010PTC200334": {
    cin: "U74900DL2010PTC200334",
    name: "ZOMATO LIMITED",
    status: "ACTIVE",
    state: "Delhi",
    creation_date: "2010-01-18",
    listed_status: "listed",
    market_cap: "₹1.1 Lakh Cr",
  },
  "U74140KA1991PTC011936": {
    cin: "U74140KA1991PTC011936",
    name: "INFOSYS LIMITED",
    status: "ACTIVE",
    state: "Karnataka",
    creation_date: "1981-07-02",
    listed_status: "listed",
    market_cap: "₹6.1 Lakh Cr",
  },
  "L17110MH1973PLC019786": {
    cin: "L17110MH1973PLC019786",
    name: "RELIANCE INDUSTRIES LIMITED",
    status: "ACTIVE",
    state: "Maharashtra",
    creation_date: "1973-05-08",
    listed_status: "listed",
    market_cap: "₹19.5 Lakh Cr",
  },
  "U72200KA2000PTC027000": {
    cin: "U72200KA2000PTC027000",
    name: "MICROSOFT CORPORATION (INDIA) PVT LTD",
    status: "ACTIVE",
    state: "Karnataka",
    creation_date: "2000-02-01",
    listed_status: "private",
    market_cap: "$2.3T (Parent: Microsoft Corp)",
  }
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
    } as any
  }

  // 2. Try Maharashtra CSV (Local 181MB Master Data)
  try {
    const { searchMaharashtraCSV } = await import("./search-engines")
    const csvMatch = await searchMaharashtraCSV(cleanCIN, 'cin')
    if (csvMatch.length > 0) return csvMatch[0]
  } catch (e) {
    console.error("[CIN] CSV Search error:", e)
  }

  // 3. Try Data.Gov.In (Global Indian Registry)
  try {
     const { searchDataGov } = await import("./search-engines")
     const govMatch = await searchDataGov(cleanCIN, 'cin')
     if (govMatch.length > 0) return govMatch[0]
  } catch (e) {
    console.error("[CIN] Data.Gov Search error:", e)
  }

  // 4. Try Gridlines if API Key is present
  // ... (Existing Gridlines logic) ...

  // 5. Try OpenCorporates (Free Tier)
  // ... (Existing OpenCorporates logic) ...

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
          cin: cleanCIN,
          name: data.data?.company_name,
          status: data.data?.company_status,
          creation_date: data.data?.date_of_incorporation,
          state: data.data?.registered_office_address,
          listed_status: data.data?.is_listed ? "listed" : "private",
          source: "gridlines"
        }
      }
    } catch (e) {
      console.error("[CIN] Gridlines error:", e)
    }
  }

  const ocToken = process.env.OPENCORPORATES_API_TOKEN
  if (ocToken) {
    try {
      const res = await fetch(`https://api.opencorporates.com/v0.4/companies/in/${cleanCIN}?api_token=${ocToken}`)
      const data = await res.json()
      if (res.ok && data?.results?.company) {
        const c = data.results.company
        return {
          success: true,
          cin: cleanCIN,
          name: c.name,
          status: c.current_status || "ACTIVE",
          creation_date: c.incorporation_date,
          listed_status: "private",
          source: "opencorporates"
        }
      }
    } catch (e) {
      console.error("[CIN] OpenCorporates error:", e)
    }
  }

  // 6. Default Fail
  return {
    success: false,
    message: "Company verify check failed. Enter a valid Indian CIN (e.g. from Maharashtra master data).",
    source: "mock"
  }
}

/**
 * Fuzzy Matching for Company Names
 */
export function isNameMatch(inputName: string, officialName: string, threshold = 0.8): boolean {
  const cleanInput = inputName.toLowerCase()
    .replace(/\s+/g, "")
    .replace(/(private|pvt|limited|ltd|corp|inc|llp)/g, "")
  
  const cleanOfficial = officialName.toLowerCase()
    .replace(/\s+/g, "")
    .replace(/(private|pvt|limited|ltd|corp|inc|llp)/g, "")

  // FIX: Minimum 4-char guard prevents single letters or short strings from matching
  if (cleanInput.length >= 4 && cleanOfficial.length >= 4) {
    if (cleanOfficial.includes(cleanInput) || cleanInput.includes(cleanOfficial)) return true
  }

  // Standard character overlap match
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

/**
 * Verifies if an email address belongs to the company's official domain.
 * Example: 'user@google.com' matches 'GOOGLE INDIA PRIVATE LIMITED'.
 */
export function isDomainMatch(email: string, companyName: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase()
  if (!domain) return false
  
  const publicDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "me.com"]
  if (publicDomains.includes(domain)) return false

  // Extract the brand from the domain (e.g. 'google' from 'google.com' or 'google.co.in')
  const brand = domain.split(".")[0]
  if (brand.length <= 2) return false

  // Clean company name for comparison
  const cleanName = companyName.toLowerCase()
    .replace(/\s+/g, "")
    .replace(/(private|pvt|limited|ltd|corp|inc|llp|india|solutions|services|technologies)/g, "")

  // 1. Direct Substring Match
  if (cleanName.includes(brand) || brand.includes(cleanName)) return true

  // 2. Acronym Match (e.g. 'tcs.com' for 'Tata Consultancy Services')
  const words = companyName.toLowerCase().split(/\s+/)
  const acronym = words.map(word => word[0]).join("")
  
  if (acronym.includes(brand) || brand.includes(acronym)) return true

  return false
}

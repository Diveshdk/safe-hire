import fs from "fs"
import path from "path"
import readline from "readline"
import { type CINVerificationResult } from "./cin"

const MAHARASHTRA_CSV_PATH = path.join(process.cwd(), "maharashtra.csv")
const DATA_GOV_RESOURCE_ID = "4dbe5667-7b6b-41d7-82af-211562424d9a"
const DATA_GOV_API_KEY = "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b"

/**
 * Searches the 181MB Maharashtra CSV for a specific CIN or Company Name.
 * Uses a manual streaming approach with 'readline' to avoid external dependencies like csv-parser.
 */
export async function searchMaharashtraCSV(query: string, type: 'cin' | 'name'): Promise<CINVerificationResult[]> {
  const results: CINVerificationResult[] = []
  const cleanQuery = query.trim().toUpperCase()
  const limit = type === 'cin' ? 1 : 10

  if (!fs.existsSync(MAHARASHTRA_CSV_PATH)) {
    console.warn("[CSV Search] maharashtra.csv not found at", MAHARASHTRA_CSV_PATH)
    return []
  }

  const fileStream = fs.createReadStream(MAHARASHTRA_CSV_PATH)
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })

  let headers: string[] = []
  let count = 0

  for await (const line of rl) {
    // Simple CSV parser for quoted strings (handles basic cases)
    const rowValues = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
    
    if (headers.length === 0) {
      headers = rowValues.map(h => h.replace(/"/g, '').trim())
      continue
    }

    const row: any = {}
    headers.forEach((h, i) => {
      row[h] = rowValues[i]?.replace(/"/g, '').trim()
    })

    let isMatch = false
    if (type === 'cin' && row.CIN === cleanQuery) {
      isMatch = true
    } else if (type === 'name' && row.CompanyName?.toUpperCase().includes(cleanQuery)) {
      isMatch = true
    }

    if (isMatch) {
      results.push({
        success: true,
        source: "maharashtra_csv",
        cin: row.CIN,
        name: row.CompanyName,
        roc_code: row.CompanyROCcode,
        category: row.CompanyCategory,
        sub_category: row.CompanySubCategory,
        class: row.CompanyClass,
        authorized_capital: row.AuthorizedCapital,
        paid_up_capital: row.PaidupCapital,
        creation_date: row.CompanyRegistrationdate_date,
        address: row.Registered_Office_Address,
        listed_status: row.Listingstatus?.toLowerCase().includes('listed') ? 'listed' : 'private',
        status: row.CompanyStatus,
        state_code: row.CompanyStateCode
      })
      count++
      if (count >= limit) {
        rl.close()
        fileStream.destroy()
        break
      }
    }
  }

  return results
}

/**
 * Searches the official Data.Gov.In registry via REST.
 */
export async function searchDataGov(query: string, type: 'cin' | 'name'): Promise<CINVerificationResult[]> {
  try {
    const filterKey = type === 'cin' ? 'CIN' : 'CompanyName'
    const url = `https://api.data.gov.in/resource/${DATA_GOV_RESOURCE_ID}?api-key=${DATA_GOV_API_KEY}&format=json&filters[${filterKey}]=${encodeURIComponent(query.toUpperCase())}`
    
    const res = await fetch(url)
    const data = await res.json()

    if (data?.records && Array.isArray(data.records)) {
      return data.records.map((row: any) => ({
        success: true,
        source: "datagov",
        cin: row.CIN,
        name: row.CompanyName,
        roc_code: row.CompanyROCcode,
        category: row.CompanyCategory,
        sub_category: row.CompanySubCategory,
        class: row.CompanyClass,
        authorized_capital: row.AuthorizedCapital,
        paid_up_capital: row.PaidupCapital,
        creation_date: row.CompanyRegistrationdate_date,
        address: row.Registered_Office_Address,
        listed_status: row.Listingstatus?.toLowerCase().includes('listed') ? 'listed' : 'private',
        status: row.CompanyStatus,
        state_code: row.CompanyStateCode
      }))
    }
  } catch (e) {
    console.error("[Data.Gov Search] error:", e)
  }
  return []
}

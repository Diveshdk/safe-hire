/**
 * OCR Utility using OCR.space API
 * See documentation: https://ocr.space/ocrapi
 */

export async function performOCR(fileBuffer: Buffer, fileName: string): Promise<string> {
  const apiKey = process.env.OCR_API_KEY;
  const apiUrl = process.env.OCR_API_URL || "https://api.ocr.space/parse/image";

  if (!apiKey) {
    throw new Error("OCR_API_KEY is not configured in .env");
  }

  // Convert buffer to base64 or use FormData
  // OCR.space supports multipart/form-data
  const formData = new FormData();
  
  // Use Blob for the file buffer
  const blob = new Blob([new Uint8Array(fileBuffer)], { type: "image/jpeg" }); // Defaulting to jpeg, OCR space will handle others
  formData.append("file", blob, fileName);
  formData.append("apikey", apiKey);
  formData.append("language", "eng");
  formData.append("isOverlayRequired", "false");
  formData.append("FileType", fileName.split('.').pop()?.toUpperCase() || "JPG");
  formData.append("isTable", "true"); // Helps with structured data extraction

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OCR API request failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();

    if (result.OCRExitCode !== 1) {
      throw new Error(`OCR Error: ${result.ErrorMessage || "Unknown OCR error"}`);
    }

    // Combine all parsed text
    const parsedText = result.ParsedResults?.map((r: any) => r.ParsedText).join("\n") || "";
    return parsedText;
  } catch (error: any) {
    console.error("[OCR Utility Error]:", error);
    throw error;
  }
}

/**
 * Specifically extract Aadhaar details from OCR text
 * Handles both Title Case and ALL CAPS names printed on Aadhaar cards.
 */
export function extractAadhaarDetails(text: string): { fullName?: string; aadhaarNumber?: string } {
  // ── 1. Extract Aadhaar number ─────────────────────────────────────────────
  // Matches "XXXX XXXX XXXX", "XXXXXXXXXXXX", or masked "XXXX XXXX 1234", "XXXXXXXX1234"
  // Supports 'x', 'X', and '*' as placeholders
  const aadhaarRegex = /\b([xX*\d]{4}[\s-][xX*\d]{4}[\s-]\d{4}|[xX*\d]{12})\b/
  const aadhaarMatch = text.match(aadhaarRegex)
  const aadhaarNumber = aadhaarMatch ? aadhaarMatch[0].replace(/[\s-]/g, "") : undefined

  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0)

  // Keywords to skip — these are never names
  const SKIP = [
    "government", "india", "भारत", "aadhaar", "आधार", "uid", "uidai", "enrolment",
    "dob", "date of birth", "जन्म", "year of birth", "yob",
    "male", "female", "पुरुष", "महिला", "m/", "f/",
    "address", "पता", "village", "district", "state", "pin", "post",
    "help", "toll", "free", "www", "http", "unique",
    "digilocker", "authenticated", "digitally", "signed", "signature", "issued", "verified",
    "powered by", "tap to zoom", "zoom", "o",
  ]

  function isSkipLine(line: string): boolean {
    const lower = line.toLowerCase()
    return SKIP.some(k => lower.includes(k)) || /^\d+$/.test(line) || line.length < 3
  }

  // ── 2. Strategy A: Find the line just BEFORE "DOB" or "Year of Birth" ────
  // On Aadhaar cards, layout is typically: Name → DOB → Gender → Aadhaar No.
  function findNameByDobAnchor(): string | undefined {
    for (let i = 1; i < lines.length; i++) {
      const lower = lines[i].toLowerCase()
      if (lower.includes("dob") || lower.includes("date of birth") || lower.includes("year of birth") || lower.includes("जन्म")) {
        // Check 1-3 lines above for a name-like line
        for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
          const candidate = lines[j]
          if (!isSkipLine(candidate) && /^[A-Za-z\s.'-]{3,60}$/.test(candidate)) {
            return toTitleCase(candidate)
          }
        }
      }
    }
    return undefined
  }

  // ── 3. Strategy B: Find name above a Date pattern (YYYY-MM-DD or DD-MM-YYYY)
  // Common in DigiLocker where "DOB" keyword might be missing.
  function findNameByDateAnchor(): string | undefined {
    // Matches 2004-10-26 or 26-10-2004
    const dateRegex = /\b(\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4})\b/
    for (let i = 1; i < lines.length; i++) {
      if (dateRegex.test(lines[i])) {
        // Check 1-2 lines above the date for a name
        for (let j = i - 1; j >= Math.max(0, i - 2); j--) {
          const candidate = lines[j]
          if (!isSkipLine(candidate) && /^[A-Za-z\s.'-]{3,60}$/.test(candidate)) {
            return toTitleCase(candidate)
          }
        }
      }
    }
    return undefined
  }

  // ── 4. Strategy C: Find name after "To," anchor (Common in DigiLocker/e-Aadhaar)
  function findNameByToAnchor(): string | undefined {
    for (let i = 0; i < lines.length - 1; i++) {
      const lower = lines[i].toLowerCase()
      // Matches "To," "To [Name]" etc.
      if (lower === "to" || lower === "to," || lower.startsWith("to ")) {
        let candidate = lower === "to" || lower === "to," ? lines[i + 1] : lines[i].substring(3).trim()
        if (candidate && !isSkipLine(candidate) && /^[A-Za-z\s.'-]{3,60}$/.test(candidate)) {
          return toTitleCase(candidate)
        }
      }
    }
    return undefined
  }

  // ── 5. Strategy D: First non-skip Title-Case or ALL-CAPS name line ────────
  function findFirstNameLike(): string | undefined {
    for (const line of lines) {
      if (isSkipLine(line)) continue
      // Title Case: e.g. "Devendra M Chaurasia"
      // Relaxed to allow words without lowercase (initials)
      if (/^[A-Z][a-z.]*(\s[A-Z][a-z.]*){0,6}$/.test(line) && line.length >= 3 && line.length <= 60) {
        return toTitleCase(line)
      }
      // ALL CAPS: e.g. "DIVESH KANKANI"
      if (/^[A-Z][A-Z\s.'-]{2,60}$/.test(line) && line.split(/\s+/).length >= 2) {
        return toTitleCase(line)
      }
    }
    return undefined
  }

  function toTitleCase(str: string): string {
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).trim()
  }

  // ── 6. Run strategies in priority order ───────────────────────────────────
  const fullName = findNameByDobAnchor() || findNameByDateAnchor() || findNameByToAnchor() || findFirstNameLike()

  return { fullName, aadhaarNumber }
}

/**
 * Specifically extract Certificate details from OCR text
 */
export function extractCertificateDetails(text: string): { studentName?: string; collegeName?: string } {
  // Common patterns for certificates: "This is to certify that [Name]", "Awarded to [Name]", etc.
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  
  let studentName: string | undefined;
  let collegeName: string | undefined;

  // Search for keywords that precede a name
  const nameTriggers = ["certify that", "awarded to", "presented to", "this certificate is presented to"];
  
  for (let i = 0; i < lines.length; i++) {
    const lowerLine = lines[i].toLowerCase();
    
    // Name detection
    for (const trigger of nameTriggers) {
      if (lowerLine.includes(trigger)) {
        // The name might be on the same line or next line
        const parts = lines[i].split(new RegExp(trigger, "i"));
        if (parts[1] && parts[1].trim().length > 3) {
          studentName = parts[1].trim();
        } else if (lines[i+1]) {
          studentName = lines[i+1].trim();
        }
        break;
      }
    }

    // College/University detection
    if (lowerLine.includes("college") || lowerLine.includes("university") || lowerLine.includes("institute")) {
      collegeName = lines[i];
    }

    if (studentName && collegeName) break;
  }

  return { studentName, collegeName };
}

/**
 * Extract Business details from OCR text (GST, Company Name)
 */
export function extractBusinessDetails(text: string): { companyName?: string; gstNumber?: string } {
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0)
  
  // 1. Extract GST Number
  // GST Format: 22AAAAA0000A1Z5 (15 characters)
  const gstRegex = /[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}/
  const gstMatch = text.match(gstRegex)
  const gstNumber = gstMatch ? gstMatch[0] : undefined

  // 2. Extract Company Name
  // Typically found near the top or after "Name of Entity"
  let companyName: string | undefined
  const nameIndicators = ["name", "entity", "sold to", "bill to", "tax invoice", "received from"]
  
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const line = lines[i]
    const lower = line.toLowerCase()
    
    // If it's a very short line or known skip line, ignore
    if (line.length < 5 || ["invoice", "bill", "gst", "receipt"].includes(lower)) continue
    
    // Check if the line contains a name indicator
    const foundIndicator = nameIndicators.find(ind => lower.includes(ind))
    if (foundIndicator) {
      // The name might be after the colon or on the next line
      const parts = line.split(/[:\-]/)
      if (parts[1] && parts[1].trim().length > 5) {
        companyName = parts[1].trim()
        break
      } else if (lines[i+1] && lines[i+1].length > 5) {
        companyName = lines[i+1].trim()
        break
      }
    }

    // Default to the first long line if no indicators match (often the header)
    if (!companyName && line.length > 10 && !/[0-9]/.test(line[0])) {
      companyName = line
    }
  }

  return { companyName, gstNumber }
}

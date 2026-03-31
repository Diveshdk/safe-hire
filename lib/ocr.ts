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
  // Matches "XXXX XXXX XXXX" or "XXXXXXXXXXXX" (12 consecutive digits)
  const aadhaarRegex = /\b(\d{4}[\s-]\d{4}[\s-]\d{4}|\d{12})\b/
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
          if (!isSkipLine(candidate) && /^[A-Za-z\s.'-]{3,50}$/.test(candidate)) {
            return toTitleCase(candidate)
          }
        }
      }
    }
    return undefined
  }

  // ── 3. Strategy B: First non-skip Title-Case or ALL-CAPS name line ────────
  function findFirstNameLike(): string | undefined {
    for (const line of lines) {
      if (isSkipLine(line)) continue
      // Title Case: e.g. "Divesh Kankani" — each word starts with capital
      if (/^[A-Z][a-z]+(\s[A-Z][a-z]+){0,4}$/.test(line) && line.length >= 3 && line.length <= 60) {
        return toTitleCase(line)
      }
      // ALL CAPS: e.g. "DIVESH KANKANI"
      if (/^[A-Z][A-Z\s.'-]{2,50}$/.test(line) && line.split(/\s+/).length >= 2) {
        return toTitleCase(line)
      }
    }
    return undefined
  }

  function toTitleCase(str: string): string {
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).trim()
  }

  // ── 4. Run strategies in priority order ───────────────────────────────────
  const fullName = findNameByDobAnchor() || findFirstNameLike()

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

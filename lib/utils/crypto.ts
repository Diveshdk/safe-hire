import { createHash } from "crypto"

/**
 * SAFE-HIRE PRIVACY POLICY:
 *
 * We do NOT store the full 12-digit Aadhaar number. Ever.
 * We only extract the LAST 4 DIGITS and the FULL NAME from the Aadhaar card.
 * These two values are combined and hashed with SHA-256 (one-way, irreversible).
 * The original digits and name CANNOT be recovered from the stored hash.
 *
 * This approach:
 *  - Prevents duplicate accounts (same last-4 + same name = same person)
 *  - Complies with UIDAI guidelines on not storing full Aadhaar numbers
 *  - Complies with the DPDPA 2023 data minimization principle
 *  - Protects users even in the unlikely event of a database breach
 */

const SALT = process.env.AADHAAR_SALT || "safe-hire-v1-privacy-by-design"

/**
 * Builds a composite, salted SHA-256 hash from the last 4 digits of an
 * Aadhaar number and the person's full name.
 *
 * This is the ONLY data stored in the database for identity de-duplication.
 * The full Aadhaar number is NEVER persisted.
 *
 * @param last4   The last 4 digits of the Aadhaar number (extracted from OCR or user input)
 * @param name    The full name as it appears on the Aadhaar card
 */
export function buildAadhaarKey(last4: string, name: string): string {
  // Normalize inputs defensively
  const digits = last4.replace(/\D/g, "").slice(-4)
  // Normalize Name: lower case, remove punctuation/dots, collapse extra spaces
  const normalizedName = name
    .toLowerCase()
    .replace(/[^\w\s]|_/g, "") // Remove punctuation
    .replace(/\s+/g, " ")     // Collapse spaces
    .trim()

  if (digits.length !== 4 || !normalizedName) {
    throw new Error("Invalid Aadhaar key inputs: need exactly 4 digits and a non-empty name")
  }

  return createHash("sha256")
    .update(`${digits}:${normalizedName}:${SALT}`)
    .digest("hex")
}

/**
 * @deprecated Use buildAadhaarKey() instead.
 * Kept for backward compat during migration — will be removed.
 */
export function hashAadhaar(aadhaarNumber: string): string {
  const normalized = aadhaarNumber.replace(/\D/g, "")
  if (normalized.length === 0) return ""
  return createHash("sha256")
    .update(normalized + SALT)
    .digest("hex")
}

/**
 * Returns a display-safe masked representation.
 * Accepts any of: "1234", "**** **** 1234", "1234 5678 9012", full or partial numbers.
 * Always shows: **** **** XXXX
 */
export function maskAadhaar(input: string): string {
  const digits = input.replace(/\D/g, "")
  const last4 = digits.slice(-4)
  if (last4.length < 4) return "**** **** " + last4.padStart(4, "*")
  return `**** **** ${last4}`
}

/**
 * Extracts the last 4 digits from any Aadhaar input format.
 * Accepts: "1234", "**** **** 1234", "123456789012", "1234 5678 9012"
 */
export function extractLast4(input: string): string {
  const digits = input.replace(/\D/g, "")
  return digits.slice(-4)
}

/**
 * Generates a unique SafeHire ID in the format SH-XXXXXXXX
 * where X are alphanumeric characters.
 */
export function generateSafeHireId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Removed ambiguous chars like 0, O, 1, I
  let result = "SH-"
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

import { NextResponse } from "next/server"

// ZK Proof (Anon Aadhaar) has been removed from SafeHire.
// Use /api/verify/aadhaar with mode=ocr or mode=offline-xml instead.
export async function POST() {
  return NextResponse.json(
    { success: false, message: "Anonymous ZK Proof verification is no longer supported. Please use OCR or Offline XML verification." },
    { status: 410 }
  )
}

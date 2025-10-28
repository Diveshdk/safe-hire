import { SignedXml } from "xml-crypto"
import { DOMParser as XmldomParser } from "@xmldom/xmldom"

// Function to normalize PEM from env to handle single-line \\n formatting or accidental spacing
function normalizePem(input: string) {
  // Accept values pasted with literal "\n" sequences
  const val = input.includes("\\n") ? input.replace(/\\n/g, "\n") : input
  // Trim and ensure trailing newline for some parsers
  return (val || "").trim() + (val.endsWith("\n") ? "" : "\n")
}

// Verifies UIDAI Offline XML signature and extracts full name from <Poi name="...">.
// Requires env UIDAI_CERT_PEM (UIDAI public certificate in PEM format).
export async function verifyOfflineXml(
  xml: string,
): Promise<{ success: boolean; fullName?: string; message?: string }> {
  let certPem = process.env.UIDAI_CERT_PEM
  if (!certPem) {
    return { success: false, message: "UIDAI_CERT_PEM not configured. Paste the full BEGIN/END CERTIFICATE block." }
  }

  try {
    certPem = normalizePem(certPem)
    const doc = new XmldomParser().parseFromString(xml, "text/xml")
    const sigNodes = doc.getElementsByTagName("Signature")
    if (!sigNodes || sigNodes.length === 0) {
      return { success: false, message: "Missing XML signature" }
    }
    const signatureNode = sigNodes.item(0) as unknown as Node

    const signedXml = new SignedXml()
    // Provide the UIDAI public certificate as the verification key
    signedXml.keyInfoProvider = {
      getKeyInfo() {
        return ""
      },
      getKey() {
        // xml-crypto accepts a PEM string or Buffer
        return Buffer.from(certPem!)
      },
    } as any

    // Load and verify signature
    signedXml.loadSignature(signatureNode as any)
    const valid = signedXml.checkSignature(xml)
    if (!valid) {
      const reason = (signedXml as any).validationErrors?.join("; ") || "Signature invalid"
      return { success: false, message: reason }
    }

    // Extract full name from <Poi name="...">
    const poi = doc.getElementsByTagName("Poi")?.item(0) as Element | null
    const fullName = poi?.getAttribute("name")?.trim()
    if (!fullName || fullName.length < 3) {
      return { success: false, message: "Unable to read full name from XML" }
    }
    return { success: true, fullName }
  } catch (e: any) {
    const msg = e?.message || "Failed to verify XML"
    // Provide clearer hint for common PEM errors
    const hint =
      msg.includes("KeyInfo") || msg.includes("publicCert")
        ? " Check UIDAI_CERT_PEM format. It must be the full PEM with -----BEGIN CERTIFICATE----- lines."
        : ""
    return { success: false, message: msg + hint }
  }
}

// Reintroduce missing exports: demoVerify, apisetuInitiateOtp, apisetuConfirmOtp

export async function demoVerify({ fullName }: { fullName?: string }) {
  if (!fullName || fullName.trim().length < 3) {
    return { success: false, message: "Provide a valid full name in demo mode" }
  }
  return { success: true, fullName: fullName.trim() }
}

export async function apisetuInitiateOtp(params: { uid: string }) {
  const url = process.env.APISETU_AADHAAR_INIT_URL
  const key = process.env.APISETU_API_KEY
  if (!url || !key) return { success: false, message: "API Setu not configured" }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
    },
    body: JSON.stringify({ uid: params.uid }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    return { success: false, message: text || `API Setu init error ${res.status}` }
  }
  const data = (await res.json().catch(() => ({}))) as { success?: boolean; txnId?: string; message?: string }
  if (!data?.success || !data?.txnId) {
    return { success: false, message: data?.message || "API Setu init failed" }
  }
  return { success: true, txnId: data.txnId }
}

export async function apisetuConfirmOtp(params: { txnId: string; otp: string }) {
  const url = process.env.APISETU_AADHAAR_CONFIRM_URL
  const key = process.env.APISETU_API_KEY
  if (!url || !key) return { success: false, message: "API Setu not configured" }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
    },
    body: JSON.stringify({ txnId: params.txnId, otp: params.otp }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    return { success: false, message: text || `API Setu confirm error ${res.status}` }
  }
  const data = (await res.json().catch(() => ({}))) as { success?: boolean; fullName?: string; message?: string }
  if (!data?.success || !data?.fullName) {
    return { success: false, message: data?.message || "API Setu confirm failed" }
  }
  return { success: true, fullName: data.fullName }
}

import { NextRequest, NextResponse } from "next/server"
import { getBrowser } from "@/lib/browser-utils"
import { generateCertificateHtml } from "@/lib/certificate-template"

export async function POST(req: NextRequest) {
  try {
    const config = await req.json()

    if (!config || !config.safe_hire_id) {
      return NextResponse.json({ ok: false, message: "Invalid certificate configuration" }, { status: 400 })
    }

    // 1. Generate HTML
    const html = await generateCertificateHtml(config)

    // 2. Launch Puppeteer
    const browser = await getBrowser()
    const page = await browser.newPage()

    // 3. Set content and wait for it to be fully loaded (images, fonts, etc.)
    await page.setContent(html, { 
      waitUntil: "networkidle0",
      timeout: 30000 
    })

    // 4. Generate PDF
    // A4 Portrait is 210mm x 297mm
    // A4 Landscape is 297mm x 210mm
    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: {
        top: "0px",
        right: "0px",
        bottom: "0px",
        left: "0px",
      },
      preferCSSPageSize: true,
      displayHeaderFooter: false,
    })

    // 5. Cleanup
    await browser.close()

    // 6. Return response
    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="certificate-${config.safe_hire_id}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    })
  } catch (error: any) {
    console.error("[API/Certificates/Generate] Error:", error)
    return NextResponse.json({ 
      ok: false, 
      message: error.message || "Failed to generate PDF" 
    }, { status: 500 })
  }
}

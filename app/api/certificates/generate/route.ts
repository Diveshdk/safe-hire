import { NextRequest, NextResponse } from "next/server"
import { getBrowser } from "@/lib/browser-utils"
import { generateCertificateHtml } from "@/lib/certificate-template"

export async function POST(req: NextRequest) {
  const start = Date.now()
  console.log("[API/Certificates/Generate] POST request received")

  try {
    const config = await req.json()

    if (!config || !config.safe_hire_id) {
      return NextResponse.json({ ok: false, message: "Invalid certificate configuration" }, { status: 400 })
    }

    // 1. Generate HTML (now with Base64 embedded assets)
    console.log("[API/Certificates/Generate] Generating HTML template...")
    const html = await generateCertificateHtml(config)
    const htmlEnd = Date.now()
    console.log(`[API/Certificates/Generate] HTML ready in ${htmlEnd - start}ms`)

    // 2. Launch Puppeteer
    console.log("[API/Certificates/Generate] Getting browser instance...")
    const browser = await getBrowser()
    const browserReady = Date.now()
    console.log(`[API/Certificates/Generate] Browser instance obtained in ${browserReady - htmlEnd}ms`)

    const page = await browser.newPage()

    // 3. Set content and wait for it to be fully loaded
    console.log("[API/Certificates/Generate] Setting page content...")
    await page.setContent(html, { 
      waitUntil: "networkidle0",
      timeout: 7000 // Tight timeout for Hobby plan (total limit is 10s)
    })
    const contentReady = Date.now()
    console.log(`[API/Certificates/Generate] Content loaded in ${contentReady - browserReady}ms`)

    // 4. Generate PDF
    console.log("[API/Certificates/Generate] Generating PDF buffer...")
    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: { top: "0px", right: "0px", bottom: "0px", left: "0px" },
      preferCSSPageSize: true,
      displayHeaderFooter: false,
    })
    const pdfReady = Date.now()
    console.log(`[API/Certificates/Generate] PDF generated in ${pdfReady - contentReady}ms`)

    // 5. Cleanup
    await browser.close()
    console.log(`[API/Certificates/Generate] Total time: ${Date.now() - start}ms`)

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
    
    // Check for common Vercel Hobby timeout
    const isTimeout = error.message?.includes("Timeout") || (Date.now() - start > 9500)
    
    return NextResponse.json({ 
      ok: false, 
      message: isTimeout ? "The request timed out. Retrying might work as the browser will be warmed up." : (error.message || "Failed to generate PDF"),
      details: error.stack
    }, { status: 500 })
  }
}

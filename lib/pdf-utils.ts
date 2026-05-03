import html2canvas from "html2canvas"
import jsPDF from "jspdf"

// A4 landscape in pixels at 96dpi  →  1123 × 794
const A4_W_PX = 1123
const A4_H_PX = 794

/**
 * Sanitize a cloned document: replace every oklch() call with a safe hex
 * so html2canvas never crashes on modern Tailwind/ShadCN colour tokens.
 */
function sanitizeOklch(clonedDoc: Document) {
  // 1. Sanitize all <style> tags
  clonedDoc.querySelectorAll("style").forEach((tag) => {
    try {
      if (tag.textContent?.includes("oklch")) {
        // Replace oklch(...) with a safe hex to stop html2canvas parser from crashing
        tag.textContent = tag.textContent.replace(/oklch\([^)]+\)/g, "#000000")
      }
    } catch (e) {
       console.warn("Style tag sanitization failed", e)
    }
  })

  // 2. Aggressively remove any link tags that we can't sanitize but might contain oklch
  // This is a last resort to prevent the crash. We hope the injected styles below cover the basics.
  clonedDoc.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    try {
      // If we can't access it, it might have oklch and crash html2canvas
      // We'll keep it for now but if crashes persist, we might need to disable it
      const sheet = (link as HTMLLinkElement).sheet
      if (sheet) {
         for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
           if (sheet.cssRules[i].cssText.includes("oklch")) {
             (sheet as CSSStyleSheet).deleteRule(i)
           }
         }
      }
    } catch (e) {
      // Cross-origin CSS often contains oklch in Tailwind 4.
      // If we can't sanitize it, html2canvas WILL crash.
      // So we disable the link tag and rely on our own injected styles.
      link.setAttribute("media", "only x") // Disable it
    }
  })
}

/**
 * Inject a <style> block that:
 *   • Resets all known oklch CSS-variable aliases to safe hex values
 *   • Locks the certificate-container to A4 landscape pixel dimensions
 *   • Removes transforms, shadows, margins and border-radius
 */
function injectSafeStyles(clonedDoc: Document) {
  const s = clonedDoc.createElement("style")
  s.textContent = `
    /* ── Aggressive Reset ── */
    *, *::before, *::after { 
      box-sizing: border-box !important; 
      --background: #ffffff !important;
      --foreground: #0f172a !important;
      --card: #ffffff !important;
      --card-foreground: #0f172a !important;
      --popover: #ffffff !important;
      --popover-foreground: #0f172a !important;
      --primary: #2563eb !important;
      --primary-foreground: #ffffff !important;
      --secondary: #f1f5f9 !important;
      --secondary-foreground: #0f172a !important;
      --muted: #f1f5f9 !important;
      --muted-foreground: #64748b !important;
      --accent: #f1f5f9 !important;
      --accent-foreground: #0f172a !important;
      --destructive: #ef4444 !important;
      --destructive-foreground: #ffffff !important;
      --border: #e2e8f0 !important;
      --input: #e2e8f0 !important;
      --ring: #2563eb !important;
      --radius: 0.5rem !important;
      
      /* Tailwind 4 specific fallback variables */
      --color-primary: #2563eb !important;
      --color-secondary: #f1f5f9 !important;
      --color-background: #ffffff !important;
      --color-foreground: #0f172a !important;
    }

    /* ── Root reset ── */
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: ${A4_W_PX}px !important;
      height: ${A4_H_PX}px !important;
      overflow: hidden !important;
      background: white !important;
    }

    /* ── Certificate container: exact A4 landscape, flush to edges ── */
    .certificate-container {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: ${A4_W_PX}px !important;
      height: ${A4_H_PX}px !important;
      margin: 0 !important;
      padding: 0 !important;
      transform: none !important;
      zoom: 1 !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      overflow: hidden !important;
      display: block !important;
    }

    /* ── Kill any wrapper centering or viewport min-heights ── */
    .certificate-wrapper, [class*="wrapper"] {
      display: block !important;
      min-height: 0 !important;
      height: auto !important;
      margin: 0 !important;
      padding: 0 !important;
      justify-content: unset !important;
      align-items: unset !important;
    }

    @media print {
      @page { size: landscape; margin: 0; }
      body { margin: 0; }
      .certificate-container { page-break-after: avoid; }
    }
  `
  clonedDoc.head.appendChild(s)
}

/**
 * Generates a pixel-perfect A4-landscape PDF from any HTML element.
 *
 * Strategy:
 *   1. Force the element to A4 landscape pixels (1123 × 794) before capture.
 *   2. Capture with html2canvas at 2× for retina-quality output.
 *   3. Create a jsPDF in pixel units sized exactly to A4 landscape.
 *   4. Add the image at (0, 0) filling the entire page — zero margin.
 */
export const generatePDF = async (
  element: HTMLElement,
  filename: string = "certificate.pdf"
): Promise<boolean | Blob> => {
  try {
    // Temporarily override element dimensions so html2canvas captures A4 exactly
    const originalWidth  = element.style.width
    const originalHeight = element.style.height
    const originalTransform = element.style.transform
    const originalPosition  = element.style.position

    element.style.width     = `${A4_W_PX}px`
    element.style.height    = `${A4_H_PX}px`
    element.style.transform = "none"
    element.style.position  = "relative"

    const canvas = await html2canvas(element, {
      scale: 2,           // 2× → 2246 × 1588 pixel canvas, ultra-sharp
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: A4_W_PX,
      height: A4_H_PX,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc, clonedEl) => {
        // Step 1: kill oklch() in all <style> tags
        sanitizeOklch(clonedDoc)
        // Step 2: inject safe variables + layout lock
        injectSafeStyles(clonedDoc)

        // Step 3: force the specific cloned element to exact A4 size
        const el = clonedEl as HTMLElement
        el.style.width     = `${A4_W_PX}px`
        el.style.height    = `${A4_H_PX}px`
        el.style.transform = "none"
        el.style.margin    = "0"
        el.style.padding   = "0"
        el.style.boxShadow = "none"
        el.style.position  = "absolute"
        el.style.top       = "0"
        el.style.left      = "0"
        el.style.display   = "block"
      },
    })

    // Restore original element styles
    element.style.width     = originalWidth
    element.style.height    = originalHeight
    element.style.transform = originalTransform
    element.style.position  = originalPosition

    const imgData = canvas.toDataURL("image/png", 1.0)

    // Use pixel units so the PDF page is EXACTLY 1123 × 794 px
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [A4_W_PX, A4_H_PX],
      hotfixes: ["px_scaling"],
      compress: true,
    })

    // Add image at (0, 0) spanning the full page — zero margin
    pdf.addImage(imgData, "PNG", 0, 0, A4_W_PX, A4_H_PX, undefined, "FAST")

    if (filename === "blob") {
      return pdf.output("blob")
    }

    pdf.save(filename)
    return true
  } catch (error) {
    console.error("PDF generation failed:", error)
    return false
  }
}

/**
 * Captures the certificate element as a high-resolution PNG and triggers a download.
 * Uses the same oklch sanitization and A4-pixel-lock as generatePDF.
 *
 * @param element  The certificate HTML element (same ref used for PDF)
 * @param filename Output filename, e.g. "Certificate_JS221892.png"
 */
export const generateImage = async (
  element: HTMLElement,
  filename: string = "certificate.png"
): Promise<boolean> => {
  try {
    const originalWidth     = element.style.width
    const originalHeight    = element.style.height
    const originalTransform = element.style.transform
    const originalPosition  = element.style.position

    element.style.width     = `${A4_W_PX}px`
    element.style.height    = `${A4_H_PX}px`
    element.style.transform = "none"
    element.style.position  = "relative"

    const canvas = await html2canvas(element, {
      scale: 3,            // 3× → ~3369 × 2382 px — high enough for sharp prints
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: A4_W_PX,
      height: A4_H_PX,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc, clonedEl) => {
        sanitizeOklch(clonedDoc)
        injectSafeStyles(clonedDoc)

        const el = clonedEl as HTMLElement
        el.style.width     = `${A4_W_PX}px`
        el.style.height    = `${A4_H_PX}px`
        el.style.transform = "none"
        el.style.margin    = "0"
        el.style.padding   = "0"
        el.style.boxShadow = "none"
        el.style.position  = "absolute"
        el.style.top       = "0"
        el.style.left      = "0"
        el.style.display   = "block"
      },
    })

    // Restore
    element.style.width     = originalWidth
    element.style.height    = originalHeight
    element.style.transform = originalTransform
    element.style.position  = originalPosition

    // Trigger browser download
    const link = document.createElement("a")
    link.download = filename
    link.href = canvas.toDataURL("image/png", 1.0)
    link.click()

    return true
  } catch (error) {
    console.error("Image generation failed:", error)
    return false
  }
}

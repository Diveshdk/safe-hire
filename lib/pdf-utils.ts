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
  clonedDoc.querySelectorAll("style").forEach((tag) => {
    if (tag.textContent?.includes("oklch")) {
      tag.textContent = tag.textContent.replace(/oklch\([^)]+\)/g, "#000000")
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
    *, *::before, *::after { box-sizing: border-box !important; }

    /* ── ShadCN / Tailwind 4 CSS variable reset ── */
    :root {
      --background: #ffffff;
      --foreground: #0f172a;
      --card: #ffffff;
      --card-foreground: #0f172a;
      --popover: #ffffff;
      --popover-foreground: #0f172a;
      --primary: #2563eb;
      --primary-foreground: #ffffff;
      --secondary: #f1f5f9;
      --secondary-foreground: #0f172a;
      --muted: #f1f5f9;
      --muted-foreground: #64748b;
      --accent: #f1f5f9;
      --accent-foreground: #0f172a;
      --destructive: #ef4444;
      --destructive-foreground: #ffffff;
      --border: #e2e8f0;
      --input: #e2e8f0;
      --ring: #2563eb;
      --radius: 0.5rem;
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

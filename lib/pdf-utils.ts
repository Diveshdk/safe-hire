import { toPng } from "html-to-image"
import jsPDF from "jspdf"

// A4 landscape in pixels at 96dpi  →  1123 × 794
const A4_W_PX = 1123
const A4_H_PX = 794

/**
 * Generates a pixel-perfect A4-landscape PDF from an HTML element.
 * Uses html-to-image which supports modern CSS like oklch().
 */
export const generatePDF = async (
  element: HTMLElement,
  filename: string = "certificate.pdf"
): Promise<boolean | Blob> => {
  try {
    // 1. Capture the element as a high-res PNG (2x scale)
    const dataUrl = await toPng(element, {
      pixelRatio: 2,
      width: A4_W_PX,
      height: A4_H_PX,
      backgroundColor: "#ffffff",
      style: {
        transform: "none",
        margin: "0",
        padding: "0",
        boxShadow: "none",
        borderRadius: "0",
      }
    })

    // 2. Create jsPDF in pixel units
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [A4_W_PX, A4_H_PX],
      hotfixes: ["px_scaling"],
      compress: true,
    })

    // 3. Add image filling the entire page
    pdf.addImage(dataUrl, "PNG", 0, 0, A4_W_PX, A4_H_PX, undefined, "FAST")

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
 * Captures the certificate as a high-resolution PNG and triggers a download.
 * Uses html-to-image for native browser support of modern CSS (oklch, etc).
 */
export const generateImage = async (
  element: HTMLElement,
  filename: string = "certificate.png"
): Promise<boolean> => {
  try {
    // Capture at 3x for ultra-sharp output
    const dataUrl = await toPng(element, {
      pixelRatio: 3,
      width: A4_W_PX,
      height: A4_H_PX,
      backgroundColor: "#ffffff",
      style: {
        transform: "none",
        margin: "0",
        padding: "0",
        boxShadow: "none",
        borderRadius: "0",
      }
    })

    // Trigger download
    const link = document.createElement("a")
    link.download = filename
    link.href = dataUrl
    link.click()

    return true
  } catch (error) {
    console.error("Image generation failed:", error)
    return false
  }
}

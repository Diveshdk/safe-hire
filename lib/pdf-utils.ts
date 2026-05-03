import { toPng } from "html-to-image"
import jsPDF from "jspdf"

// A4 landscape in pixels at 96dpi  →  1123 × 794
const A4_W_PX = 1123
const A4_H_PX = 794

// The certificate is designed at 1000x707px
const CERT_W = 1000
const CERT_H = 707

export const generatePDF = async (
  element: HTMLElement,
  filename: string = "certificate.pdf"
): Promise<boolean | Blob> => {
  try {
    // Capture at the certificate's native design size to avoid gaps
    const dataUrl = await toPng(element, {
      pixelRatio: 3, // High-res capture
      width: CERT_W,
      height: CERT_H,
      backgroundColor: "#ffffff",
      style: {
        transform: "none",
        width: `${CERT_W}px`,
        height: `${CERT_H}px`,
        margin: "0",
        // Do NOT override padding here as it's part of the certificate design (e.g. p-12)
        boxShadow: "none",
        borderRadius: "0",
      }
    })

    // Setup PDF at A4 dimensions
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [A4_W_PX, A4_H_PX],
      hotfixes: ["px_scaling"],
      compress: true,
    })

    // Scale the 1000x707 image to fill the 1123x794 page exactly
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

export const generateImage = async (
  element: HTMLElement,
  filename: string = "certificate.png"
): Promise<boolean> => {
  try {
    const dataUrl = await toPng(element, {
      pixelRatio: 4, // Extra sharp for image downloads
      width: CERT_W,
      height: CERT_H,
      backgroundColor: "#ffffff",
      style: {
        transform: "none",
        width: `${CERT_W}px`,
        height: `${CERT_H}px`,
        margin: "0",
        boxShadow: "none",
        borderRadius: "0",
      }
    })

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

import html2canvas from "html2canvas"
import jsPDF from "jspdf"

// Safe hex overrides for all Tailwind CSS custom properties that resolve to oklch()
const SAFE_CSS_VARS = `
  :root, * {
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
    --chart-1: #2563eb !important;
    --chart-2: #16a34a !important;
    --chart-3: #d97706 !important;
    --chart-4: #9333ea !important;
    --chart-5: #ef4444 !important;
    --sidebar: #f8fafc !important;
    --sidebar-foreground: #0f172a !important;
    --sidebar-primary: #2563eb !important;
    --sidebar-primary-foreground: #ffffff !important;
    --sidebar-accent: #f1f5f9 !important;
    --sidebar-accent-foreground: #0f172a !important;
    --sidebar-border: #e2e8f0 !important;
    --sidebar-ring: #2563eb !important;
  }
`

/**
 * Generates an A4-landscape PDF from an HTML element.
 * Injects safe CSS variable overrides into the cloned document to fix oklch() crashes in html2canvas.
 *
 * @param element  The HTML element to capture (the certificate div)
 * @param filename Filename for the saved PDF
 */
export const generatePDF = async (
  element: HTMLElement,
  filename: string = "certificate.pdf"
) => {
  try {
    // 1. Create a canvas with high scale for high resolution
    const canvas = await html2canvas(element, {
      scale: 3, // Increased scale for retina-quality output
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: "#ffffff",
      // Important for centering: ensure the capture window matches design dimensions
      width: 1000,
      height: 707,
      onclone: (clonedDoc, clonedElement) => {
        // Inject a <style> tag into the cloned document's <head>
        // This overrides all oklch-based CSS custom properties BEFORE html2canvas renders
        const style = clonedDoc.createElement("style")
        style.textContent = SAFE_CSS_VARS
        clonedDoc.head.appendChild(style)

        // Force the cloned element to be exactly 1000x707 with no scaling or margins
        // This ensures the canvas capture is pixel-perfect to our design
        if (clonedElement instanceof HTMLElement) {
           clonedElement.style.width = "1000px"
           clonedElement.style.height = "707px"
           clonedElement.style.transform = "none"
           clonedElement.style.margin = "0"
           clonedElement.style.padding = "0"
        }
      },
    })

    const imgData = canvas.toDataURL("image/png", 1.0)

    // A4 landscape: 297mm × 210mm
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
      compress: true
    })

    const pageW = pdf.internal.pageSize.getWidth()   // 297
    const pageH = pdf.internal.pageSize.getHeight()  // 210

    // Fill the page entirely as our ratio 1000/707 matches A4 (sqrt(2))
    pdf.addImage(imgData, "PNG", 0, 0, pageW, pageH, undefined, 'FAST')
    
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


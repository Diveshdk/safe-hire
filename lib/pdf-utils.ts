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
 * Optimized for high-resolution certificates with zero margins.
 */
export const generatePDF = async (
  element: HTMLElement,
  filename: string = "certificate.pdf"
) => {
  try {
    // 1. Capture at high scale (3x) for crisp text/logos
    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: "#ffffff",
      // Force exact dimensions to prevent responsive scaling issues
      width: 1000,
      height: 707,
      onclone: (clonedDoc, clonedElement) => {
        // Inject safe CSS variables for oklch support
        const style = clonedDoc.createElement("style")
        style.textContent = SAFE_CSS_VARS + `
          /* Remove shadows and transforms that interfere with capture */
          .certificate-container { 
            transform: none !important; 
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        `
        clonedDoc.head.appendChild(style)
        
        // Ensure the cloned element itself has no transform or shadow
        const target = clonedElement as HTMLElement
        target.style.transform = "none"
        target.style.boxShadow = "none"
        target.style.margin = "0"
        target.style.position = "relative"
      },
    })

    const imgData = canvas.toDataURL("image/png", 1.0)

    // 2. Setup A4 landscape PDF (297mm x 210mm)
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
      compress: true
    })

    // 3. Fill the entire page (0 margin)
    // A4 Landscape: 297 x 210
    pdf.addImage(imgData, "PNG", 0, 0, 297, 210, undefined, 'FAST')
    
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

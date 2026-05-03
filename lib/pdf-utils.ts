import html2canvas from "html2canvas"
import jsPDF from "jspdf"


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
        // 1. Sanitize all <style> tags in the cloned document to remove oklch() calls
        // This is critical because html2canvas crashes on any oklch() function
        const styleTags = Array.from(clonedDoc.querySelectorAll("style"))
        styleTags.forEach((styleTag) => {
          if (styleTag.textContent?.includes("oklch")) {
            // Replace oklch with black or a neutral color to prevent parsing errors
            styleTag.textContent = styleTag.textContent.replace(/oklch\([^)]+\)/g, "#000000")
          }
        })

        // 2. Remove all <link> tags that might point to oklch-heavy CSS (like Tailwind 4)
        // and replace them with a simplified style if we're in the clone.
        // NOTE: This might strip some styles, but it's better than a crash.
        // We rely on the inline styles we inject below for core layout.
        
        // 3. Inject safe CSS variables for all common Tailwind/Shadcn UI properties
        const style = clonedDoc.createElement("style")
        style.textContent = `
          :root, * {
            --background: 0 0% 100% !important;
            --foreground: 222.2 84% 4.9% !important;
            --card: 0 0% 100% !important;
            --card-foreground: 222.2 84% 4.9% !important;
            --popover: 0 0% 100% !important;
            --popover-foreground: 222.2 84% 4.9% !important;
            --primary: 221.2 83.2% 53.3% !important;
            --primary-foreground: 210 40% 98% !important;
            --secondary: 210 40% 96.1% !important;
            --secondary-foreground: 222.2 47.4% 11.2% !important;
            --muted: 210 40% 96.1% !important;
            --muted-foreground: 215.4 16.3% 46.9% !important;
            --accent: 210 40% 96.1% !important;
            --accent-foreground: 222.2 47.4% 11.2% !important;
            --destructive: 0 84.2% 60.2% !important;
            --destructive-foreground: 210 40% 98% !important;
            --border: 214.3 31.8% 91.4% !important;
            --input: 214.3 31.8% 91.4% !important;
            --ring: 221.2 83.2% 53.3% !important;
            
            /* Fallbacks for Tailwind 4 specific vars if any */
            --color-background: white !important;
            --color-foreground: black !important;
          }
          
          /* Remove shadows and transforms that interfere with capture */
          .certificate-container { 
            transform: none !important; 
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
        `
        clonedDoc.head.appendChild(style)
        
        // Ensure the cloned element itself has no transform or shadow
        const target = clonedElement as HTMLElement
        target.style.transform = "none"
        target.style.boxShadow = "none"
        target.style.margin = "0"
        target.style.position = "relative"
        target.style.display = "block"
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

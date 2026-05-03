"use client"

import React, { useRef, useState } from "react"
import { CertificateViewer, CertificateDesignConfig } from "@/components/dashboard/certificate-viewer"
import { Button } from "@/components/ui/button"
import { Download, ShieldCheck, Printer, Share2, Loader2, FileText } from "lucide-react"
// import { generatePDF } from "@/lib/pdf-utils" // Temporarily disabled due to html2canvas oklch crash
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface VerificationClientProps {
  certificate: any
}

export function VerificationClient({ certificate }: VerificationClientProps) {
  const certificateRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  
  // Build the verification URL from the hash (safe for SSR)
  const verificationUrl = typeof window !== "undefined"
    ? window.location.href
    : `${process.env.NEXT_PUBLIC_APP_URL || "https://safe-hire.vercel.app"}/verify/certificate/${certificate.verification_hash}`

  // Extract design config if it exists, otherwise fall back to a default "classic" one
  const designConfig: CertificateDesignConfig = certificate.metadata?.design_config || {
    template_id: "classic",
    organization_name: certificate.issued_by_org || certificate.issued_by,
    title: certificate.title,
    purpose: certificate.description,
    recipient_name: certificate.recipient_name,
    recipient_rank: certificate.certificate_type === "winner" ? "Winner" : "Participant",
    date: certificate.issued_at
      ? new Date(certificate.issued_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    safe_hire_id: certificate.recipient_safe_hire_id,
    signatories: [
      { name: certificate.issued_by, designation: "Authorized Signatory" }
    ],
    verification_url: verificationUrl
  }

  /**
   * Generates and downloads a high-quality PDF using a perfected Print-to-PDF method.
   * This avoids html2canvas oklch() crashes while ensuring zero margins.
   */
  const handleDownload = async () => {
    if (!certificateRef.current) return
    setIsDownloading(true)

    try {
      // Collect all styles to ensure perfect rendering in the print window
      const styleLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .map((el) => el.outerHTML)
        .join("\n")
      const inlineStyles = Array.from(document.querySelectorAll("style"))
        .map((el) => `<style>${el.innerHTML}</style>`)
        .join("\n")

      // We clone the certificate and strip the 'transform' so it renders at 1:1 scale
      const certClone = certificateRef.current.cloneNode(true) as HTMLElement
      certClone.style.transform = "none"
      certClone.style.boxShadow = "none"
      certClone.style.width = "100%"
      certClone.style.height = "100%"
      certClone.style.margin = "0"
      certClone.style.position = "absolute"
      certClone.style.top = "0"
      certClone.style.left = "0"
      
      const printWindow = window.open("", "_blank", "width=1200,height=900")
      if (!printWindow) {
        alert("Please allow pop-ups to download the PDF, then try again.")
        setIsDownloading(false)
        return
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Certificate – ${certificate.recipient_safe_hire_id}</title>
            ${styleLinks}
            ${inlineStyles}
            <style>
              @page { 
                size: A4 landscape; 
                margin: 0; 
              }
              @media print {
                body { margin: 0; padding: 0; }
                html, body {
                  width: 297mm;
                  height: 210mm;
                  overflow: hidden;
                }
              }
              html, body {
                margin: 0; padding: 0;
                width: 100%; height: 100%;
                background: white;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              /* Target the certificate container precisely */
              .certificate-container {
                width: 297mm !important;
                height: 210mm !important;
                transform: none !important;
                box-shadow: none !important;
                border-radius: 0 !important;
              }
            </style>
          </head>
          <body>
            ${certClone.outerHTML}
            <script>
              // Wait for all images and fonts to load before triggering print
              window.onload = () => {
                setTimeout(() => {
                  window.focus();
                  window.print();
                  window.onafterprint = () => window.close();
                }, 1000);
              };
            </script>
          </body>
        </html>
      `)
      printWindow.document.close()
    } catch (error) {
      console.error("Download failed:", error)
      alert("Something went wrong. Please try 'Print Certificate' directly.")
    } finally {
      setIsDownloading(false)
    }
  }

  const handlePrint = () => {
    // For printing, we still use the browser's native print as it's better for physical printers
    window.print()
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `SafeHire Certificate: ${certificate.title}`,
        text: `Check out this verified certificate for ${certificate.recipient_name}!`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert("Verification link copied to clipboard!")
    }
  }

  return (
    <div className="max-w-6xl w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Certificate Display */}
        <div className="flex-1 w-full space-y-6">
          <div className="overflow-x-auto rounded-xl shadow-2xl border bg-card">
            <div className="min-w-[800px]">
              <CertificateViewer config={designConfig} containerRef={certificateRef} />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              size="lg"
              onClick={handleDownload}
              disabled={isDownloading}
              className="shadow-lg hover:shadow-xl transition-shadow bg-primary hover:bg-primary/90"
            >
              {isDownloading ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Download className="h-5 w-5 mr-2" />
              )}
              {isDownloading ? "Preparing PDF…" : "Download Official PDF"}
            </Button>
            <Button size="lg" variant="outline" onClick={handlePrint}>
              <Printer className="h-5 w-5 mr-2" />
              Print Certificate
            </Button>
            <Button size="lg" variant="ghost" onClick={handleShare}>
              <Share2 className="h-5 w-5 mr-2" />
              Share Verification Link
            </Button>
          </div>
        </div>

        {/* Verification Sidebar */}
        <div className="w-full lg:w-80 space-y-4">
          <Card className="border-green-500/20 bg-green-500/5 shadow-none overflow-hidden">
            <div className="h-1 bg-green-500/30" />
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <ShieldCheck className="h-5 w-5" />
                <span className="font-bold text-sm tracking-tight uppercase">Authentic Record</span>
              </div>
              <CardTitle className="text-xl">Verification Status</CardTitle>
              <CardDescription>Digitally signed via SafeHire System</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-white/60 rounded border border-green-500/10 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">SafeHire ID</p>
                <code className="text-sm font-mono font-black">{certificate.recipient_safe_hire_id}</code>
              </div>
              
              <div className="p-3 bg-white/60 rounded border border-green-500/10 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Verification Hash</p>
                <p className="text-[10px] font-mono break-all text-muted-foreground leading-relaxed">
                  {certificate.verification_hash}
                </p>
              </div>

              <div className="pt-4 border-t border-green-500/10">
                <p className="text-xs text-muted-foreground leading-relaxed italic">
                  This document's integrity has been verified using SHA-256 cryptographic hashing. The data above was fetched directly from our secure servers.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/10 border-muted-foreground/10">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">About the Issuer</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 px-4 space-y-2">
              <p className="text-sm font-bold">{certificate.issued_by_org || certificate.issued_by}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className="bg-primary/5 text-primary/80 border-primary/10">
                  Trusted Organization
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="text-center pb-12">
        <p className="text-sm text-muted-foreground opacity-50">
          SafeHire &copy; 2026 &bull; Secure Digital Verification Platform
        </p>
      </div>
    </div>
  )
}

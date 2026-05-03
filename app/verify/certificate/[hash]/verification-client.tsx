"use client"

import React, { useRef, useState } from "react"
import { CertificateViewer, CertificateDesignConfig } from "@/components/dashboard/certificate-viewer"
import { Button } from "@/components/ui/button"
import { Download, ShieldCheck, Printer, Share2, Loader2, ImageDown } from "lucide-react"
import { generatePDF, generateImage } from "@/lib/pdf-utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface VerificationClientProps {
  certificate: any
}

export function VerificationClient({ certificate }: VerificationClientProps) {
  const certificateRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDownloadingImage, setIsDownloadingImage] = useState(false)
  
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
   * Generates a pixel-perfect A4-landscape PDF and downloads it directly.
   * Uses html2canvas at 2× scale + jsPDF in pixel units — no print popup needed.
   */
  const handleDownload = async () => {
    if (!certificateRef.current) return
    setIsDownloading(true)
    try {
      const fileName = `Certificate_${certificate.recipient_safe_hire_id || "SafeHire"}.pdf`
      const result = await generatePDF(certificateRef.current, fileName)
      if (!result) throw new Error("generatePDF returned false")
    } catch (error) {
      console.error("Download failed:", error)
      alert("Could not generate PDF. Please try the 'Print Certificate' option.")
    } finally {
      setIsDownloading(false)
    }
  }

  const handlePrint = () => {
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

  /**
   * Captures the certificate as a high-resolution PNG and triggers a direct download.
   */
  const handleDownloadImage = async () => {
    if (!certificateRef.current) return
    setIsDownloadingImage(true)
    try {
      const fileName = `Certificate_${certificate.recipient_safe_hire_id || "SafeHire"}.png`
      const result = await generateImage(certificateRef.current, fileName)
      if (!result) throw new Error("generateImage returned false")
    } catch (error) {
      console.error("Image download failed:", error)
      alert("Could not generate image. Please try again.")
    } finally {
      setIsDownloadingImage(false)
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
              {isDownloading ? "Preparing PDF…" : "Download PDF"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleDownloadImage}
              disabled={isDownloadingImage}
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              {isDownloadingImage ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <ImageDown className="h-5 w-5 mr-2" />
              )}
              {isDownloadingImage ? "Saving Image…" : "Download as Image"}
            </Button>
            <Button size="lg" variant="outline" onClick={handlePrint}>
              <Printer className="h-5 w-5 mr-2" />
              Print
            </Button>
            <Button size="lg" variant="ghost" onClick={handleShare}>
              <Share2 className="h-5 w-5 mr-2" />
              Share
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

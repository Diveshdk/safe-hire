"use client"

import React from "react"
import { QRCodeSVG } from "qrcode.react"
import { cn } from "@/lib/utils"

export interface Signatory {
  name: string
  designation: string
  signature_url?: string
}

export interface CertificateDesignConfig {
  template_id: "classic" | "modern" | "premium" | "academic"
  organization_name: string
  logos?: string[]
  title: string
  purpose: string
  recipient_name: string
  recipient_rank?: string
  date: string
  safe_hire_id: string
  signatories: Signatory[]
  verification_url?: string
}

interface CertificateViewerProps {
  config: CertificateDesignConfig
  containerRef?: React.RefObject<HTMLDivElement>
}

export function CertificateViewer({ config, containerRef }: CertificateViewerProps) {
  const {
    template_id,
    organization_name,
    logos = [],
    title,
    purpose,
    recipient_name,
    recipient_rank,
    date,
    safe_hire_id,
    signatories,
    verification_url,
  } = config

  const renderLogo = (url: string, index: number) => (
    <img key={index} src={url} alt={`Logo ${index + 1}`} className="h-16 w-auto object-contain mx-2" />
  )

  const renderSignatory = (sig: Signatory, index: number) => (
    <div key={index} className="flex flex-col items-center text-center px-4 min-w-[150px]">
      <div className="h-12 flex items-end mb-2">
        {sig.signature_url ? (
          <img src={sig.signature_url} alt={`Signature of ${sig.name}`} className="max-h-full w-auto" />
        ) : (
          <div className="border-b border-muted-foreground w-full pb-1 italic font-serif text-sm opacity-50">
            Digital Signature
          </div>
        )}
      </div>
      <div className="h-px w-full bg-muted-foreground mb-2" />
      <span className="font-bold text-sm uppercase tracking-wider">{sig.name}</span>
      <span className="text-xs text-muted-foreground">{sig.designation}</span>
    </div>
  )

  // Template Styles
  const templates = {
    classic: {
      container: "bg-white border-[12px] border-double border-amber-800 p-12 font-serif text-slate-900",
      header: "flex flex-col items-center mb-8",
      title: "text-5xl font-bold uppercase tracking-tighter text-amber-900 mb-4",
      recipient: "text-4xl font-bold border-b-2 border-amber-900/30 px-8 pb-1 inline-block italic",
      accent: "text-amber-800",
      qr: "border-2 border-amber-800 p-1",
    },
    modern: {
      container: "bg-slate-50 border-r-[24px] border-primary p-10 font-sans text-slate-800 relative overflow-hidden",
      header: "flex justify-between items-start mb-8",
      title: "text-4xl font-black uppercase tracking-tight text-primary mb-2 leading-tight",
      recipient: "text-3xl font-light text-slate-900 mb-3",
      accent: "text-primary",
      qr: "rounded-lg border-4 border-white shadow-sm",
    },
    premium: {
      container: "bg-slate-950 border-[2px] border-amber-500/50 p-16 font-serif text-amber-50 relative",
      header: "flex flex-col items-center mb-10",
      title: "text-6xl font-bold uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-500 mb-6",
      recipient: "text-5xl font-bold text-amber-100 underline decoration-amber-500/30 underline-offset-8",
      accent: "text-amber-400",
      qr: "border-2 border-amber-500/30 p-2 bg-amber-50 rounded-xs",
    },
    academic: {
      container: "bg-[#fdfcf0] border-4 border-[#1a365d] p-16 font-mono text-slate-900",
      header: "flex flex-col items-center mb-10 pb-6 border-b-2 border-[#1a365d]/20",
      title: "text-4xl font-bold uppercase text-[#1a365d] mb-4",
      recipient: "text-4xl font-bold text-[#1a365d] bg-white/50 px-6 py-2 rounded border border-[#1a365d]/10",
      accent: "text-[#1a365d]",
      qr: "border-2 border-[#1a365d] p-1",
    },
  }

  const style = templates[template_id]

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative w-full shadow-2xl transition-all duration-500 select-none overflow-hidden",
        style.container
      )}
      style={{ minWidth: "800px", minHeight: "566px" }}
    >
      {/* Background Accents for Modern */}
      {template_id === "modern" && (
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-0" />
      )}

      <div className="relative z-10 flex flex-col h-full gap-6">
        {/* Header Section */}
        <div className={style.header}>
          {template_id === "modern" ? (
            // Modern: left-aligned title block + org name as right accent
            <>
              <div className="flex-1 pr-8">
                {logos.length > 0 && (
                  <div className="flex items-center mb-4">
                    {logos.map((url, idx) => renderLogo(url, idx))}
                  </div>
                )}
                <h1 className={style.title}>{title || "Certificate"}</h1>
                <p className="text-sm uppercase tracking-[0.3em] opacity-60 font-medium mt-1">{organization_name}</p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="px-4 py-2 border-2 border-primary/20 rounded text-right">
                  <p className="text-[10px] uppercase tracking-widest opacity-50 font-bold">Issued By</p>
                  <p className="text-sm font-bold text-primary">{organization_name}</p>
                </div>
              </div>
            </>
          ) : (
            // Classic / Premium / Academic: fully centered
            <>
              {logos.length > 0 && (
                <div className="flex items-center mb-6 justify-center">
                  {logos.map((url, idx) => renderLogo(url, idx))}
                </div>
              )}
              <h1 className={cn(style.title, "text-center w-full")}>{title || "Certificate"}</h1>
              <p className="text-xl uppercase tracking-widest opacity-80 text-center w-full">{organization_name}</p>
            </>
          )}
        </div>

        {/* Content Section */}
        <div className="text-center flex flex-col items-center gap-4">
          <p className="text-lg italic opacity-70">This is to certify that</p>
          <h2 className={style.recipient}>{recipient_name || "[RECIPIENT NAME]"}</h2>
          {recipient_rank && (
            <p className="text-xl font-medium tracking-wide">
              as <span className={style.accent}>{recipient_rank}</span>
            </p>
          )}
          <div className="max-w-2xl mx-auto mt-4">
            <p className="text-lg leading-relaxed">{purpose}</p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex items-end justify-between mt-auto pt-8">
          {/* QR Code & ID */}
          <div className="flex items-center gap-4">
            {verification_url ? (
              <div className={style.qr}>
                <QRCodeSVG value={verification_url} size={80} level="H" />
              </div>
            ) : (
              <div className={cn(style.qr, "w-20 h-20 bg-muted/20 flex items-center justify-center text-[10px] text-center p-2 opacity-50")}>
                QR Code Preview
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-tighter opacity-60">Verification ID</span>
              <code className="text-sm font-mono font-bold">{safe_hire_id}</code>
              <span className="text-[10px] mt-1 opacity-60">{date}</span>
            </div>
          </div>

          {/* Signatories */}
          <div className="flex items-end gap-2">
            {signatories.map((sig, idx) => renderSignatory(sig, idx))}
          </div>
        </div>
      </div>
      
      {/* SafeHire Branding */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1.5 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
        <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full" />
        </div>
        <span className="text-[10px] font-bold tracking-tighter">SAFEHIRE VERIFIED</span>
      </div>
    </div>
  )
}

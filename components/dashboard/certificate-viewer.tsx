"use client"

import React from "react"
import { QRCodeSVG } from "qrcode.react"
import { cn } from "@/lib/utils"

export interface Signatory {
  name: string
  designation: string
  signature_url?: string
}

export interface RecipientNameStyle {
  weight?: string
  underline?: boolean
  size?: string
}

export interface CertificateDesignConfig {
  template_id: "classic" | "modern" | "premium" | "academic"
  organization_name: string
  logos?: string[]
  logo_count?: number // 1-4
  header_lines?: string[]
  title: string
  static_text?: string // e.g. "THIS IS TO CERTIFY THAT"
  purpose?: string // used as fallback for body_template
  body_template?: string // supports {Full Name}, {Position}, {Event Name}, {Date}
  recipient_name: string
  recipient_rank?: string
  recipient_name_style?: RecipientNameStyle
  date: string
  safe_hire_id: string
  signatories: Signatory[]
  verification_url?: string
}

interface CertificateViewerProps {
  config: CertificateDesignConfig
  containerRef?: React.RefObject<HTMLDivElement>
}

// Helper to replace dynamic variables
const replaceVariables = (text: string, config: CertificateDesignConfig) => {
  if (!text) return ""
  return text
    .replace(/{Full Name}/g, config.recipient_name)
    .replace(/{recipient_name}/g, config.recipient_name)
    .replace(/{Position}/g, config.recipient_rank || "")
    .replace(/{recipient_rank}/g, config.recipient_rank || "")
    .replace(/{Event Name}/g, config.organization_name) // Fallback or context-aware
    .replace(/{Date}/g, config.date)
}

export function CertificateViewer({ config, containerRef }: CertificateViewerProps) {
  const {
    template_id,
    organization_name,
    logos = [],
    logo_count = 1,
    header_lines = [],
    title,
    static_text = "This is to certify that",
    body_template,
    purpose,
    recipient_name,
    recipient_rank,
    recipient_name_style,
    date,
    safe_hire_id,
    signatories,
    verification_url,
  } = config

  const finalBodyContent = replaceVariables(body_template || purpose || "", config)

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
      org: "text-3xl font-black uppercase tracking-[0.2em] text-amber-900/90",
      title: "text-5xl font-bold uppercase tracking-tighter text-amber-900 drop-shadow-sm",
      recipient: "text-4xl font-bold border-b-2 border-amber-900/30 px-8 pb-1 inline-block italic",
      accent: "text-amber-800",
      qr: "border-2 border-amber-800 p-1",
    },
    modern: {
      container: "bg-white border-r-[32px] border-[#0f172a] p-12 font-sans text-slate-800 relative overflow-hidden",
      header: "flex flex-col items-center mb-10 w-full",
      org: "text-2xl font-black uppercase tracking-tight text-slate-900 mb-1",
      title: "text-5xl font-black uppercase tracking-tighter text-[#1e40af] drop-shadow-md",
      recipient: "text-4xl font-light text-slate-900 mb-4 tracking-tight",
      accent: "text-[#1e40af]",
      qr: "rounded-lg border-4 border-white shadow-md",
    },
    premium: {
      container: "bg-slate-950 border-[2px] border-amber-500/50 p-16 font-serif text-amber-50 relative",
      header: "flex flex-col items-center mb-12",
      org: "text-3xl font-bold uppercase tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500",
      title: "text-7xl font-bold uppercase tracking-[0.1em] text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-500/80 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]",
      recipient: "text-6xl font-black text-amber-100 underline decoration-amber-500/30 underline-offset-12 mb-4",
      accent: "text-amber-400",
      qr: "border-2 border-amber-500/30 p-2 bg-amber-50 rounded-xs shadow-[0_0_15px_rgba(245,158,11,0.2)]",
    },
    academic: {
      container: "bg-[#fefce8]/30 border-[4px] border-[#1a365d] p-16 font-serif text-slate-900 shadow-xl",
      header: "flex flex-col items-center mb-12 pb-8 border-b-2 border-[#1a365d]/10 w-full",
      org: "text-3xl font-bold uppercase tracking-widest text-[#1a365d]",
      title: "text-5xl font-bold uppercase text-[#1a365d] opacity-90",
      recipient: "text-5xl font-bold text-[#1a365d] bg-white/40 px-10 py-3 rounded-sm border border-[#1a365d]/5 shadow-inner",
      accent: "text-[#1a365d]",
      qr: "border-2 border-[#1a365d] p-1 bg-white",
    },
  }

  // Helper to render logos based on count
  const renderLogoGrid = () => {
    if (logos.length === 0) return null
    const displayLogos = logos.slice(0, logo_count)
    
    if (logo_count === 1) {
      return (
        <div className="flex justify-center mb-6">
          {renderLogo(displayLogos[0], 0)}
        </div>
      )
    }
    
    if (logo_count === 2) {
      return (
        <div className="flex justify-between items-center w-full grow mb-6 px-8">
          {renderLogo(displayLogos[0], 0)}
          {renderLogo(displayLogos[1], 1)}
        </div>
      )
    }
    
    if (logo_count === 3) {
      return (
        <div className="flex justify-between items-center w-full grow mb-6 px-4">
          {renderLogo(displayLogos[0], 0)}
          {renderLogo(displayLogos[1], 1)}
          {renderLogo(displayLogos[2], 2)}
        </div>
      )
    }
    
    // 4 logos (2x2 or spread)
    return (
      <div className="grid grid-cols-4 gap-4 w-full mb-6 px-4 items-center">
        {displayLogos.map((url, i) => (
          <div key={i} className="flex justify-center">
             {renderLogo(url, i)}
          </div>
        ))}
      </div>
    )
  }

  const renderHeaderLines = () => {
    if (header_lines.length === 0) return null
    return (
       <div className="flex flex-col items-center gap-1 mt-2">
         {header_lines.map((line, i) => (
           <p key={i} className="text-center w-full text-base italic opacity-70">
             {line}
           </p>
         ))}
       </div>
    )
  }

  const style = templates[template_id]

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative w-full shadow-2xl transition-all duration-500 select-none overflow-hidden",
        style.container
      )}
      style={{ minWidth: "1000px", minHeight: "707px" }} // Proper A4 ratio for landscape
    >
      {/* Background Accents for Modern */}
      {template_id === "modern" && (
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-0" />
      )}

      <div className="relative z-10 flex flex-col h-full gap-6">
        {/* Header Section */}
        <div className={cn(style.header, "w-full flex flex-col items-center")}>
          {renderLogoGrid()}
          
          <div className="flex flex-col items-center gap-1 w-full mb-2">
            <p className={cn(
              "text-center w-full",
              style.org
            )}>
              {organization_name}
            </p>
            {renderHeaderLines()}
          </div>

          <h1 className={cn(style.title, "text-center w-full mt-6")}>
            {title || "Certificate"}
          </h1>
        </div>

        {/* Content Section */}
        <div className="text-center flex flex-col items-center gap-4">
          <p className="text-lg italic opacity-70">{static_text}</p>
          <h2 className={cn(
            style.recipient,
            recipient_name_style?.weight && `font-${recipient_name_style.weight}`,
            recipient_name_style?.underline && "underline decoration-2 underline-offset-8",
            recipient_name_style?.size && `text-${recipient_name_style.size}`
          )}>
            {recipient_name || "[RECIPIENT NAME]"}
          </h2>
          {recipient_rank && (
            <p className="text-xl font-medium tracking-wide">
              as <span className={style.accent}>{recipient_rank}</span>
            </p>
          )}
          <div className="max-w-2xl mx-auto mt-4">
            <p className="text-lg leading-relaxed whitespace-pre-wrap">{finalBodyContent}</p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex items-end justify-between mt-auto pt-8">
          {/* QR Code & ID */}
          <div className="flex items-center gap-4">
            {verification_url ? (
              <div className={cn(style.qr, "bg-white overflow-hidden")}>
                <QRCodeSVG 
                  value={verification_url} 
                  size={100} 
                  level="H"
                  includeMargin={true}
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
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
          <div className={cn(
            "flex items-end gap-12",
            signatories.length === 1 ? "justify-center w-full" : 
            signatories.length === 2 ? "justify-between w-full px-20" : 
            "justify-between w-full"
          )}>
            {signatories.map((sig, idx) => renderSignatory(sig, idx))}
          </div>
        </div>
      </div>
      
      {/* SafeHire Branding */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1.5 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
        <div className="w-4 h-4 bg-slate-900 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full" />
        </div>
        <span className="text-[10px] font-bold tracking-tighter text-slate-900">SAFEHIRE VERIFIED</span>
      </div>
    </div>
  )
}

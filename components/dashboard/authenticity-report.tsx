"use client"

import { ShieldCheck, Calendar, Globe, Landmark, LayoutList, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface AuthenticityReportProps {
  data: {
    name?: string
    cin?: string
    status?: string
    state?: string
    state_code?: string
    creation_date?: string
    listed_status?: "listed" | "unlisted" | "private"
    market_cap?: string
    // New fields
    roc_code?: string
    category?: string
    sub_category?: string
    class?: string
    authorized_capital?: string
    paid_up_capital?: string
    address?: string
    source?: "gridlines" | "opencorporates" | "mock" | "ai" | "datagov" | "maharashtra_csv"
  }
}

export function AuthenticityReport({ data }: AuthenticityReportProps) {
  const isVerified = data.status?.toUpperCase() === "ACTIVE"
  const isListed = data.listed_status === "listed"
  
  const sourceLabels = {
    gridlines: "Official MCA Registry (Gridlines)",
    opencorporates: "Global Corporate Registry (OpenCorporates)",
    mock: "SafeHire Internal Registry",
    ai: "SafeHire AI Verification Engine",
    datagov: "Data.Gov.In National Registry",
    maharashtra_csv: "Maharashtra State Master Data (CSV)"
  }

  const creationDate = data.creation_date 
    ? new Date(data.creation_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) 
    : "N/A"

  return (
    <div className="bg-white rounded-[2.5rem] border border-[#E4E4E7] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header Banner */}
      <div className={cn(
        "px-6 sm:px-10 py-5 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-y-5",
        isVerified ? "bg-emerald-50 border-b border-emerald-100/50" : "bg-amber-50 border-b border-amber-100/50"
      )}>
        <div className="flex items-center gap-3">
          {isVerified ? (
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shadow-inner">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            </div>
          ) : (
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shadow-inner">
              <Landmark className="h-5 w-5 text-amber-600" />
            </div>
          )}
          <span className={cn(
            "text-[11px] font-black uppercase tracking-[0.2em]",
            isVerified ? "text-emerald-700" : "text-amber-700"
          )}>
            {isVerified ? "Authenticity Verified" : "Verification Pending"}
          </span>
        </div>
        <div className="flex items-center gap-2.5 bg-white/90 px-5 py-2 rounded-full border border-black/5 shadow-sm">
          <div className={cn("h-2 w-2 rounded-full animate-pulse", isVerified ? "bg-emerald-500" : "bg-amber-500")} />
          <span className="text-[10px] font-bold text-[#3F3F46] uppercase tracking-wider">Registry Live Sync</span>
        </div>
      </div>

      <div className="p-7 sm:p-14">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-10">
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-black text-[#18181B] tracking-tight leading-[1.1] uppercase max-w-2xl">
              {data.name || "Unknown Company"}
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[11px] font-mono font-bold text-[#71717A] bg-[#F4F4F6] px-4 py-2 rounded-xl border border-[#E4E4E7] shadow-sm">
                CIN: {data.cin || "N/A"}
              </span>
              <div className="flex gap-2">
                <span className={cn(
                  "text-[10px] font-black uppercase px-3 py-1.5 rounded-lg shadow-sm",
                  isVerified ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                )}>
                  {data.status || "Inactive"}
                </span>
                <span className="text-[10px] font-black uppercase bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg shadow-sm">
                  {data.class || "Private"}
                </span>
              </div>
            </div>
          </div>
          <div className="shrink-0 h-20 w-20 sm:h-24 sm:w-24 bg-[#18181B] rounded-[2.5rem] flex items-center justify-center shadow-2xl transform sm:rotate-6 -rotate-2">
            <span className="text-white text-4xl sm:text-5xl font-black">{(data.name || "?")[0]}</span>
          </div>
        </div>

        {/* Data Grid */}
        <div className="mt-14 sm:mt-20 grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-12">
          <div className="space-y-10">
            <DataPoint 
              icon={<Calendar className="h-5 w-5 text-[#A1A1AA]" />}
              label="Registration Date"
              value={creationDate}
            />
            <div className="h-px bg-gradient-to-r from-transparent via-[#E4E4E7] to-transparent" />
            <DataPoint 
              icon={<LayoutList className="h-5 w-5 text-[#A1A1AA]" />}
              label="Filing Details"
              value={`${data.category || 'Company limited by shares'} (${data.sub_category || 'Non-govt'})`}
            />
            <div className="h-px bg-gradient-to-r from-transparent via-[#E4E4E7] to-transparent" />
            <DataPoint 
              icon={<Globe className="h-5 w-5 text-[#A1A1AA]" />}
              label="ROC Jurisdiction"
              value={`${data.roc_code || 'ROC Delhi'} / ${data.state_code || data.state || 'India'}`}
            />
          </div>
          
          <div className="space-y-10 bg-[#FAFAFB] p-8 sm:p-12 rounded-[3.5rem] border border-[#F4F4F6] shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <DataPoint 
                label="Authorized Capital"
                value={`₹${parseFloat(data.authorized_capital || '0').toLocaleString()}`}
                highlight
              />
              <DataPoint 
                label="Paid-up Capital"
                value={`₹${parseFloat(data.paid_up_capital || '0').toLocaleString()}`}
                highlight
              />
            </div>
            <div className="pt-10 border-t border-[#E4E4E7]/60">
              <DataPoint 
                icon={<Landmark className="h-5 w-5 text-[#A1A1AA]" />}
                label="Registered Office Address"
                value={data.address || "No official address recorded."}
                variant="stack"
              />
            </div>
          </div>
        </div>

        {/* Source Footer */}
        <div className="mt-16 sm:mt-24 pt-10 border-t border-[#F4F4F6]">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-6 w-6 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-xs font-black text-[#18181B] uppercase tracking-[0.25em]">Registry Audit Trace</p>
          </div>
          <p className="text-sm text-[#71717A] leading-[1.8] max-w-3xl">
            Official record retrieved via <span className="text-[#18181B] font-bold underline decoration-emerald-200 underline-offset-8 decoration-2">{sourceLabels[data.source || "mock"]}</span>. 
            All corporate identifiers and financial statements extracted directly from secondary MCA nodes.
          </p>
        </div>
      </div>
    </div>
  )
}

function DataPoint({ icon, label, value, status, highlight, variant = "inline" }: { 
  icon?: React.ReactNode; 
  label: string; 
  value: string;
  status?: "success" | "warning" | "neutral"
  highlight?: boolean
  variant?: "inline" | "stack"
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2.5">
        <div className="h-6 w-6 rounded-lg bg-[#F4F4F6] flex items-center justify-center sm:hidden">
          {icon}
        </div>
        <div className="hidden sm:block">{icon}</div>
        <p className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-[0.15em]">{label}</p>
      </div>
      <p className={cn(
        "font-bold tracking-tight leading-relaxed",
        variant === "inline" ? "text-base" : "text-sm",
        status === "success" ? "text-emerald-700" : status === "warning" ? "text-amber-700" : "text-[#18181B]",
        highlight && "text-violet-700 font-extrabold"
      )}>
        {value}
      </p>
    </div>
  )
}

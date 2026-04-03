"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Loader2, Building2, CheckCircle2, ShieldCheck, ArrowRight, X, Mail, FileUp, AlertCircle, ScanText } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { AuthenticityReport } from "./authenticity-report"

interface CompanySearchProps {
  hideVerify?: boolean
}

export function CompanySearch({ hideVerify = false }: CompanySearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<any | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [searched, setSearched] = useState(false)
  
  // Verification states
  const [requiresProof, setRequiresProof] = useState(false)
  const [verificationMethod, setVerificationMethod] = useState<"work_email" | "document_ocr" | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [isVerified, setIsVerified] = useState(false)

  const { toast } = useToast()
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length >= 2 && !selected) {
        performSearch()
      } else if (query.trim().length < 2) {
        setResults([])
      }
    }, 400)

    return () => clearTimeout(delayDebounceFn)
  }, [query])

  async function performSearch() {
    if (query.trim().length < 2) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch("/api/company/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: query })
      })
      const data = await res.json()
      if (data.ok) {
        setResults(data.results || [])
      }
    } catch (e) {
      console.error("[Search] error:", e)
    }
    setLoading(false)
  }

  async function handleInitialVerify() {
    if (!selected) return
    setVerifying(true)
    try {
      const res = await fetch("/api/company/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          registrationNumber: selected.cin, 
          name: typeof selected.name === "string" ? selected.name : query,
          demo: false
        })
      })
      const data = await res.json()
      if (data.ok) {
        if (data.requiresProof) {
          setRequiresProof(true)
          toast({ title: "Authorization Required", description: data.message })
        } else {
          setIsVerified(true)
          toast({ title: "✅ Company Verified", description: "Identity link established via work email domain." })
        }
      } else {
        toast({ title: "Verification Error", description: data.message, variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Verification Failed", description: "Could not connect to registry.", variant: "destructive" })
    }
    setVerifying(false)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selected) return
    
    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("companyId", selected.id || selected.cin) // Using CIN as fallback if ID not found

    try {
      const res = await fetch("/api/company/verify-document", {
        method: "POST",
        body: formData
      })
      const data = await res.json()
      if (data.ok) {
        setIsVerified(true)
        setRequiresProof(false)
        toast({ title: "✅ Success", description: data.message })
      } else {
        toast({ title: "OCR Validation Failed", description: data.message, variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Upload Failed", description: "Internal processing error.", variant: "destructive" })
    }
    setIsUploading(false)
  }

  return (
    <div className="grid gap-8">
      {/* ── Search Experience ── */}
      {!selected && (
        <div className="relative" ref={searchRef}>
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#A1A1AA] group-focus-within:text-[#18181B] transition-colors">
              <Search className="h-5 w-5" />
            </div>
            <Input 
              placeholder="Type name or CIN..."
              className="h-14 sm:h-16 pl-12 sm:pl-14 pr-28 sm:pr-40 rounded-2xl sm:rounded-[2rem] border-[#E4E4E7] bg-white shadow-xl focus:border-[#18181B] focus:ring-8 focus:ring-[#18181B]/5 transition-all text-sm sm:text-lg placeholder:text-[#A1A1AA] text-[#18181B] font-medium"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                if (selected) setSelected(null)
                if (searched) setSearched(false)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") performSearch()
              }}
            />
            <div className="absolute inset-y-2 sm:inset-y-3 right-2 sm:right-3 flex items-center gap-2 sm:gap-3">
              {loading && <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-[#A1A1AA]" />}
              {(selected || query) && (
                <button 
                  onClick={() => { setSelected(null); setQuery(""); setSearched(false); setResults([]); setRequiresProof(false); setIsVerified(false) }}
                  className="p-2 sm:p-2.5 text-[#A1A1AA] hover:text-[#18181B] hover:bg-[#F4F4F6] rounded-xl transition-all"
                  title="Clear"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              )}
              <button 
                onClick={performSearch}
                disabled={loading || query.length < 2}
                className="bg-[#18181B] text-white px-5 sm:px-8 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 active:translate-y-0"
              >
                Search
              </button>
            </div>
          </div>

          {/* Results Dropdown */}
          {((results.length > 0) || (searched && query.length >= 2)) && !selected && !loading && (
            <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-[#E4E4E7] shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-300">
              <div className="px-6 sm:px-8 py-4 border-b border-[#F4F4F6] bg-[#FAFAFB]/50 flex justify-between items-center">
                <p className="text-[10px] sm:text-[11px] font-black text-[#A1A1AA] uppercase tracking-[0.2em]">
                  {results.length > 0 ? "Corporate Identity Hub" : "No Verified Records"}
                </p>
              </div>
              <div className="max-h-[350px] sm:max-h-[450px] overflow-y-auto standard-scrollbar">
                {results.map((res, i) => (
                  <button 
                    key={res.cin || i}
                    onClick={() => {
                      setSelected(res)
                      setQuery(res.name)
                    }}
                    className="w-full px-6 sm:px-8 py-5 sm:py-6 flex items-center justify-between hover:bg-[#F4F4F6] transition-all border-b last:border-0 border-[#F4F4F6] text-left group"
                  >
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-2xl sm:rounded-3xl bg-[#18181B] text-white flex items-center justify-center font-black shadow-lg group-hover:scale-105 transition-transform text-lg sm:text-2xl">
                        {(res.name || "?")[0]}
                      </div>
                      <div className="space-y-1">
                        <div className="font-bold text-[#18181B] text-sm sm:text-lg flex items-center gap-2">
                          <span className="truncate max-w-[140px] sm:max-w-none">{res.name}</span>
                          {res.source === "gridlines" && (
                            <div className="bg-emerald-50 p-1 rounded-full border border-emerald-100">
                              <ShieldCheck className="h-3 w-3 text-emerald-500 shrink-0" />
                            </div>
                          )}
                        </div>
                        <div className="text-[10px] sm:text-xs text-[#71717A] font-mono tracking-tight opacity-70">
                          CIN: {res.cin || "UNOFFICIAL_QUERY"}
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#F4F4F6] p-2 sm:p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <ArrowRight className="h-4 w-4 text-[#18181B]" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Authenticity Report Rendering ── */}
      {selected && (
        <div className="grid gap-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
          <div className="flex items-center justify-between bg-white px-6 py-4 rounded-3xl border border-[#E4E4E7] shadow-sm">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-[#18181B]" />
              <span className="font-black uppercase text-xs tracking-widest">{selected.name}</span>
            </div>
            <button 
              onClick={() => { setSelected(null); setQuery(""); setResults([]); setRequiresProof(false); setIsVerified(false) }}
              className="text-xs font-bold text-[#A1A1AA] hover:text-[#18181B]"
            >
              Change Company
            </button>
          </div>

          <AuthenticityReport data={selected} />
          
          {!hideVerify && !isVerified && (
            <div className="grid gap-6">
              {!requiresProof ? (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <button 
                    onClick={handleInitialVerify}
                    disabled={verifying}
                    className="w-full sm:w-auto bg-[#18181B] text-white font-black px-10 py-5 rounded-full shadow-2xl hover:shadow-black/20 transition-all hover:-translate-y-1 active:translate-y-0 disabled:opacity-60 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                  >
                    {verifying ? (
                      <><Loader2 className="h-5 w-5 animate-spin" /> Analyzing Authorization…</>
                    ) : (
                      <><CheckCircle2 className="h-5 w-5" /> Initiate Link Request</>
                    )}
                  </button>
                  <p className="text-[10px] text-[#71717A] text-center sm:text-left leading-tight font-medium">
                    Corporate identity anchoring requires <br className="hidden md:block" /> 
                    official domain or document validation.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in zoom-in-95 duration-300">
                  {/* Option A: Work Email */}
                  <div className="bg-white p-8 rounded-[2.5rem] border-2 border-dashed border-[#E4E4E7] flex flex-col items-center text-center space-y-6 group hover:border-[#18181B] transition-all">
                    <div className="h-14 w-14 rounded-2xl bg-[#F4F4F6] flex items-center justify-center text-[#18181B] group-hover:bg-[#18181B] group-hover:text-white transition-colors">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-black uppercase text-sm tracking-tight text-[#18181B]">Work Email Match</h4>
                        <p className="text-xs text-[#71717A] leading-relaxed">
                            Log in with your corporate email to auto-verify based on domain name.
                        </p>
                    </div>
                    <div className="text-[10px] font-black text-amber-600 bg-amber-50 px-4 py-1.5 rounded-full border border-amber-100 flex items-center gap-2">
                        <AlertCircle className="h-3 w-3" /> Domain Mismatch Detected
                    </div>
                  </div>

                  {/* Option B: Document Proof */}
                  <div className="bg-white p-8 rounded-[2.5rem] border-2 border-[#18181B] flex flex-col items-center text-center space-y-6 shadow-xl shadow-black/5 relative overflow-hidden">
                    <div className="h-14 w-14 rounded-2xl bg-[#18181B] flex items-center justify-center text-white">
                      {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <FileUp className="h-6 w-6" />}
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-black uppercase text-sm tracking-tight text-[#18181B]">Document Proof (OCR)</h4>
                        <p className="text-xs text-[#71717A] leading-relaxed">
                            Upload a Bill, GST Certificate, or Tax Invoice to verify entity link.
                        </p>
                    </div>
                    
                    <label className={cn(
                        "w-full py-4 rounded-2xl border border-[#E4E4E7] text-xs font-black uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-2",
                        isUploading ? "bg-[#F4F4F6] text-[#A1A1AA]" : "bg-white text-[#18181B] hover:bg-[#F4F4F6]"
                    )}>
                        <ScanText className="h-4 w-4" />
                        {isUploading ? "Analyzing Document..." : "Select Document"}
                        <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*,.pdf" 
                            onChange={handleFileUpload}
                            disabled={isUploading}
                        />
                    </label>

                    {isUploading && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <div className="h-2 w-32 bg-[#E4E4E7] rounded-full overflow-hidden">
                                    <div className="h-full bg-[#18181B] animate-[progress_2s_ease-in-out_infinite]" style={{width: '60%'}} />
                                </div>
                                <span className="text-[10px] font-black uppercase text-[#18181B] animate-pulse">Running OCR Engine…</span>
                            </div>
                        </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {isVerified && (
            <div className="bg-emerald-50 border-2 border-emerald-100 p-8 rounded-[2.5rem] flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-500">
                <div className="h-16 w-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
                    <CheckCircle2 className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                    <h3 className="text-xl font-black text-emerald-900 uppercase">Authorization Anchored</h3>
                    <p className="text-sm text-emerald-700 font-medium">This company is now officially linked to your SafeHire identity.</p>
                </div>
                <button 
                  onClick={() => window.location.href = "/dashboard"}
                  className="mt-4 bg-emerald-600 text-white font-black px-8 py-3 rounded-full text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all"
                >
                    Return to Dashboard
                </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

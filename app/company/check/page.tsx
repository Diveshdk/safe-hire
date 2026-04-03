"use client"

import { CompanySearch } from "@/components/dashboard/company-search"
import Link from "next/link"
import { ShieldCheck, ArrowLeft } from "lucide-react"

export default function PublicCompanyCheckPage() {
  return (
    <main className="min-h-dvh bg-[#F4F4F6] font-sans">
      {/* ── Navbar ── */}
      <header className="bg-[#18181B] text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-5 sm:py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all shadow-inner">
              <span className="text-white font-black text-sm">SH</span>
            </div>
            <span className="font-black text-xl tracking-tighter">Safe Hire</span>
          </Link>
          <Link href="/" className="text-sm font-bold text-white/50 hover:text-white transition-all flex items-center gap-2 hover:-translate-x-1">
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back to Home</span>
          </Link>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 sm:px-10 py-16 sm:py-24">
        <div className="text-center space-y-6 sm:space-y-8 mb-16 sm:mb-24 px-4 sm:px-0">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] font-black uppercase tracking-[0.2em] px-5 py-2 rounded-full shadow-sm">
            <ShieldCheck className="h-4 w-4" />
            Public Access: Business Authenticity Portal
          </div>
          <h1 className="text-[2.5rem] sm:text-6xl font-black text-[#18181B] tracking-tight leading-[1] max-w-3xl mx-auto uppercase">
            Check Company Legitimacy
          </h1>
          <p className="text-lg sm:text-xl text-[#71717A] max-w-2xl mx-auto leading-relaxed font-medium">
            Verify official registration status and corporate filings across the Indian MCA 
            database and global corporate registries.
          </p>
        </div>

        <div className="bg-[#F4F4F6]/50 rounded-[2.5rem] sm:rounded-[4rem] p-1.5 sm:p-2.5 shadow-sm transform hover:scale-[1.005] transition-transform">
          <div className="bg-white rounded-[2rem] sm:rounded-[3.5rem] border border-[#E4E4E7] shadow-2xl p-6 sm:p-16 md:p-20">
             {/* Public check is view-only */}
             <CompanySearch hideVerify={true} />
          </div>
        </div>

        <div className="mt-24 sm:mt-40 grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 px-4 sm:px-0">
          <div className="bg-white/70 rounded-[2.5rem] border border-[#E4E4E7] p-10 sm:p-14 shadow-sm hover:shadow-xl transition-all">
            <h4 className="font-black text-[#18181B] mb-5 uppercase tracking-[0.2em] text-[11px]">Verify Market Status</h4>
            <p className="text-[#52525B] text-base sm:text-lg leading-[1.8] font-medium">
              Our Authenticity Engine combines official MCA registry data with 
              real-time stock market listing status (Listed vs. Private) 
              to provide a 360-degree authenticity report.
            </p>
          </div>
          <div className="bg-white/70 rounded-[2.5rem] border border-[#E4E4E7] p-10 sm:p-14 shadow-sm hover:shadow-xl transition-all">
             <h4 className="font-black text-[#18181B] mb-5 uppercase tracking-[0.2em] text-[11px]">Why Verification Matters?</h4>
             <p className="text-[#52525B] text-base sm:text-lg leading-[1.8] font-medium">
               Hiring fraud results in billions of dollars in losses annually. 
               SafeHire solves this by linking verified professional identities (Aadhaar) 
               to verified corporate entities (CIN).
             </p>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-[#E4E4E7] bg-white mt-12">
        <div className="max-w-4xl mx-auto text-center">
           <p className="text-xs text-[#A1A1AA] font-medium tracking-widest uppercase mb-4">Official Data Sources</p>
           <div className="flex flex-wrap justify-center gap-6 opacity-40 grayscale grayscale hover:grayscale-0 transition-opacity">
              <span className="font-bold text-xs uppercase tracking-tighter">Ministry of Corporate Affairs</span>
              <span className="font-bold text-xs uppercase tracking-tighter">Gridlines.io</span>
              <span className="font-bold text-xs uppercase tracking-tighter">OpenCorporates Registry</span>
           </div>
        </div>
      </footer>
    </main>
  )
}

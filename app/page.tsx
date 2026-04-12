import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ShieldCheck, Briefcase, GraduationCap, Building2, ArrowRight, CheckCircle2, FileText as FileIcon } from "lucide-react"

const FEATURES = [
  {
    icon: <ShieldCheck className="h-6 w-6" />,
    title: "Aadhaar-Verified Identity",
    desc: "We verify using only your name and last 4 digits of your Aadhaar — the full 12-digit number is never stored or transmitted. Privacy by design.",
    color: "card-pastel-mint",
    iconBg: "bg-emerald-100 text-emerald-600",
  },
  {
    icon: <GraduationCap className="h-6 w-6" />,
    title: "Verifiable Credentials",
    desc: "Academic results and certificates are cryptographically signed by institutions.",
    color: "card-pastel-lavender",
    iconBg: "bg-purple-100 text-purple-600",
  },
  {
    icon: <Building2 className="h-6 w-6" />,
    title: "Authenticated Companies",
    desc: "Every employer is verified via CIN or name-based search against official MCA registries.",
    color: "card-pastel-peach",
    iconBg: "bg-orange-100 text-orange-700",
  },
]

const STATS = [
  { value: "100%", label: "Aadhaar Verified" },
  { value: "0", label: "Fake Profiles" },
  { value: "Last 4 Only", label: "Aadhaar Digits Stored" },
]

const PRIVACY_BADGES = [
  { label: "Full Aadhaar number never stored" },
  { label: "SHA-256 one-way hashing" },
  { label: "DPDPA 2023 compliant" },
  { label: "Data minimization by design" },
  { label: "Voluntary consent only" },
]

export default async function HomePage() {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    redirect("/dashboard")
  }

  return (
    <main className="min-h-dvh bg-background">
      {/* ── Navbar ── */}
      <header className="bg-[#18181B] text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-5 sm:py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="h-10 w-10 rounded-xl overflow-hidden flex items-center justify-center group-hover:scale-105 transition-all">
              <img src="/logo.png" alt="SafeHire" className="h-full w-full object-cover" />
            </div>
            <span className="font-black text-xl tracking-tighter text-white">SafeHire</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-10 text-[13px] font-black uppercase tracking-widest text-white/60">
            <Link href="/sign-up" className="hover:text-white transition-all hover:translate-y-[-1px]">For Job Seekers</Link>
            <Link href="/sign-up" className="hover:text-white transition-all hover:translate-y-[-1px]">For Employers</Link>
            <Link href="/company/check" className="hover:text-white transition-all hover:translate-y-[-1px]">Verify Business</Link>
          </nav>

          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/sign-in"
              className="text-sm font-bold text-white/70 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="hidden sm:inline-flex text-[13px] bg-white text-[#18181B] font-black uppercase tracking-widest px-7 py-3 rounded-full hover:bg-[#F4F4F6] transition-all shadow-xl hover:shadow-white/10 hover:-translate-y-1 active:translate-y-0"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-7xl mx-auto px-6 sm:px-10 pt-20 sm:pt-32 pb-24 text-center">
        <div className="inline-flex items-center gap-2.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] font-black uppercase tracking-[0.2em] px-6 py-2.5 rounded-full mb-12 shadow-sm animate-in fade-in slide-in-from-top-4 duration-1000">
          <CheckCircle2 className="h-3.5 w-3.5" />
          India's Trusted Business Discovery Engine
        </div>

        <h1 className="text-[2.5rem] sm:text-7xl lg:text-[5.5rem] font-black text-[#18181B] leading-[1] tracking-tight sm:px-10">
          Hiring that's{" "}
          <span className="relative inline-block mt-2 sm:mt-0">
            Actually
          </span>{" "}
          <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-violet-600 via-blue-600 to-emerald-500 bg-clip-text text-transparent">
            Safe & Verified
          </span>
        </h1>

        <p className="mt-8 sm:mt-10 text-lg sm:text-xl text-[#71717A] max-w-3xl mx-auto leading-relaxed font-medium">
          Eliminate corporate fraud with government-backed digital identities. 
          Share your unique <strong className="font-bold text-[#18181B]">Safe Hire ID</strong> on your resume for instant recruiter verification.
        </p>

        <div className="mt-12 sm:mt-16 flex flex-col sm:flex-row items-center justify-center gap-5 px-4 sm:px-0">
          <Link
            href="/sign-up"
            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-[#18181B] text-white text-[13px] font-black uppercase tracking-widest px-10 py-5 rounded-full hover:bg-[#27272A] transition-all shadow-2xl hover:shadow-black/20 hover:-translate-y-1 active:translate-y-0"
          >
            Create Safe Hire ID
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/sign-up"
            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white text-[#18181B] text-[13px] font-black uppercase tracking-widest px-10 py-5 rounded-full border border-[#E4E4E7] hover:border-[#A1A1AA] transition-all shadow-xl hover:-translate-y-1 active:translate-y-0"
          >
            <Briefcase className="h-4 w-4" />
            For Employers
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-24 sm:mt-32 grid grid-cols-1 sm:grid-cols-3 max-w-4xl mx-auto gap-6 sm:gap-8 px-4 sm:px-0">
          {STATS.map((s) => (
            <div key={s.label} className="bg-white rounded-[2rem] p-8 shadow-xl border border-[#F0F0F2] hover:scale-[1.02] transition-transform">
              <div className="text-4xl font-black text-[#18181B] tracking-tighter">{s.value}</div>
              <div className="text-[11px] font-black text-[#A1A1AA] uppercase tracking-widest mt-2">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Privacy Trust Strip */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          {PRIVACY_BADGES.map((b) => (
            <div
              key={b.label}
              className="inline-flex items-center gap-2 bg-white border border-[#E4E4E7] text-[#52525B] text-[11px] font-bold px-4 py-2 rounded-full shadow-sm"
            >
              <ShieldCheck className="h-3 w-3 text-emerald-500 shrink-0" />
              {b.label}
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature Cards ── */}
      <section className="max-w-7xl mx-auto px-6 sm:px-10 py-24 sm:py-32">
        <div className="text-center mb-16 sm:mb-24">
          <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em] mb-4">Core Ecosystem</p>
          <h2 className="text-4xl sm:text-5xl font-black text-[#18181B] tracking-tight">Why Safe Hire?</h2>
          <p className="text-[#71717A] mt-4 text-lg font-medium">Built on government-node verification, not trust alone</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={`${f.color} rounded-[2.5rem] p-10 sm:p-12 card-hover border border-black/5 shadow-sm`}
            >
              <div className={`h-16 w-16 rounded-[1.5rem] ${f.iconBg} flex items-center justify-center mb-8 shadow-inner overflow-hidden`}>
                {f.icon}
              </div>
              <h3 className="text-2xl font-black text-[#18181B] mb-4 tracking-tight">{f.title}</h3>
              <p className="text-[#52525B] leading-[1.8] font-medium">{f.desc}</p>
            </div>
          ))}

          {/* New Resume Feature Card */}
          <div className="card-pastel-mint rounded-[2.5rem] p-10 sm:p-12 card-hover border border-black/5 shadow-sm md:col-span-3">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="h-20 w-20 rounded-[2rem] bg-emerald-600 text-white flex items-center justify-center shadow-lg shrink-0">
                <FileIcon className="h-10 w-10" />
              </div>
              <div className="text-center lg:text-left">
                <h3 className="text-3xl font-black text-[#18181B] mb-2 tracking-tight transition-all">Make Your Resume Stand Out</h3>
                <p className="text-[#52525B] text-lg leading-[1.6] font-medium max-w-2xl">
                  Add your <strong className="font-bold text-[#18181B]">Safe Hire ID</strong> or unique profile link to your resume. Recruiters can instantly verify your identity, education, and skills with a single click — no more fake degrees or identity fraud.
                </p>
              </div>
              <Link href="/sign-up" className="lg:ml-auto bg-[#18181B] text-white font-black uppercase tracking-widest px-8 py-4 rounded-full text-xs shadow-xl flex items-center gap-2">
                Join Now <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="max-w-7xl mx-auto px-6 sm:px-10 py-24 sm:py-40">
        <div className="bg-[#18181B] rounded-[3rem] p-10 sm:p-20 flex flex-col lg:flex-row items-center justify-between gap-12 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border border-white/5">
          <div className="text-center lg:text-left space-y-4">
            <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight">Ready to hire with<br className="hidden sm:block" /> confidence?</h2>
            <p className="text-white/50 text-base sm:text-lg font-medium">Join 50,000+ verified professionals and trusted employers.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto shrink-0">
            <Link
              href="/sign-up"
              className="bg-white text-[#18181B] font-black uppercase tracking-widest px-10 py-5 rounded-full hover:bg-[#F4F4F6] transition-all text-[13px] shadow-2xl text-center"
            >
              Get Started Free
            </Link>
            <Link
              href="/company/check"
              className="bg-white/10 text-white font-black uppercase tracking-widest px-10 py-5 rounded-full hover:bg-white/20 transition-all text-[13px] border border-white/20 text-center"
            >
              Verify Business
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

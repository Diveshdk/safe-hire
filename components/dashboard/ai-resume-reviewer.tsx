"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Bot, Sparkles, Target, AlertTriangle, Lightbulb, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function AiResumeReviewer() {
  const [resumeText, setResumeText] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const { toast } = useToast()

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setParsing(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/ai/parse", {
        method: "POST",
        body: formData,
      })
      const json = await res.json()
      if (json.ok) {
        setResumeText(json.text)
        toast({ title: "Resume parsed successfully" })
      } else {
        throw new Error(json.message)
      }
    } catch (err: any) {
      toast({ title: "Parsing failed", description: err.message, variant: "destructive" })
    } finally {
      setParsing(false)
    }
  }

  async function review() {
    setLoading(true)
    setResult(null)
    const res = await fetch("/api/ai/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeText, jobDescription }),
    })
    const json = await res.json()
    setLoading(false)
    if (json?.ok) {
      setResult(json)
      toast({ title: "Review ready" })
    } else {
      toast({ title: "Review failed", description: json?.message || "Try again", variant: "destructive" })
    }
  }

  const scoreColor = result?.ats_score >= 80 ? "text-green-600" : result?.ats_score >= 60 ? "text-amber-600" : "text-red-600"
  const scoreBg = result?.ats_score >= 80 ? "bg-green-500/10" : result?.ats_score >= 60 ? "bg-amber-500/10" : "bg-red-500/10"

  const renderText = (text: string) => {
    if (!text) return null
    const parts = text.split(/(\*\*.*?\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-bold text-foreground">{part.slice(2, -2)}</strong>
      }
      return part
    })
  }

  return (
    <div className="grid gap-6">
      {/* Input Card */}
      <div className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary animate-pulse" /> AI Resume Reviewer
          </h3>
          <div className="relative">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".pdf,.docx,.doc,image/*"
              onChange={handleFileUpload}
              disabled={parsing}
            />
            <Button
              variant="outline"
              size="sm"
              asChild
              disabled={parsing}
              className="cursor-pointer hover:bg-primary/5 border-primary/20"
            >
              <label htmlFor="file-upload">
                {parsing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Parsing...
                  </>
                ) : (
                  <>
                    <Target className="h-4 w-4 mr-2 text-primary" /> Upload Resume
                  </>
                )}
              </label>
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Upload your resume file or paste the text below for a detailed ATS analysis.</p>
        
        <div className="mt-6 grid gap-6">
          <div className="grid gap-3">
            <Label htmlFor="resume">Resume Text</Label>
            <Textarea
              id="resume"
              rows={8}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume text here..."
              className="font-mono text-sm bg-background/50 focus-visible:ring-primary/30"
            />
            <div className="flex justify-between items-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{resumeText.length} chars · {resumeText.split(/\s+/).filter(Boolean).length} words</p>
              <p className="text-[10px] uppercase tracking-wider text-primary/60 font-medium">Min 50 chars for AI</p>
            </div>
          </div>

          <div className="grid gap-3">
            <Label htmlFor="job">Job Description (Optional)</Label>
            <Textarea
              id="job"
              rows={4}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste specific job requirements for alignment check..."
              className="font-mono text-sm bg-background/50 focus-visible:ring-primary/30"
            />
          </div>

          <Button 
            onClick={review} 
            disabled={loading || resumeText.length < 50} 
            className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary),0.2)] transition-all active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Generating AI Report…
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" /> Run AI Analysis
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* ATS Score */}
          <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mb-4 relative z-10">ATS Compatibility Index</p>
            <div className={cn("inline-flex items-center justify-center h-32 w-32 rounded-full text-5xl font-black border-4 shadow-inner relative z-10 transition-transform group-hover:scale-105 duration-300", scoreBg, scoreColor, "border-current/20")}>
              {result.ats_score}
            </div>
            <p className="text-lg font-semibold text-foreground mt-6 max-w-lg mx-auto leading-relaxed relative z-10">{result.summary}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Strengths */}
            <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-6 shadow-sm">
              <p className="text-xs font-black text-green-600 uppercase tracking-widest flex items-center gap-2 mb-5">
                <Target className="h-4 w-4" /> Strengths
              </p>
              <div className="grid gap-4">
                {result.strengths?.map((s: string, i: number) => (
                  <div key={i} className="text-sm text-foreground/80 flex gap-3 leading-snug">
                    <span className="text-green-500 font-black shrink-0">✓</span> 
                    <span>{renderText(s)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill Gaps */}
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 shadow-sm">
              <p className="text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-2 mb-5">
                <AlertTriangle className="h-4 w-4" /> Optimization
              </p>
              <div className="grid gap-4">
                {result.skill_gaps?.map((s: string, i: number) => (
                  <div key={i} className="text-sm text-foreground/80 flex gap-3 leading-snug">
                    <span className="text-amber-500 font-black shrink-0">⚠</span> 
                    <span>{renderText(s)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggestions */}
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 shadow-sm sm:col-span-2 lg:col-span-1">
              <p className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 mb-5">
                <Lightbulb className="h-4 w-4" /> Action Plan
              </p>
              <div className="grid gap-4">
                {result.suggestions?.map((s: string, i: number) => (
                  <div key={i} className="text-sm text-foreground/80 flex gap-3 leading-snug">
                    <span className="text-blue-500 font-black shrink-0">💡</span> 
                    <span>{renderText(s)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Full Report - Premium Look */}
          <div className="rounded-3xl border-2 border-primary/10 bg-[#0a0a0a] p-1 shadow-2xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="bg-card/90 rounded-[calc(1.5rem-2px)] p-6 md:p-8 relative z-10 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xs font-black flex items-center gap-3 uppercase tracking-[0.3em] text-primary/80">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  Detailed AI Raw Intelligence
                </h4>
                <div className="h-px flex-1 bg-primary/10 ml-6 mr-4 hidden md:block" />
                <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">V1.0.HF</span>
              </div>
              <div className="font-mono text-sm md:text-base leading-relaxed max-h-[600px] overflow-y-auto pr-4 custom-scrollbar whitespace-pre-wrap selection:bg-primary/20">
                {result.review}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

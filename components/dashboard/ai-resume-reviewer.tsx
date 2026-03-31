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
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const { toast } = useToast()

  async function review() {
    setLoading(true)
    setResult(null)
    const res = await fetch("/api/ai/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeText }),
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

  const scoreColor = result?.ats_score >= 75 ? "text-green-600" : result?.ats_score >= 50 ? "text-amber-600" : "text-red-600"
  const scoreBg = result?.ats_score >= 75 ? "bg-green-500/10" : result?.ats_score >= 50 ? "bg-amber-500/10" : "bg-red-500/10"

  return (
    <div className="grid gap-6">
      {/* Input Card */}
      <div className="rounded-2xl border border-border bg-card/40 p-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" /> AI Resume Reviewer
        </h3>
        <p className="text-sm text-muted-foreground mt-1">Paste your resume text to get an ATS compatibility score and improvement suggestions.</p>
        <div className="mt-4 grid gap-3">
          <Label htmlFor="resume">Resume Text</Label>
          <Textarea
            id="resume"
            rows={8}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume text here...&#10;&#10;Include your summary, work experience, education, skills, and projects."
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">{resumeText.length} characters · {resumeText.split(/\s+/).filter(Boolean).length} words · Min 50 characters required</p>
          <Button onClick={review} disabled={loading || resumeText.length < 50} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" /> Analyze Resume
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="grid gap-4">
          {/* ATS Score */}
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">ATS Compatibility Score</p>
            <div className={cn("inline-flex items-center justify-center h-24 w-24 rounded-full text-3xl font-bold", scoreBg, scoreColor)}>
              {result.ats_score}
            </div>
            <p className="text-sm text-muted-foreground mt-3 max-w-md mx-auto">{result.summary}</p>
          </div>

          {/* Strengths */}
          {result.strengths?.length > 0 && (
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
              <p className="text-sm font-semibold text-green-600 flex items-center gap-1.5 mb-3">
                <Target className="h-4 w-4" /> Strengths
              </p>
              <div className="grid gap-1.5">
                {result.strengths.map((s: string, i: number) => (
                  <p key={i} className="text-sm text-foreground flex gap-2">
                    <span className="text-green-600 shrink-0">✓</span> {s}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Skill Gaps */}
          {result.skill_gaps?.length > 0 && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="text-sm font-semibold text-amber-600 flex items-center gap-1.5 mb-3">
                <AlertTriangle className="h-4 w-4" /> Areas to Improve
              </p>
              <div className="grid gap-1.5">
                {result.skill_gaps.map((s: string, i: number) => (
                  <p key={i} className="text-sm text-foreground flex gap-2">
                    <span className="text-amber-600 shrink-0">⚠</span> {s}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {result.suggestions?.length > 0 && (
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
              <p className="text-sm font-semibold text-blue-600 flex items-center gap-1.5 mb-3">
                <Lightbulb className="h-4 w-4" /> Suggestions
              </p>
              <div className="grid gap-1.5">
                {result.suggestions.map((s: string, i: number) => (
                  <p key={i} className="text-sm text-foreground flex gap-2">
                    <span className="text-blue-600 shrink-0">💡</span> {s}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

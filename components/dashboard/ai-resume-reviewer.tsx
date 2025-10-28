"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

export function AiResumeReviewer() {
  const [resumeText, setResumeText] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
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
      setResult(json.review)
      if (json.fallback) {
        toast({ 
          title: "Analysis Complete (Fallback)", 
          description: "AI service unavailable, using backup analysis",
          variant: "default"
        })
      } else {
        toast({ 
          title: "AI Analysis Complete", 
          description: "Powered by Google Gemini AI" 
        })
      }
    } else {
      toast({ title: "Review failed", description: json?.message || "Try again", variant: "destructive" })
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-6">
      <h3 className="text-lg font-semibold">AI Resume Reviewer</h3>
      <p className="text-sm text-muted-foreground mt-1">Paste your resume text to get AI-powered feedback and scoring. ✨ Powered by Google Gemini</p>
      <div className="mt-4 grid gap-2">
        <Label htmlFor="resume">Resume Text</Label>
        <Textarea
          id="resume"
          rows={7}
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="Paste your resume text..."
        />
        <div className="mt-2">
          <Button onClick={review} disabled={loading || resumeText.length < 50}>
            {loading ? "Analyzing…" : "Review Resume"}
          </Button>
        </div>
        {result && <div className="mt-4 rounded-xl bg-secondary/30 p-4 text-sm whitespace-pre-wrap">{result}</div>}
      </div>
    </div>
  )
}

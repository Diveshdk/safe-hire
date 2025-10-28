"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export default function CompanyCheckPage() {
  const [id, setId] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSearch(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setResult(null)
    setLoading(true)
    const p = id.trim().toUpperCase()
    const isPAN = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(p)
    const qs = new URLSearchParams(isPAN ? { pan: p } : { cin: p }).toString()
    const res = await fetch(`/api/company/fetch?${qs}`)
    const json = await res.json()
    setLoading(false)
    if (!json.ok) {
      setError(json.message || "Lookup failed")
      return
    }
    setResult(json.data)
  }

  return (
    <main className="min-h-dvh bg-background">
      <section className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-balance">Check Company Authenticity</h1>
        <p className="text-muted-foreground mt-2">
          Enter a company CIN (or PAN) to fetch details from MCA via Gridlines.
        </p>

        <Card className="mt-6 p-6">
          <form onSubmit={onSearch} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cin">CIN or PAN</Label>
              <Input
                id="cin"
                placeholder="e.g., U12345KA2020PTC012345 or AAAPA1234A"
                value={id}
                onChange={(e) => setId(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Checking…" : "Check"}
              </Button>
            </div>
          </form>

          {error && <p className="mt-4 text-sm text-destructive-foreground">{error}</p>}

          {result && (
            <div className="mt-6 text-sm">
              <pre className="rounded-lg bg-secondary/40 p-4 overflow-auto">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </Card>
      </section>
    </main>
  )
}

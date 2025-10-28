"use client"

import type React from "react"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

const fetcher = (url: string, init?: RequestInit) => fetch(url, init).then((r) => r.json())

export function JobsSection() {
  const { data, isLoading, mutate } = useSWR("/api/jobs/list", fetcher)
  const jobs = data?.jobs || []
  const { toast } = useToast()

  async function seed() {
    const r = await fetch("/api/jobs/seed-demo", { method: "POST" })
    const j = await r.json()
    if (j?.ok) {
      toast({ title: "Demo jobs added" })
      mutate()
    } else {
      toast({ title: "Seeding failed", description: j?.message || "Try again", variant: "destructive" })
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Open Jobs</h3>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={seed}>
            Add Demo Jobs
          </Button>
          <JobForm onCreated={mutate} />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {isLoading && <p className="text-sm text-muted-foreground">Loading jobs…</p>}
        {jobs.map((j: any) => (
          <div key={j.id} className="rounded-xl border border-border p-4 bg-card/40">
            <div className="flex items-center gap-3">
              <img
                src={`/.jpg?height=40&width=40&query=${encodeURIComponent(j.companies?.name || "company")}`}
                alt=""
                className="h-10 w-10 rounded-lg"
              />
              <div>
                <div className="font-medium">{j.title}</div>
                <div className="text-xs text-muted-foreground">{j.companies?.name || "Company"}</div>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{j.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function JobForm({ onCreated }: { onCreated: () => void }) {
  const { data: companies } = useSWR("/api/me/companies", fetcher)
  const [companyId, setCompanyId] = useState<string>("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (companies?.companies?.length && !companyId) {
      setCompanyId(companies.companies[0].id)
    }
  }, [companies, companyId])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const r = await fetch("/api/jobs/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_id: companyId, title, description }),
    })
    const j = await r.json()
    setLoading(false)
    if (j?.ok) {
      toast({ title: "Job posted" })
      setTitle("")
      setDescription("")
      onCreated()
    } else {
      toast({
        title: "Failed to post",
        description: j?.message || "Only verified employers can post to their own company.",
        variant: "destructive",
      })
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-border p-4 bg-card/30">
      <div className="grid md:grid-cols-3 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="company">Company</Label>
          <select
            id="company"
            className="h-10 rounded-md border border-input bg-background px-3"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
          >
            {(companies?.companies || []).map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Frontend Engineer"
            required
          />
        </div>
        <div className="grid gap-1.5 md:col-span-3">
          <Label htmlFor="desc">Description</Label>
          <Textarea
            id="desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Role, requirements, process…"
          />
        </div>
      </div>
      <div className="mt-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Posting…" : "Post Job"}
        </Button>
      </div>
    </form>
  )
}

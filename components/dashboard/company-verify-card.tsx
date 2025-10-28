"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

const fetcher = (url: string, init?: RequestInit) => fetch(url, init).then((r) => r.json())

export function CompanyVerifyCard() {
  const [name, setName] = useState("")
  const [reg, setReg] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function verify() {
    setLoading(true)
    const res = await fetch("/api/company/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), registrationNumber: reg.trim().toUpperCase() }),
    })
    const json = await res.json()
    setLoading(false)
    if (json?.ok) {
      toast({ title: "Company verified", description: `${name} added to your companies.` })
    } else {
      toast({
        title: "Verification failed",
        description: json?.message || "Try a valid CIN/PAN",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-6">
      <h3 className="text-lg font-semibold">Company Verification</h3>
      <p className="text-sm text-muted-foreground mt-1">Verify your company using CIN or PAN via Gridlines.</p>
      <div className="mt-4 grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="cname">Company Name</Label>
          <Input id="cname" placeholder="Acme Pvt Ltd" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="creg">CIN or PAN</Label>
          <Input
            id="creg"
            placeholder="U12345KA2020PTC012345"
            value={reg}
            onChange={(e) => setReg(e.target.value.toUpperCase())}
          />
        </div>
        <div className="flex gap-3">
          <Button onClick={verify} disabled={loading}>
            {loading ? "Verifying…" : "Verify & Save"}
          </Button>
          <Button variant="secondary" disabled title="DigiLocker coming soon">
            Verify via DigiLocker
          </Button>
        </div>
      </div>
    </div>
  )
}

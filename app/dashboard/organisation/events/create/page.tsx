"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { PlusCircle, Trash2, ChevronDown, ArrowLeft } from "lucide-react"
import Link from "next/link"

const FIELD_TYPES = ["Text", "Number", "Date", "Percentage", "File Upload", "Dropdown", "Multi-line text"]

interface CustomField {
  id: string
  title: string
  type: string
  content: string
}

export default function CreateEventPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [eventTitle, setEventTitle] = useState("")
  const [achievement, setAchievement] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [eventType, setEventType] = useState("")
  const [eventDescription, setEventDescription] = useState("")
  const [fields, setFields] = useState<CustomField[]>([])

  function addField() {
    setFields((prev) => [...prev, { id: crypto.randomUUID(), title: "", type: "Text", content: "" }])
  }

  function updateField(id: string, key: keyof CustomField, value: string) {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, [key]: value } : f)))
  }

  function removeField(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!eventTitle.trim()) {
      toast({ title: "Event title is required", variant: "destructive" })
      return
    }
    if (!achievement.trim()) {
      toast({ title: "Achievement description is required", variant: "destructive" })
      return
    }

    setLoading(true)
    const res = await fetch("/api/events/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: eventTitle.trim(),
        achievement: achievement.trim(),
        custom_fields: fields,
        event_date: eventDate || undefined,
        event_type: eventType.trim() || undefined,
        event_description: eventDescription.trim() || undefined,
      }),
    })
    const json = await res.json()
    setLoading(false)

    if (!json.ok) {
      toast({ title: "Failed to create event", description: json.message, variant: "destructive" })
      return
    }

    toast({ title: "✅ Event created!", description: `"${eventTitle}" is ready for certificate issuance.` })
    
    // Redirect to events list after short delay
    setTimeout(() => {
      router.push("/dashboard/organisation/events")
    }, 1000)
  }

  return (
    <main className="min-h-dvh bg-background">
      <div className="container max-w-3xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/organisation/events">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Link>
          </Button>
        </div>

        <div>
          <h1 className="text-2xl font-semibold">Create Event</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Define your event and custom fields for certificate generation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6">
          {/* Core Fields */}
          <div className="rounded-2xl border border-border bg-card/40 p-6 grid gap-4">
            <h2 className="font-semibold">Event Details</h2>
            <div className="grid gap-1.5">
              <Label htmlFor="ev-title">Event Title *</Label>
              <Input
                id="ev-title"
                placeholder="e.g. Annual Tech Fest 2025"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ev-achievement">Achievement *</Label>
              <Input
                id="ev-achievement"
                placeholder="e.g. Best Project Award, First Place in Coding"
                value={achievement}
                onChange={(e) => setAchievement(e.target.value)}
                required
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="ev-date">Event Date (Optional)</Label>
                <Input
                  id="ev-date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ev-type">Event Type (Optional)</Label>
                <Input
                  id="ev-type"
                  placeholder="e.g. Competition, Workshop, Seminar"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ev-desc">Event Description (Optional)</Label>
              <Input
                id="ev-desc"
                placeholder="Brief description of the event"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Dynamic Custom Fields */}
          <div className="rounded-2xl border border-border bg-card/40 p-6 grid gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Custom Fields</h2>
              <Button type="button" variant="secondary" size="sm" onClick={addField}>
                <PlusCircle className="h-3.5 w-3.5 mr-1.5" /> Add Field
              </Button>
            </div>

            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No custom fields yet. Add fields like Position, Team Name, Score, etc.
              </p>
            )}

            {fields.map((field, idx) => (
              <div key={field.id} className="grid gap-3 rounded-xl border border-border/60 bg-background/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Field {idx + 1}</span>
                  <button type="button" onClick={() => removeField(field.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive transition-colors" />
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor={`ft-${field.id}`}>Field Title</Label>
                    <Input
                      id={`ft-${field.id}`}
                      placeholder="e.g. Position, Team Name, Score"
                      value={field.title}
                      onChange={(e) => updateField(field.id, "title", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor={`ftype-${field.id}`}>Field Type</Label>
                    <div className="relative">
                      <select
                        id={`ftype-${field.id}`}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm appearance-none"
                        value={field.type}
                        onChange={(e) => updateField(field.id, "type", e.target.value)}
                      >
                        {FIELD_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor={`fc-${field.id}`}>
                    Field Content
                    {field.type === "Dropdown" ? " (comma-separated options)" : " (description or default)"}
                  </Label>
                  <Input
                    id={`fc-${field.id}`}
                    placeholder={
                      field.type === "Dropdown"
                        ? "Winner, Runner-up, Participant"
                        : "e.g. National level hackathon"
                    }
                    value={field.content}
                    onChange={(e) => updateField(field.id, "content", e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? "Creating Event…" : "Create Event"}
          </Button>
        </form>
      </div>
    </main>
  )
}

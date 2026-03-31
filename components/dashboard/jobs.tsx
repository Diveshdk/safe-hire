"use client"

import type React from "react"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Pencil, Trash2, Plus } from "lucide-react"

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
          <JobFormDialog onCreated={mutate} />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {isLoading && <p className="text-sm text-muted-foreground">Loading jobs…</p>}
        {jobs.length === 0 && !isLoading && (
          <p className="text-sm text-muted-foreground col-span-2">No jobs posted yet. Create your first job!</p>
        )}
        {jobs.map((j: any) => (
          <JobCard key={j.id} job={j} onUpdate={mutate} />
        ))}
      </div>
    </div>
  )
}

function JobCard({ job, onUpdate }: { job: any; onUpdate: () => void }) {
  const { toast } = useToast()
  const [deleting, setDeleting] = useState(false)

  async function deleteJob() {
    setDeleting(true)
    const r = await fetch("/api/jobs/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: job.id }),
    })
    const j = await r.json()
    setDeleting(false)
    if (j?.ok) {
      toast({ title: "Job deleted successfully" })
      onUpdate()
    } else {
      toast({ title: "Delete failed", description: j?.message, variant: "destructive" })
    }
  }

  return (
    <div className="rounded-xl border border-border p-4 bg-card/40 relative group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <img
            src={`/.jpg?height=40&width=40&query=${encodeURIComponent(job.companies?.name || "company")}`}
            alt=""
            className="h-10 w-10 rounded-lg"
          />
          <div>
            <div className="font-medium">{job.title}</div>
            <div className="text-xs text-muted-foreground">{job.companies?.name || "Company"}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <EditJobDialog job={job} onUpdated={onUpdate} />
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Job?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{job.title}". This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deleteJob} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {deleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{job.description}</p>
      
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <span className={`px-2 py-1 rounded-full ${job.status === 'open' ? 'bg-green-500/10 text-green-600' : 'bg-gray-500/10 text-gray-600'}`}>
          {job.status === 'open' ? 'Open' : 'Closed'}
        </span>
        {job.location && <span>📍 {job.location}</span>}
        {job.salary_range && <span>💰 {job.salary_range}</span>}
      </div>
    </div>
  )
}

function JobFormDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Post Job
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post New Job</DialogTitle>
        </DialogHeader>
        <JobForm 
          onCreated={() => {
            onCreated()
            setOpen(false)
          }} 
        />
      </DialogContent>
    </Dialog>
  )
}

function EditJobDialog({ job, onUpdated }: { job: any; onUpdated: () => void }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Job</DialogTitle>
        </DialogHeader>
        <JobForm 
          job={job}
          onCreated={() => {
            onUpdated()
            setOpen(false)
          }} 
        />
      </DialogContent>
    </Dialog>
  )
}

function JobForm({ onCreated, job }: { onCreated: () => void; job?: any }) {
  const { data: companies } = useSWR("/api/me/companies", fetcher)
  const [companyId, setCompanyId] = useState<string>(job?.company_id || "")
  const [title, setTitle] = useState(job?.title || "")
  const [description, setDescription] = useState(job?.description || "")
  const [location, setLocation] = useState(job?.location || "")
  const [salaryRange, setSalaryRange] = useState(job?.salary_range || "")
  const [jobType, setJobType] = useState(job?.job_type || "full-time")
  const [status, setStatus] = useState(job?.status || "open")
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
    
    const endpoint = job ? "/api/jobs/update" : "/api/jobs/create"
    const payload = {
      ...(job && { job_id: job.id }),
      company_id: companyId,
      title,
      description,
      location,
      salary_range: salaryRange,
      job_type: jobType,
      status,
    }
    
    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const j = await r.json()
    setLoading(false)
    
    if (j?.ok) {
      toast({ title: job ? "Job updated successfully" : "Job posted successfully" })
      if (!job) {
        setTitle("")
        setDescription("")
        setLocation("")
        setSalaryRange("")
      }
      onCreated()
    } else {
      toast({
        title: job ? "Update failed" : "Failed to post",
        description: j?.message || "Please try again",
        variant: "destructive",
      })
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="company">Company</Label>
          <select
            id="company"
            className="h-10 rounded-md border border-input bg-background px-3"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            required
          >
            <option value="">Select company</option>
            {(companies?.companies || []).map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="title">Job Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Frontend Engineer"
            required
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="desc">Job Description</Label>
        <Textarea
          id="desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the role, responsibilities, requirements..."
          rows={5}
          required
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Remote, Bangalore"
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="salary">Salary Range</Label>
          <Input
            id="salary"
            value={salaryRange}
            onChange={(e) => setSalaryRange(e.target.value)}
            placeholder="e.g., ₹10-15 LPA"
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="jobType">Job Type</Label>
          <select
            id="jobType"
            className="h-10 rounded-md border border-input bg-background px-3"
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
          >
            <option value="full-time">Full Time</option>
            <option value="part-time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>
        </div>
      </div>

      {job && (
        <div className="grid gap-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            className="h-10 rounded-md border border-input bg-background px-3"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? (job ? "Updating..." : "Posting...") : (job ? "Update Job" : "Post Job")}
        </Button>
      </div>
    </form>
  )
}

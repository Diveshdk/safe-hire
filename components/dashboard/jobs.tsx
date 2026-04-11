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
import { Pencil, Trash2, Plus, MapPin, DollarSign, Briefcase } from "lucide-react"

const fetcher = (url: string, init?: RequestInit) => fetch(url, init).then((r) => r.json())

// Pastel background cycle for job cards — same as reference image
const CARD_PASTELS = [
  "card-pastel-peach",
  "card-pastel-mint",
  "card-pastel-lavender",
  "card-pastel-sky",
  "card-pastel-pink",
  "card-pastel-lemon",
]

export function JobsSection() {
  const { data, isLoading, mutate } = useSWR("/api/jobs/list", fetcher)
  const jobs = data?.jobs || []
  const { toast } = useToast()


  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#18181B]">Open Jobs</h3>
          <p className="text-sm text-[#71717A] mt-0.5">{jobs.length} active posting{jobs.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          <JobFormDialog onCreated={mutate} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading && (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-[#F4F4F6] animate-pulse h-52" />
            ))}
          </>
        )}
        {jobs.length === 0 && !isLoading && (
          <div className="col-span-3 flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-[#F4F4F6] flex items-center justify-center mb-4">
              <Briefcase className="h-7 w-7 text-[#A1A1AA]" />
            </div>
            <p className="font-semibold text-[#18181B]">No jobs posted yet</p>
            <p className="text-sm text-[#71717A] mt-1">Create your first job to get started</p>
          </div>
        )}
        {jobs.map((j: any, idx: number) => (
          <JobCard key={j.id} job={j} onUpdate={mutate} pastelidx={idx} />
        ))}
      </div>
    </div>
  )
}

function JobCard({ job, onUpdate, pastelidx }: { job: any; onUpdate: () => void; pastelidx: number }) {
  const { toast } = useToast()
  const [deleting, setDeleting] = useState(false)
  const pastelClass = CARD_PASTELS[pastelidx % CARD_PASTELS.length]

  // Company initial for avatar
  const companyName = job.companies?.name || "Company"
  const initial = companyName[0].toUpperCase()

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
    <div className={`${pastelClass} rounded-2xl p-5 relative group card-hover flex flex-col gap-4`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Company logo placeholder */}
          <div className="h-11 w-11 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
            <span className="font-bold text-[#18181B] text-base">{initial}</span>
          </div>
          <div>
            <div className="text-xs text-[#71717A] font-medium">{companyName}</div>
            <div className="font-bold text-[#18181B] text-base leading-tight mt-0.5">{job.title}</div>
          </div>
        </div>

        {/* Admin actions — show on hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <EditJobDialog job={job} onUpdated={onUpdate} />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="h-8 w-8 rounded-lg hover:bg-black/5 flex items-center justify-center transition-colors">
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl border-[#E4E4E7]">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Job?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{job.title}". This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={deleteJob}
                  disabled={deleting}
                  className="bg-red-500 hover:bg-red-600 rounded-full"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-[#52525B] line-clamp-2 flex-1">{job.description}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {job.job_type && (
          <span className="text-xs bg-white/60 border border-black/5 text-[#52525B] px-2.5 py-1 rounded-full font-medium capitalize">
            {job.job_type.replace("-", " ")}
          </span>
        )}
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${job.status === "open" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
          {job.status === "open" ? "Open" : "Closed"}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-black/5">
        <div className="flex flex-col gap-0.5">
          {job.salary_range && (
            <span className="text-sm font-bold text-[#18181B] flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5 text-[#71717A]" />{job.salary_range}
            </span>
          )}
          {job.location && (
            <span className="text-xs text-[#71717A] flex items-center gap-1">
              <MapPin className="h-3 w-3" />{job.location}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function JobFormDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 bg-[#18181B] text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-[#27272A] transition-all shadow-sm hover:shadow-md">
          <Plus className="h-4 w-4" /> Post Job
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border-[#E4E4E7]">
        <DialogHeader>
          <DialogTitle className="text-[#18181B]">Post New Job</DialogTitle>
        </DialogHeader>
        <JobForm onCreated={() => { onCreated(); setOpen(false) }} />
      </DialogContent>
    </Dialog>
  )
}

function EditJobDialog({ job, onUpdated }: { job: any; onUpdated: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="h-8 w-8 rounded-lg hover:bg-black/5 flex items-center justify-center transition-colors">
          <Pencil className="h-3.5 w-3.5 text-[#71717A]" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border-[#E4E4E7]">
        <DialogHeader>
          <DialogTitle className="text-[#18181B]">Edit Job</DialogTitle>
        </DialogHeader>
        <JobForm job={job} onCreated={() => { onUpdated(); setOpen(false) }} />
      </DialogContent>
    </Dialog>
  )
}

const inputClass = "h-11 rounded-xl border-[#E4E4E7] bg-white focus:border-[#18181B] focus:ring-0 text-[#18181B] placeholder:text-[#A1A1AA]"
const labelClass = "text-sm font-medium text-[#18181B]"
const selectClass = "h-11 rounded-xl border border-[#E4E4E7] bg-white px-3 text-sm text-[#18181B] focus:outline-none focus:border-[#18181B] w-full"

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
      title, description, location,
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
      if (!job) { setTitle(""); setDescription(""); setLocation(""); setSalaryRange("") }
      onCreated()
    } else {
      toast({ title: job ? "Update failed" : "Failed to post", description: j?.message || "Please try again", variant: "destructive" })
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 mt-2">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="company" className={labelClass}>Company</Label>
          <select id="company" className={selectClass} value={companyId} onChange={(e) => setCompanyId(e.target.value)} required>
            <option value="">Select company</option>
            {(companies?.companies || []).map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="title" className={labelClass}>Job Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Frontend Engineer" required className={inputClass} />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="desc" className={labelClass}>Job Description</Label>
        <Textarea
          id="desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the role, responsibilities, requirements..."
          rows={5}
          required
          className="rounded-xl border-[#E4E4E7] bg-white focus:border-[#18181B] focus:ring-0 text-[#18181B] placeholder:text-[#A1A1AA] resize-none"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="location" className={labelClass}>Location</Label>
          <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Remote, Bangalore" className={inputClass} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="salary" className={labelClass}>Salary Range</Label>
          <Input id="salary" value={salaryRange} onChange={(e) => setSalaryRange(e.target.value)} placeholder="e.g., ₹10-15 LPA" className={inputClass} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="jobType" className={labelClass}>Job Type</Label>
          <select id="jobType" className={selectClass} value={jobType} onChange={(e) => setJobType(e.target.value)}>
            <option value="full-time">Full Time</option>
            <option value="part-time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>
        </div>
      </div>

      {job && (
        <div className="grid gap-1.5">
          <Label htmlFor="status" className={labelClass}>Status</Label>
          <select id="status" className={selectClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button type="submit" disabled={loading} className="bg-[#18181B] text-white font-semibold px-7 py-2.5 rounded-full hover:bg-[#27272A] transition-all disabled:opacity-60 flex items-center gap-2 text-sm">
          {loading
            ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{job ? "Updating..." : "Posting..."}</>
            : (job ? "Update Job" : "Post Job")}
        </button>
      </div>
    </form>
  )
}

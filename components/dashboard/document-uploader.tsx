"use client"

import type React from "react"
import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle2, AlertTriangle, Clock, Upload, FileText, X, Link2 } from "lucide-react"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const DOC_OPTIONS = [
  { value: "certificate", label: "Certificate / Award (OCR Scan)", ext: ".pdf,.jpg,.png", showDesc: true },
  { value: "event_certificate", label: "Event Certificate (OCR Scan)", ext: ".pdf,.jpg,.png", showDesc: true },
  { value: "academic_result", label: "Academic Result / Marksheet", ext: ".pdf,.jpg,.png", showDesc: false },
  { value: "resume", label: "Resume", ext: ".pdf", showDesc: false },
  { value: "aadhaar", label: "Aadhaar Card (XML or Image/PDF OCR)", ext: ".xml,.pdf,.jpg,.png", showDesc: false },
  { value: "other", label: "Other Document", ext: ".pdf,.jpg,.png", showDesc: true },
]

const STATUS_CONFIG = {
  verified: { icon: <CheckCircle2 className="h-4 w-4" />, label: "Verified", color: "text-green-500 bg-green-500/10" },
  flagged: { icon: <AlertTriangle className="h-4 w-4" />, label: "Name Mismatch", color: "text-red-500 bg-red-500/10" },
  pending: { icon: <Clock className="h-4 w-4" />, label: "Pending", color: "text-yellow-500 bg-yellow-500/10" },
  unverified: { icon: <FileText className="h-4 w-4" />, label: "Unverified", color: "text-muted-foreground bg-muted/50" },
}

export function DocumentUploader() {
  const { data, isLoading, mutate } = useSWR("/api/documents/list", fetcher)
  const documents = data?.documents || []
  const { toast } = useToast()

  const [docType, setDocType] = useState("certificate")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [linkUrl, setLinkUrl] = useState("")
  const [uploadMode, setUploadMode] = useState<"file" | "link">("file")
  const [uploading, setUploading] = useState(false)

  const selectedDocOpt = DOC_OPTIONS.find((d) => d.value === docType)
  const showDescField = selectedDocOpt?.showDesc ?? false

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()

    if (uploadMode === "file" && !file) {
      toast({ title: "Choose a file first", variant: "destructive" })
      return
    }
    if (uploadMode === "link" && !linkUrl.trim()) {
      toast({ title: "Enter a link URL", variant: "destructive" })
      return
    }

    setUploading(true)

    let res: Response

    if (uploadMode === "file" && file) {
      const form = new FormData()
      form.append("file", file)
      form.append("doc_type", docType)
      form.append("title", title || file.name)
      if (description) form.append("description", description)
      res = await fetch("/api/documents/upload", { method: "POST", body: form })
    } else {
      res = await fetch("/api/documents/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doc_type: docType,
          title: title || "Linked Document",
          description: description || "",
          link_url: linkUrl.trim(),
        }),
      })
    }

    const json = await res.json()
    setUploading(false)

    if (!json.ok) {
      toast({ title: "Upload failed", description: json.message, variant: "destructive" })
      return
    }

    toast({ title: "✅ Document saved", description: `Status: ${json.verificationStatus}` })
    setFile(null)
    setTitle("")
    setDescription("")
    setLinkUrl("")
    mutate()
  }

  const canSubmit = uploadMode === "file" ? !!file : !!linkUrl.trim()

  return (
    <div className="grid gap-6">
      {/* Upload Form */}
      <form onSubmit={handleUpload} className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-sm">
        <h3 className="font-bold text-base text-[#18181B] mb-4 flex items-center gap-2">
          <Upload className="h-4 w-4 text-[#71717A]" /> Add Document
        </h3>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="doc-type" className="text-sm font-medium text-[#18181B]">Document Type</Label>
            <select
              id="doc-type"
              className="h-11 rounded-xl border border-[#E4E4E7] bg-white px-3 text-sm text-[#18181B] focus:outline-none focus:border-[#18181B] w-full"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
            >
              {DOC_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="doc-title" className="text-sm font-medium text-[#18181B]">Title</Label>
            <Input
              id="doc-title"
              placeholder="e.g. First Prize - Hackathon 2024"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 rounded-xl border-[#E4E4E7] bg-white focus:border-[#18181B] focus:ring-0 text-[#18181B] placeholder:text-[#A1A1AA]"
            />
          </div>

          {/* Description field for certificates/awards */}
          {showDescField && (
            <div className="grid gap-1.5">
              <Label htmlFor="doc-desc">Description of Achievement</Label>
              <Textarea
                id="doc-desc"
                placeholder="e.g. Won first place in a 48-hour hackathon organized by IEEE. Built a real-time collaboration tool using React and WebSockets."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {/* Upload Mode Toggle */}
          <div className="grid gap-2">
            <Label className="text-sm font-medium text-[#18181B]">Upload Method</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUploadMode("file")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border text-sm font-semibold transition-all",
                  uploadMode === "file"
                    ? "border-[#18181B] bg-[#18181B] text-white"
                    : "border-[#E4E4E7] text-[#71717A] hover:text-[#18181B] hover:border-[#A1A1AA]"
                )}
              >
                <Upload className="h-4 w-4" /> Upload File
              </button>
              <button
                type="button"
                onClick={() => setUploadMode("link")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border text-sm font-semibold transition-all",
                  uploadMode === "link"
                    ? "border-[#18181B] bg-[#18181B] text-white"
                    : "border-[#E4E4E7] text-[#71717A] hover:text-[#18181B] hover:border-[#A1A1AA]"
                )}
              >
                <Link2 className="h-4 w-4" /> Paste Link
              </button>
            </div>
          </div>

          {/* File Input */}
          {uploadMode === "file" && (
            <div className="grid gap-1.5">
              <Label htmlFor="doc-file">File</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="doc-file"
                  type="file"
                  accept={selectedDocOpt?.ext}
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="flex-1"
                />
                {file && (
                  <button type="button" onClick={() => setFile(null)}>
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
              {file && <p className="text-xs text-muted-foreground">{file.name} ({(file.size / 1024).toFixed(0)} KB)</p>}
            </div>
          )}

          {/* Link Input */}
          {uploadMode === "link" && (
            <div className="grid gap-1.5">
              <Label htmlFor="doc-link">Document URL</Label>
              <Input
                id="doc-link"
                type="url"
                placeholder="https://drive.google.com/file/... or any public link"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Paste a link to your document (Google Drive, Dropbox, direct URL, etc.)
              </p>
            </div>
          )}

          <button type="submit" disabled={uploading || !canSubmit} className="w-full bg-[#18181B] text-white font-semibold py-3 rounded-full hover:bg-[#27272A] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
            {uploading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</> : (uploadMode === "file" ? "Upload Document" : "Save Link")}
          </button>
        </div>
      </form>

      {/* Documents List */}
      <div>
        <h3 className="font-bold text-[#18181B] mb-3">Your Documents ({documents.length})</h3>
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && documents.length === 0 && (
          <p className="text-sm text-muted-foreground">No documents yet. Upload one above.</p>
        )}
        <div className="grid gap-3">
          {documents.map((doc: any) => {
            const st = STATUS_CONFIG[doc.verification_status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending
            const desc = doc.ocr_data?.description
            return (
              <div key={doc.id} className="rounded-xl border border-[#E4E4E7] bg-white px-4 py-3 hover:bg-[#F9F9FB] transition-colors">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{doc.title || doc.doc_type}</p>
                      {doc.file_url && doc.file_url.startsWith("http") && (
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                          className="text-primary hover:underline">
                          <Link2 className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">{doc.doc_type.replace("_", " ")} · {new Date(doc.created_at).toLocaleDateString("en-IN")}</p>
                  </div>
                  <div className="ml-3 shrink-0">
                    <span className={cn("flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full", st.color)}>
                      {st.icon} {st.label}
                    </span>
                  </div>
                </div>
                {desc && (
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{desc}</p>
                )}
                {doc.ocr_data?.extracted_student_name && (
                  <p className="text-xs font-medium text-primary mt-1">
                    Extracted: {doc.ocr_data.extracted_student_name}
                  </p>
                )}
                {doc.ocr_data?.match_error && (
                  <p className="text-[10px] text-destructive mt-0.5">{doc.ocr_data.match_error}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

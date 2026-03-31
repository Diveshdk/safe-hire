import { DocumentUploader } from "@/components/dashboard/document-uploader"

export default function DocumentsPage() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">Documents & Certificates</h1>
        <p className="text-muted-foreground mt-1 text-sm">Upload and manage your identity documents, certificates, and resume.</p>
      </div>
      <DocumentUploader />
    </div>
  )
}

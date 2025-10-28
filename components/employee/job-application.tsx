"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { 
  Send,
  Upload,
  FileText,
  AlertCircle
} from "lucide-react"

interface JobApplicationProps {
  jobId: string
}

export function JobApplication({ jobId }: JobApplicationProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [coverLetter, setCoverLetter] = useState("")
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type and size
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      const maxSize = 5 * 1024 * 1024 // 5MB
      
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please upload a PDF or Word document")
        return
      }
      
      if (file.size > maxSize) {
        toast.error("File size must be less than 5MB")
        return
      }
      
      setResumeFile(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!coverLetter.trim()) {
      toast.error("Please write a cover letter")
      return
    }

    setIsLoading(true)

    try {
      // Handle demo applications
      if (jobId.startsWith('demo-')) {
        // Simulate application submission for demo
        setTimeout(() => {
          toast.success("Demo application submitted successfully! In a real scenario, this would notify the recruiter.")
          setIsLoading(false)
          setCoverLetter("")
          setResumeFile(null)
        }, 2000)
        return
      }

      let resumeUrl = null
      
      // Upload resume if provided
      if (resumeFile) {
        const formData = new FormData()
        formData.append('file', resumeFile)
        formData.append('type', 'resume')
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json()
          resumeUrl = uploadResult.url
        } else {
          throw new Error('Failed to upload resume')
        }
      }

      // Submit application
      const response = await fetch('/api/jobs/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: jobId,
          cover_letter: coverLetter,
          resume_text: resumeUrl,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success("Application submitted successfully!")
        router.refresh()
      } else {
        throw new Error(result.error || 'Failed to submit application')
      }
    } catch (error) {
      console.error('Application error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit application')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apply for this Job</CardTitle>
        <CardDescription>
          Submit your application to get noticed by the recruiter
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cover Letter */}
          <div className="space-y-2">
            <Label htmlFor="cover-letter">
              Cover Letter <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="cover-letter"
              placeholder="Write a compelling cover letter explaining why you're the perfect fit for this role..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={6}
              className="resize-none"
              required
            />
            <p className="text-xs text-muted-foreground">
              {coverLetter.length}/1000 characters
            </p>
          </div>

          {/* Resume Upload */}
          <div className="space-y-2">
            <Label htmlFor="resume">
              Resume (Optional)
            </Label>
            <div className="flex items-center gap-4">
              <Input
                id="resume"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('resume')?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Choose File
              </Button>
              {resumeFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span>{resumeFile.name}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              PDF, DOC, or DOCX format. Max 5MB.
            </p>
          </div>

          {/* Important Note */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">Important Note</p>
              <p className="text-blue-700 mt-1">
                Make sure your profile is complete with accurate information. 
                Recruiters will review your profile along with this application.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !coverLetter.trim()}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Submit Application
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

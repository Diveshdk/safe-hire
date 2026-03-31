import { AiResumeReviewer } from "@/components/dashboard/ai-resume-reviewer"

export default function AiResumePage() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">AI Resume Reviewer</h1>
        <p className="text-muted-foreground mt-1 text-sm">Get AI-powered feedback and scoring for your resume.</p>
      </div>
      <AiResumeReviewer />
    </div>
  )
}

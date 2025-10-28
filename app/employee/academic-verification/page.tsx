import { EmployeeNavbar } from "@/components/employee/navbar"
import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  GraduationCap, 
  Upload, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  FileText,
  Award
} from "lucide-react"
import Link from "next/link"

import { AcademicVerificationForm } from "@/components/employee/academic-verification-form"

export default async function AcademicVerificationPage() {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/sign-in")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  // Get academic verifications
  const { data: verifications } = await supabase
    .from("verifications")
    .select("*")
    .eq("subject_user_id", user.id)
    .eq("type", "academic")
    .order("created_at", { ascending: false })

  return (
    <main className="min-h-dvh bg-background">
      <EmployeeNavbar profile={profile} />
      
      <section className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-primary" />
            Academic Verification
          </h1>
          <p className="text-muted-foreground mt-2">
            Upload and verify your educational certificates to build trust with employers
          </p>
        </div>

        <div className="grid gap-6">
          {/* Verification Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Verification Status
              </CardTitle>
              <CardDescription>
                Track the status of your academic credentials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {verifications && verifications.length > 0 ? (
                  verifications.map((verification: any) => (
                    <div key={verification.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{verification.document_type}</p>
                          <p className="text-sm text-muted-foreground">{verification.institution_name}</p>
                        </div>
                      </div>
                      <Badge variant={
                        verification.status === 'verified' ? 'default' :
                        verification.status === 'pending' ? 'secondary' : 'destructive'
                      }>
                        {verification.status === 'verified' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {verification.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                        {verification.status === 'rejected' && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {verification.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      No academic credentials uploaded yet. Add your first certificate below.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upload New Verification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Add New Academic Credential
              </CardTitle>
              <CardDescription>
                Upload your degree, diploma, or certification documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AcademicVerificationForm />
            </CardContent>
          </Card>

          {/* Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle>Verification Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p>Upload clear, readable images or PDFs of your original certificates</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p>Ensure all text and seals are clearly visible</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p>Documents will be verified within 2-3 business days</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p>All information provided should match your official documents</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}

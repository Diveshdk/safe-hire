import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, Building2, Calendar, Shield, CheckCircle2, XCircle, FileText } from "lucide-react"
import Link from "next/link"

async function verifyUniversityResult(hash: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/university/results/verify/${hash}`,
      {
        cache: "no-store",
      }
    )

    if (!res.ok) return null

    const data = await res.json()
    return data.ok ? data.result : null
  } catch (error) {
    console.error("Verification error:", error)
    return null
  }
}

export default async function VerifyUniversityResultPage({ params }: { params: { hash: string } }) {
  const result = await verifyUniversityResult(params.hash)

  if (!result) {
    return (
      <main className="min-h-dvh bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-red-500/20">
          <CardContent className="pt-6 text-center space-y-4">
            <XCircle className="h-16 w-16 text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold">Result Not Found</h1>
            <p className="text-muted-foreground">
              This university result could not be verified. It may not be activated yet or the verification hash is
              invalid.
            </p>
            <Button asChild>
              <Link href="/">Go to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-background flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center border-b">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
          </div>
          <Badge variant="outline" className="w-fit mx-auto mb-4 border-green-500/50 text-green-600">
            <Shield className="h-3 w-3 mr-1" />
            Verified University Result
          </Badge>
          <CardTitle className="text-2xl">Academic Result Verification</CardTitle>
          <CardDescription>Digitally verified with principal signature</CardDescription>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Student Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">Student Information</h3>
            <div className="p-4 rounded-lg border bg-muted/50">
              <p className="font-semibold text-lg">{result.student_name}</p>
              <p className="text-sm text-muted-foreground">
                SafeHire ID: <code className="font-mono">{result.student_safe_hire_id}</code>
              </p>
            </div>
          </div>

          {/* University & Course Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">University & Course</h3>
            <div className="p-4 rounded-lg border bg-muted/50 space-y-3">
              <div className="flex items-start gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{result.university_name}</p>
                  {result.university_code && (
                    <p className="text-xs text-muted-foreground">Code: {result.university_code}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <GraduationCap className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{result.course_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {result.academic_year}
                    {result.semester_year && ` · ${result.semester_year}`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Result Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">Result Details</h3>
            <div className="grid grid-cols-3 gap-4">
              {result.grade_cgpa && (
                <div className="p-4 rounded-lg border bg-primary/5 text-center">
                  <p className="text-xs text-muted-foreground mb-1">CGPA</p>
                  <p className="text-2xl font-bold text-primary">{result.grade_cgpa}</p>
                </div>
              )}
              {result.percentage && (
                <div className="p-4 rounded-lg border bg-primary/5 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Percentage</p>
                  <p className="text-2xl font-bold text-primary">{result.percentage}%</p>
                </div>
              )}
              {result.division_class && (
                <div className="p-4 rounded-lg border bg-primary/5 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Division</p>
                  <p className="text-sm font-semibold text-primary">{result.division_class}</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
              <Badge variant="outline">{result.result_type}</Badge>
              {result.result_status && (
                <Badge
                  variant="outline"
                  className={
                    result.result_status === "passed"
                      ? "border-green-500/50 text-green-600"
                      : "border-red-500/50 text-red-600"
                  }
                >
                  {result.result_status}
                </Badge>
              )}
            </div>
          </div>

          {/* Principal Verification */}
          {result.principal_name && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground">Principal Verification</h3>
              <div className="p-4 rounded-lg border bg-green-500/5 border-green-500/20 space-y-2">
                <div className="flex items-center gap-2 text-green-600">
                  <FileText className="h-4 w-4" />
                  <span className="font-semibold text-sm">Digitally Signed</span>
                </div>
                <p className="font-medium">{result.principal_name}</p>
                {result.principal_designation && (
                  <p className="text-sm text-muted-foreground">{result.principal_designation}</p>
                )}
                {result.principal_signature_timestamp && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Signed on {new Date(result.principal_signature_timestamp).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Verification Hashes */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">Security & Verification</h3>
            <div className="space-y-2">
              <div className="p-3 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Shield className="h-3 w-3" />
                  <span className="font-semibold">Verification Hash</span>
                </div>
                <code className="block text-xs break-all font-mono">{result.verification_hash}</code>
              </div>
              {result.immutable_record_hash && (
                <div className="p-3 rounded-lg border bg-muted/50">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Shield className="h-3 w-3" />
                    <span className="font-semibold">Immutable Record Hash</span>
                  </div>
                  <code className="block text-xs break-all font-mono">{result.immutable_record_hash}</code>
                </div>
              )}
            </div>
          </div>

          {/* Activation Info */}
          <div className="p-4 rounded-lg border bg-green-500/5 border-green-500/20">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-semibold text-sm">Activated & Verified</span>
            </div>
            <p className="text-xs text-muted-foreground">
              This result was activated on {new Date(result.activated_at).toLocaleDateString()} and is permanently
              recorded in the Safe Hire System.
            </p>
          </div>

          {/* Footer */}
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              This is an official verified academic record. Any tampering or forgery will be detected.
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

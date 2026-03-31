"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  GraduationCap,
  Building2,
  Calendar,
  FileText,
  Shield,
  CheckCircle2,
  Lock,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface UniversityResult {
  id: string
  university_name: string
  university_code?: string
  course_name: string
  academic_year: string
  semester_year?: string
  result_type: string
  grade_cgpa?: string
  percentage?: number
  division_class?: string
  result_status?: string
  principal_name?: string
  principal_designation?: string
  principal_verification_status: string
  university_verification_status: string
  is_active: boolean
  activated_at?: string
  verification_hash: string
  created_at: string
}

export function UniversityResultsSection({ userId }: { userId?: string }) {
  const [results, setResults] = useState<UniversityResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchResults()
  }, [userId])

  const fetchResults = async () => {
    setLoading(true)
    try {
      const url = userId ? `/api/university/results/list?user_id=${userId}` : "/api/university/results/list"
      const res = await fetch(url)
      const data = await res.json()
      if (data.ok) {
        setResults(data.results || [])
      }
    } catch (error) {
      console.error("Failed to fetch university results:", error)
    } finally {
      setLoading(false)
    }
  }

  const verifyResult = (hash: string) => {
    window.open(`/verify/university-result/${hash}`, "_blank")
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  const activeResults = results.filter((r) => r.is_active)
  const inactiveResults = results.filter((r) => !r.is_active)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          University Results
        </CardTitle>
        <CardDescription>
          {activeResults.length > 0
            ? `${activeResults.length} verified result${activeResults.length !== 1 ? "s" : ""}`
            : inactiveResults.length > 0
              ? "Results pending principal verification"
              : "No university results yet"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {results.length === 0 ? (
          <div className="text-center py-12">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium mb-1">University Results Section</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              This section will be activated once your university submits your results with principal
              verification
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active/Verified Results */}
            {activeResults.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <h3 className="font-semibold text-sm">Verified Results ({activeResults.length})</h3>
                </div>
                <div className="space-y-3">
                  {activeResults.map((result) => (
                    <ResultCard key={result.id} result={result} onVerify={verifyResult} />
                  ))}
                </div>
              </div>
            )}

            {/* Pending Results */}
            {inactiveResults.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-amber-500" />
                  <h3 className="font-semibold text-sm">Pending Verification ({inactiveResults.length})</h3>
                </div>
                <div className="space-y-3">
                  {inactiveResults.map((result) => (
                    <ResultCard key={result.id} result={result} onVerify={verifyResult} isPending />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ResultCard({
  result,
  onVerify,
  isPending = false,
}: {
  result: UniversityResult
  onVerify: (hash: string) => void
  isPending?: boolean
}) {
  return (
    <div
      className={cn(
        "border rounded-lg p-4 space-y-3",
        isPending
          ? "border-amber-500/20 bg-amber-500/5 opacity-75"
          : "border-green-500/20 bg-green-500/5 hover:shadow-md transition-shadow"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="h-4 w-4 text-primary shrink-0" />
            <h4 className="font-semibold text-sm truncate">{result.course_name}</h4>
          </div>
          <p className="text-xs text-muted-foreground">{result.university_name}</p>
        </div>
        {isPending ? (
          <Badge variant="outline" className="shrink-0 border-amber-500/50 text-amber-600">
            <Lock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        ) : (
          <Badge variant="outline" className="shrink-0 border-green-500/50 text-green-600">
            <Shield className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        )}
      </div>

      {/* Academic Details */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-muted-foreground">Academic Year:</span>
          <p className="font-medium">{result.academic_year}</p>
        </div>
        {result.semester_year && (
          <div>
            <span className="text-muted-foreground">Semester:</span>
            <p className="font-medium">{result.semester_year}</p>
          </div>
        )}
      </div>

      {/* Grades */}
      {!isPending && (
        <div className="grid grid-cols-3 gap-3 text-xs pt-2 border-t">
          {result.grade_cgpa && (
            <div>
              <span className="text-muted-foreground">CGPA:</span>
              <p className="font-semibold text-base text-primary">{result.grade_cgpa}</p>
            </div>
          )}
          {result.percentage && (
            <div>
              <span className="text-muted-foreground">Percentage:</span>
              <p className="font-semibold text-base text-primary">{result.percentage}%</p>
            </div>
          )}
          {result.division_class && (
            <div>
              <span className="text-muted-foreground">Division:</span>
              <p className="font-medium">{result.division_class}</p>
            </div>
          )}
        </div>
      )}

      {/* Principal Info */}
      {result.principal_name && (
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span>
              Verified by: <span className="font-medium">{result.principal_name}</span>
              {result.principal_designation && ` (${result.principal_designation})`}
            </span>
          </div>
        </div>
      )}

      {/* Verify Button */}
      {!isPending && (
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => onVerify(result.verification_hash)}
        >
          <ExternalLink className="h-3 w-3 mr-2" />
          Verify Result
        </Button>
      )}
    </div>
  )
}

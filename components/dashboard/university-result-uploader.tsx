"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { GraduationCap, Upload, Shield, CheckCircle2 } from "lucide-react"

const RESULT_TYPES = ["semester", "annual", "final", "transcript"] as const
const RESULT_STATUS = ["passed", "failed", "detained", "promoted"] as const

export function UniversityResultUploader() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { toast } = useToast()

  // Form state
  const [studentSafeHireId, setStudentSafeHireId] = useState("")
  const [universityName, setUniversityName] = useState("")
  const [universityCode, setUniversityCode] = useState("")
  const [courseName, setCourseName] = useState("")
  const [academicYear, setAcademicYear] = useState("")
  const [semesterYear, setSemesterYear] = useState("")
  const [resultType, setResultType] = useState<string>("semester")
  const [gradeCgpa, setGradeCgpa] = useState("")
  const [percentage, setPercentage] = useState("")
  const [divisionClass, setDivisionClass] = useState("")
  const [resultStatus, setResultStatus] = useState<string>("passed")
  const [documentUrl, setDocumentUrl] = useState("")
  
  // Principal signature
  const [principalName, setPrincipalName] = useState("")
  const [principalDesignation, setPrincipalDesignation] = useState("")
  const [hasPrincipalSignature, setHasPrincipalSignature] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!studentSafeHireId.trim() || !universityName.trim() || !courseName.trim() || !academicYear.trim()) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/university/results/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_safe_hire_id: studentSafeHireId.trim(),
          university_name: universityName.trim(),
          university_code: universityCode.trim() || undefined,
          course_name: courseName.trim(),
          academic_year: academicYear.trim(),
          semester_year: semesterYear.trim() || undefined,
          result_type: resultType,
          grade_cgpa: gradeCgpa.trim() || undefined,
          percentage: percentage ? parseFloat(percentage) : undefined,
          division_class: divisionClass.trim() || undefined,
          result_status: resultStatus,
          document_url: documentUrl.trim() || undefined,
          principal_signature_data: hasPrincipalSignature && principalName.trim()
            ? {
                name: principalName.trim(),
                designation: principalDesignation.trim(),
              }
            : undefined,
        }),
      })

      const data = await res.json()

      if (data.ok) {
        setSubmitted(true)
        toast({
          title: "Success",
          description: data.message,
        })
        
        // Reset form
        setStudentSafeHireId("")
        setCourseName("")
        setAcademicYear("")
        setSemesterYear("")
        setGradeCgpa("")
        setPercentage("")
        setDivisionClass("")
        setDocumentUrl("")
        setPrincipalName("")
        setPrincipalDesignation("")
        setHasPrincipalSignature(false)
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to submit university result",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          Upload University Results
        </CardTitle>
        <CardDescription>
          Submit academic results for students using their SafeHire ID
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Student Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="safe_hire_id">Student SafeHire ID *</Label>
                <Input
                  id="safe_hire_id"
                  placeholder="JS123456"
                  value={studentSafeHireId}
                  onChange={(e) => setStudentSafeHireId(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* University Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">University Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="university_name">University Name *</Label>
                <Input
                  id="university_name"
                  placeholder="e.g., ABC University"
                  value={universityName}
                  onChange={(e) => setUniversityName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="university_code">University Code</Label>
                <Input
                  id="university_code"
                  placeholder="e.g., UNI001"
                  value={universityCode}
                  onChange={(e) => setUniversityCode(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Academic Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Academic Details</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="course_name">Course Name *</Label>
                <Input
                  id="course_name"
                  placeholder="e.g., B.Tech Computer Science"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="academic_year">Academic Year *</Label>
                <Input
                  id="academic_year"
                  placeholder="e.g., 2023-2024"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="semester_year">Semester/Year</Label>
                <Input
                  id="semester_year"
                  placeholder="e.g., Semester 1, Year 2"
                  value={semesterYear}
                  onChange={(e) => setSemesterYear(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="result_type">Result Type *</Label>
                <Select value={resultType} onValueChange={setResultType}>
                  <SelectTrigger id="result_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESULT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Result Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Result Details</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="grade_cgpa">CGPA/Grade</Label>
                <Input
                  id="grade_cgpa"
                  placeholder="e.g., 8.5"
                  value={gradeCgpa}
                  onChange={(e) => setGradeCgpa(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="percentage">Percentage</Label>
                <Input
                  id="percentage"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 75.50"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="division_class">Division/Class</Label>
                <Input
                  id="division_class"
                  placeholder="e.g., First Class"
                  value={divisionClass}
                  onChange={(e) => setDivisionClass(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="result_status">Result Status</Label>
                <Select value={resultStatus} onValueChange={setResultStatus}>
                  <SelectTrigger id="result_status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESULT_STATUS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="document_url">Document URL (Optional)</Label>
              <Input
                id="document_url"
                placeholder="https://..."
                value={documentUrl}
                onChange={(e) => setDocumentUrl(e.target.value)}
              />
            </div>
          </div>

          {/* Principal Signature */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Principal Verification
              </h3>
              <Button
                type="button"
                variant={hasPrincipalSignature ? "secondary" : "outline"}
                size="sm"
                onClick={() => setHasPrincipalSignature(!hasPrincipalSignature)}
              >
                {hasPrincipalSignature ? "Remove Signature" : "Add Principal Signature"}
              </Button>
            </div>
            
            {hasPrincipalSignature && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="principal_name">Principal Name</Label>
                  <Input
                    id="principal_name"
                    placeholder="Dr. John Doe"
                    value={principalName}
                    onChange={(e) => setPrincipalName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="principal_designation">Designation</Label>
                  <Input
                    id="principal_designation"
                    placeholder="Principal / Dean"
                    value={principalDesignation}
                    onChange={(e) => setPrincipalDesignation(e.target.value)}
                  />
                </div>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              {hasPrincipalSignature
                ? "✅ Results will be activated immediately with principal signature"
                : "⚠️ Results will remain inactive until principal verification"}
            </p>
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? (
              "Submitting..."
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Submit University Result
              </>
            )}
          </Button>

          {submitted && (
            <div className="flex items-center gap-2 p-4 rounded-lg border border-green-500/20 bg-green-500/5 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <p className="text-sm font-medium">Result submitted successfully!</p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

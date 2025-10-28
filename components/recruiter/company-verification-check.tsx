"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { 
  Building, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  AlertTriangle 
} from "lucide-react"

interface CompanyVerificationCheckProps {
  company: any
}

export function CompanyVerificationCheck({ company }: CompanyVerificationCheckProps) {
  const [companyName, setCompanyName] = useState(company?.name || "")
  const [registrationNumber, setRegistrationNumber] = useState(company?.registration_number || "")
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const { toast } = useToast()
  const router = useRouter()

  const handleVerification = async () => {
    if (!companyName.trim() || !registrationNumber.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all company details",
        variant: "destructive",
      })
      return
    }

    setIsVerifying(true)
    setVerificationResult(null)

    try {
      const response = await fetch("/api/company/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyName,
          registration_number: registrationNumber,
        }),
      })

      const result = await response.json()
      setVerificationResult(result)

      if (result.success && result.verification_status === "verified") {
        toast({
          title: "Company Verified!",
          description: "Your company has been successfully verified.",
        })
        // Refresh the page to show dashboard
        setTimeout(() => {
          router.refresh()
        }, 2000)
      } else {
        toast({
          title: "Verification Failed",
          description: result.message || "Company verification failed. Please check your details.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify company. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>
      case "failed":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>
      case "pending":
        return <Badge variant="secondary"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Pending</Badge>
      default:
        return <Badge variant="outline">Not Started</Badge>
    }
  }

  return (
    <section className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-4">
          <Building className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Company Verification Required</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          To ensure the integrity of our platform, we need to verify your company's legitimacy 
          before you can start posting jobs and reviewing candidates.
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Business Verification
          </CardTitle>
          <CardDescription>
            Verify your company to gain access to the recruiter dashboard
          </CardDescription>
          {company && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm">Status:</span>
              {getStatusBadge(company.verification_status)}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {company?.verification_status === "failed" && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Previous verification failed. Please check your company details and try again.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter your company name"
                disabled={isVerifying || company?.verification_status === "verified"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registration-number">Registration Number</Label>
              <Input
                id="registration-number"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder="Enter company registration number"
                disabled={isVerifying || company?.verification_status === "verified"}
              />
              <p className="text-xs text-muted-foreground">
                This could be your CIN, LLP number, or other official registration number
              </p>
            </div>
          </div>

          {verificationResult && (
            <Alert className={verificationResult.success ? "border-green-200 dark:border-green-800" : "border-red-200 dark:border-red-800"}>
              {verificationResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              )}
              <AlertDescription>
                {verificationResult.message}
              </AlertDescription>
            </Alert>
          )}

          {company?.verification_status !== "verified" && (
            <Button 
              onClick={handleVerification}
              disabled={isVerifying}
              className="w-full"
              size="lg"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying Company...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Verify Company
                </>
              )}
            </Button>
          )}

          {company?.verification_status === "verified" && (
            <div className="text-center p-6 bg-green-50 dark:bg-green-900/10 rounded-lg">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-400 mb-2">
                Company Verified!
              </h3>
              <p className="text-green-600 dark:text-green-300 text-sm">
                Your company has been successfully verified. You now have access to the full recruiter dashboard.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  GraduationCap, 
  Plus, 
  CheckCircle, 
  AlertTriangle,
  Copy,
  ExternalLink
} from "lucide-react"
import Link from "next/link"

export default function DemoPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const createDemoInstitution = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/demo/create-institution', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setResult(data)
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError('Failed to create demo institution')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <main className="min-h-dvh bg-background">
      <section className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <GraduationCap className="h-10 w-10 text-primary" />
            Safe Hire Demo Setup
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Create a demo university account with pre-loaded certificates
          </p>
        </div>

        <div className="grid gap-6">
          {/* Demo Setup Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Demo Institution Account
              </CardTitle>
              <CardDescription>
                This will create a complete demo university account with login credentials and sample certificates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">What this creates:</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• Demo university account: <span className="font-mono">demo-university@safehire.com</span></li>
                    <li>• 6 sample certificates with unique NFT codes</li>
                    <li>• Complete institution dashboard access</li>
                    <li>• Ready-to-test verification system</li>
                  </ul>
                </div>

                <Button 
                  onClick={createDemoInstitution}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? "Creating Demo Account..." : "Create Demo Institution"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Success Result */}
          {result && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  Demo Institution Created Successfully!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Login Credentials */}
                <div className="p-4 bg-white rounded-lg border">
                  <h3 className="font-semibold mb-3 text-green-800">🔑 Login Credentials</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">Email:</span>
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-sm">{result.credentials.email}</code>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => copyToClipboard(result.credentials.email)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">Password:</span>
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-sm">{result.credentials.password}</code>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => copyToClipboard(result.credentials.password)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {result.email_confirmation_required && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800">
                        <strong>📧 Email Confirmation Required:</strong><br/>
                        Check your email inbox for a confirmation link before logging in.
                      </p>
                    </div>
                  )}
                  <div className="mt-4">
                    <Link href="/sign-in">
                      <Button className="w-full">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Go to Login Page
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Institution Info */}
                <div className="p-4 bg-white rounded-lg border">
                  <h3 className="font-semibold mb-3 text-green-800">🏫 Institution Details</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Name:</span> {result.institution.name}</p>
                    <p><span className="font-medium">Type:</span> {result.institution.type}</p>
                    <p><span className="font-medium">Certificates Created:</span> {result.certificates_created}</p>
                  </div>
                </div>

                {/* NFT Codes */}
                <div className="p-4 bg-white rounded-lg border">
                  <h3 className="font-semibold mb-3 text-green-800">🎫 Demo NFT Codes</h3>
                  <div className="space-y-3">
                    {result.nft_codes.map((cert: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{cert.recipient}</p>
                          <p className="text-xs text-muted-foreground truncate">{cert.certificate}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            {cert.nft_code}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => copyToClipboard(cert.nft_code)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Next Steps */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold mb-2 text-blue-800">📝 Next Steps:</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
                    <li>Login with the credentials above</li>
                    <li>Access the Institution Dashboard</li>
                    <li>Create a Job Seeker account to test verification</li>
                    <li>Use the NFT codes above with matching recipient names</li>
                    <li>Experience instant verification! ✨</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>How to Test the System</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">1. Institution Login</h3>
                    <p className="text-sm text-muted-foreground">
                      Use the demo credentials to access the institution dashboard and manage certificates.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">2. Job Seeker Testing</h3>
                    <p className="text-sm text-muted-foreground">
                      Create a job seeker account and test NFT verification with the provided codes.
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Important:</strong> Use exact recipient names (e.g., "John Doe") with their corresponding NFT codes for successful verification.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}

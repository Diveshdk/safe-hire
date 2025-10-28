"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, CheckCircle, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

export function CertificateCreateForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [generatedNftCode, setGeneratedNftCode] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    certificate_name: '',
    certificate_type: '',
    recipient_name: '',
    description: '',
    issue_date: new Date(),
    expiry_date: null as Date | null,
    metadata: {}
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/institution/certificates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          issue_date: formData.issue_date.toISOString().split('T')[0],
          expiry_date: formData.expiry_date ? formData.expiry_date.toISOString().split('T')[0] : null
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create certificate')
      }

      setSuccess(true)
      setGeneratedNftCode(data.data.nft_code)
      
      // Reset form
      setFormData({
        certificate_name: '',
        certificate_type: '',
        recipient_name: '',
        description: '',
        issue_date: new Date(),
        expiry_date: null,
        metadata: {}
      })

      // Redirect to certificates list after 3 seconds
      setTimeout(() => {
        router.push('/institution/certificates')
      }, 3000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <div className="space-y-2">
            <p className="font-medium">Certificate created successfully!</p>
            <p>NFT Code: <span className="font-mono font-bold">{generatedNftCode}</span></p>
            <p className="text-sm">The recipient can use this code to verify their certificate. Redirecting to certificates list...</p>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="certificate-name">Certificate Name *</Label>
          <Input
            id="certificate-name"
            placeholder="e.g., Bachelor of Computer Science"
            value={formData.certificate_name}
            onChange={(e) => setFormData(prev => ({ ...prev, certificate_name: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="certificate-type">Certificate Type *</Label>
          <Select
            value={formData.certificate_type}
            onValueChange={(value) => setFormData(prev => ({ ...prev, certificate_type: value }))}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select certificate type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="academic">Academic Degree</SelectItem>
              <SelectItem value="course">Course Completion</SelectItem>
              <SelectItem value="certification">Professional Certification</SelectItem>
              <SelectItem value="competition">Competition/Contest</SelectItem>
              <SelectItem value="achievement">Achievement/Award</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="recipient-name">Recipient Full Name *</Label>
        <Input
          id="recipient-name"
          placeholder="e.g., John Doe"
          value={formData.recipient_name}
          onChange={(e) => setFormData(prev => ({ ...prev, recipient_name: e.target.value }))}
          required
        />
        <p className="text-xs text-muted-foreground">
          This name will be used for verification. Make sure it matches the recipient's official documents.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe the certificate, requirements, or achievements..."
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Issue Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.issue_date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.issue_date ? format(formData.issue_date, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.issue_date}
                onSelect={(date) => date && setFormData(prev => ({ ...prev, issue_date: date }))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Expiry Date (Optional)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.expiry_date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.expiry_date ? format(formData.expiry_date, "PPP") : "No expiry"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.expiry_date || undefined}
                onSelect={(date) => setFormData(prev => ({ ...prev, expiry_date: date || null }))}
                disabled={(date) => date < formData.issue_date}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating Certificate..." : "Issue Certificate"}
      </Button>
    </form>
  )
}

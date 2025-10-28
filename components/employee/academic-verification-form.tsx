"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, CheckCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface AcademicVerificationFormProps {
  onSuccess?: () => void
}

export function AcademicVerificationForm({ onSuccess }: AcademicVerificationFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [nftVerified, setNftVerified] = useState(false)

  const [formData, setFormData] = useState({
    document_type: '',
    institution_name: '',
    field_of_study: '',
    year_completed: '',
    grade: '',
    notes: '',
    nft_code: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/academic/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit verification')
      }

      setSuccess(true)
      setNftVerified(result.nft_verified || false)
      setFormData({
        document_type: '',
        institution_name: '',
        field_of_study: '',
        year_completed: '',
        grade: '',
        notes: '',
        nft_code: ''
      })

      // Generate Safe Hire ID if this is their first verification
      try {
        await fetch('/api/profile/ensure-safe-id', {
          method: 'POST',
        })
      } catch (err) {
        console.log('Safe ID generation attempt:', err)
      }

      if (onSuccess) {
        onSuccess()
      }

      // Refresh the page to show the new verification
      setTimeout(() => {
        router.refresh()
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-6">
        <Alert className={nftVerified ? "border-green-200 bg-green-50" : undefined}>
          <CheckCircle className={`h-4 w-4 ${nftVerified ? "text-green-600" : ""}`} />
          <AlertDescription className={nftVerified ? "text-green-800" : undefined}>
            <strong>
              {nftVerified ? "Academic credential verified instantly!" : "Academic credential submitted successfully!"}
            </strong>
            <br />
            {nftVerified 
              ? "Your NFT code has been verified and your credential is now confirmed. Your Safe Hire ID has been updated."
              : "Your document has been submitted for verification. You'll receive an update within 2-3 business days. Your Safe Hire ID has been generated and will appear in your profile shortly."
            }
          </AlertDescription>
        </Alert>
        
        <div className="flex gap-4">
          <Button onClick={() => setSuccess(false)} variant="outline">
            Add Another Credential
          </Button>
          <Button asChild>
            <Link href="/employee/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="document_type">Document Type *</Label>
          <select 
            id="document_type"
            name="document_type"
            value={formData.document_type}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-input rounded-md bg-background"
            required
          >
            <option value="">Select document type</option>
            <option value="bachelor_degree">Bachelor's Degree</option>
            <option value="master_degree">Master's Degree</option>
            <option value="diploma">Diploma</option>
            <option value="certification">Professional Certification</option>
            <option value="phd">PhD</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="institution_name">Institution Name *</Label>
          <Input
            id="institution_name"
            name="institution_name"
            value={formData.institution_name}
            onChange={handleInputChange}
            placeholder="e.g., University of Delhi"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="field_of_study">Field of Study *</Label>
          <Input
            id="field_of_study"
            name="field_of_study"
            value={formData.field_of_study}
            onChange={handleInputChange}
            placeholder="e.g., Computer Science Engineering"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="year_completed">Year Completed *</Label>
          <Input
            id="year_completed"
            name="year_completed"
            type="number"
            min="1950"
            max={new Date().getFullYear()}
            value={formData.year_completed}
            onChange={handleInputChange}
            placeholder="2023"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="grade">Grade/CGPA (Optional)</Label>
        <Input
          id="grade"
          name="grade"
          value={formData.grade}
          onChange={handleInputChange}
          placeholder="e.g., 8.5 CGPA or First Class"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nft_code">NFT Verification Code (Optional)</Label>
        <Input
          id="nft_code"
          name="nft_code"
          value={formData.nft_code}
          onChange={handleInputChange}
          placeholder="e.g., ABC123XYZ789"
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">
          If your institution provided an NFT verification code, enter it here for instant verification.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="document">Upload Document</Label>
        <Input
          id="document"
          name="document"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
        />
        <p className="text-xs text-muted-foreground">
          Upload clear images or PDF of your certificate (Max 5MB) - Optional for demo
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes (Optional)</Label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          placeholder="Any additional information about this credential..."
          rows={3}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4">
        <Button type="submit" disabled={loading} className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          {loading ? "Submitting..." : "Submit for Verification"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/employee/dashboard">Cancel</Link>
        </Button>
      </div>
    </form>
  )
}

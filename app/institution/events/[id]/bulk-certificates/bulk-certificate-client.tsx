"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Trophy, 
  Users, 
  Plus,
  Download,
  AlertCircle,
  CheckCircle
} from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface Event {
  id: string
  title: string
  description: string
  event_type: string
  status: string
  event_date: string
  location: string
  participant_count: number
}

interface Certificate {
  id: string
  certificate_code: string
  certificate_title: string
  description: string
  is_claimed: boolean
  claimed_by_name: string | null
  created_at: string
}

interface BulkCertificateClientProps {
  eventId: string
}

export function BulkCertificateClient({ eventId }: BulkCertificateClientProps) {
  const router = useRouter()
  
  const [event, setEvent] = useState<Event | null>(null)
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  // Form state
  const [count, setCount] = useState("10")
  const [batchPrefix, setBatchPrefix] = useState("")
  
  useEffect(() => {
    fetchEventAndCertificates()
  }, [eventId])
  
  const fetchEventAndCertificates = async () => {
    try {
      // Fetch event details
      const eventResponse = await fetch(`/api/institution/events/${eventId}`)
      if (eventResponse.ok) {
        const eventData = await eventResponse.json()
        setEvent(eventData)
        setBatchPrefix(`${eventData.title.slice(0, 10).toUpperCase().replace(/\s+/g, '_')}_`)
      }
      
      // Fetch existing certificates for this event
      const certsResponse = await fetch(`/api/certificates/by-event/${eventId}`)
      if (certsResponse.ok) {
        const certsData = await certsResponse.json()
        setCertificates(certsData)
      }
    } catch (err) {
      setError("Failed to load event data")
    } finally {
      setLoading(false)
    }
  }
  
  const handleBulkCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError("")
    setSuccess("")
    
    try {
      const response = await fetch('/api/certificates/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: eventId,
          count: parseInt(count),
          batch_prefix: batchPrefix
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccess(data.message)
        await fetchEventAndCertificates() // Refresh the certificates list
        setCount("10") // Reset form
      } else {
        setError(data.error || "Failed to create certificates")
      }
    } catch (err) {
      setError("Failed to create certificates")
    } finally {
      setCreating(false)
    }
  }
  
  const exportCertificates = () => {
    const csvContent = [
      ['Certificate Code', 'Title', 'Description', 'Status', 'Claimed By', 'Created Date'].join(','),
      ...certificates.map(cert => [
        cert.certificate_code,
        `"${cert.certificate_title}"`,
        `"${cert.description}"`,
        cert.is_claimed ? 'Claimed' : 'Available',
        cert.claimed_by_name || '',
        new Date(cert.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${event?.title || 'event'}-certificates.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  if (loading) {
    return (
      <main className="flex-1 p-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">Loading...</div>
        </div>
      </main>
    )
  }
  
  if (!event) {
    return (
      <main className="flex-1 p-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center text-red-600">Event not found</div>
        </div>
      </main>
    )
  }

  const claimedCount = certificates.filter(cert => cert.is_claimed).length
  const availableCount = certificates.length - claimedCount
  
  return (
    <main className="flex-1 p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bulk Certificate Generation</h1>
            <p className="text-muted-foreground">
              Create multiple certificates for {event.title}
            </p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            Back to Events
          </Button>
        </div>

        {/* Event Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  {event.title}
                </CardTitle>
                <CardDescription>{event.description}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">{event.event_type}</Badge>
                <Badge variant={event.status === 'completed' ? 'default' : 'secondary'}>
                  {event.status}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Expected Participants</p>
                  <p className="text-sm text-muted-foreground">{event.participant_count}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Certificates Generated</p>
                  <p className="text-sm text-muted-foreground">{certificates.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Claimed / Available</p>
                  <p className="text-sm text-muted-foreground">{claimedCount} / {availableCount}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Bulk Certificate Creation Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Generate New Certificates
              </CardTitle>
              <CardDescription>
                Create multiple certificates at once for event participants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBulkCreate} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="count">Number of Certificates</Label>
                  <Input
                    id="count"
                    type="number"
                    min="1"
                    max="1000"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    placeholder="Enter number of certificates to create"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum 1000 certificates per batch
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="batch-prefix">Certificate Code Prefix</Label>
                  <Input
                    id="batch-prefix"
                    value={batchPrefix}
                    onChange={(e) => setBatchPrefix(e.target.value)}
                    placeholder="e.g., HACKATHON_2024_"
                  />
                  <p className="text-xs text-muted-foreground">
                    Prefix for certificate codes. Random codes will be appended.
                  </p>
                </div>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {success && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}
                
                <Button 
                  type="submit" 
                  disabled={creating || !count || parseInt(count) < 1}
                  className="w-full"
                >
                  {creating ? "Creating..." : `Generate ${count} Certificates`}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Certificate Statistics & Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Certificate Management
              </CardTitle>
              <CardDescription>
                View statistics and export certificate data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Certificates</span>
                    <Badge variant="secondary">{certificates.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Claimed</span>
                    <Badge variant="default">{claimedCount}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Available</span>
                    <Badge variant="outline">{availableCount}</Badge>
                  </div>
                </div>
                
                {certificates.length > 0 && (
                  <Button onClick={exportCertificates} variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export to CSV
                  </Button>
                )}
              </div>
              
              <div className="text-xs text-muted-foreground">
                <p>Certificate codes are automatically generated with unique identifiers.</p>
                <p>Participants can claim certificates using their codes at /claim.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Certificates */}
        {certificates.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Certificates ({certificates.length})</CardTitle>
              <CardDescription>
                Latest certificates generated for this event
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {certificates.slice(0, 20).map(cert => (
                  <div key={cert.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex-1">
                      <p className="font-mono text-sm">{cert.certificate_code}</p>
                      <p className="text-xs text-muted-foreground">{cert.certificate_title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {cert.is_claimed ? (
                        <Badge variant="default" className="text-xs">
                          Claimed by {cert.claimed_by_name}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Available</Badge>
                      )}
                    </div>
                  </div>
                ))}
                {certificates.length > 20 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Showing 20 of {certificates.length} certificates
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}

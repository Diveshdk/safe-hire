"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
  Award, 
  Plus, 
  ExternalLink, 
  Calendar, 
  Building, 
  GraduationCap,
  CheckCircle,
  X
} from "lucide-react"

interface Certificate {
  id: string
  certificate_id: string
  institution_name: string
  program_name: string
  program_type: string
  issue_date: string
  expiry_date?: string
  grade?: string
  skills?: string[]
  additional_info?: any
  blockchain_hash?: string
  ipfs_url?: string
  verification_status: 'verified' | 'pending' | 'failed'
}

interface NFTCertificatesProps {
  userId: string
}

export function NFTCertificates({ userId }: NFTCertificatesProps) {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [nftTokenId, setNftTokenId] = useState("")

  useEffect(() => {
    fetchCertificates()
  }, [])

  const fetchCertificates = async () => {
    try {
      const response = await fetch(`/api/certificates/nft?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setCertificates(data.certificates || [])
      }
    } catch (error) {
      console.error('Failed to fetch certificates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addNFTCertificate = async () => {
    if (!nftTokenId.trim()) {
      toast.error("Please enter an NFT Token ID")
      return
    }

    setIsAdding(true)
    try {
      const response = await fetch('/api/certificates/nft/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nftTokenId: nftTokenId.trim()
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success("NFT certificate added successfully!")
        setNftTokenId("")
        fetchCertificates() // Refresh the list
      } else {
        throw new Error(result.error || 'Failed to add NFT certificate')
      }
    } catch (error) {
      console.error('Add NFT certificate error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add NFT certificate')
    } finally {
      setIsAdding(false)
    }
  }

  const removeCertificate = async (certificateId: string) => {
    try {
      const response = await fetch(`/api/certificates/nft/${certificateId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success("Certificate removed successfully!")
        setCertificates(prev => prev.filter(cert => cert.id !== certificateId))
      } else {
        throw new Error('Failed to remove certificate')
      }
    } catch (error) {
      console.error('Remove certificate error:', error)
      toast.error('Failed to remove certificate')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending Verification</Badge>
      case 'failed':
        return <Badge variant="destructive">Verification Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            NFT Certificates
          </CardTitle>
          <CardDescription>
            Add your issued NFT certificates to display them on your profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5" />
          NFT Certificates
        </CardTitle>
        <CardDescription>
          Add your issued NFT certificates to display them on your profile
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Certificate */}
        <div className="border rounded-lg p-4 bg-blue-50/50">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add NFT Certificate
          </h4>
          
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="nftTokenId">NFT Token ID</Label>
              <Input
                id="nftTokenId"
                placeholder="Enter your NFT Token ID (e.g., 0x1234...abcd)"
                value={nftTokenId}
                onChange={(e) => setNftTokenId(e.target.value)}
                disabled={isAdding}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={addNFTCertificate}
                disabled={isAdding || !nftTokenId.trim()}
              >
                {isAdding ? 'Adding...' : 'Add Certificate'}
              </Button>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mt-2">
            Enter the NFT Token ID you received when your certificate was issued. 
            All certificate details will be automatically retrieved and verified.
          </p>
        </div>

        {/* Certificates List */}
        {certificates.length === 0 ? (
          <div className="text-center py-8">
            <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No NFT certificates added</h3>
            <p className="text-muted-foreground">
              Add your issued NFT certificates to showcase your verified credentials
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {certificates.map((certificate) => (
              <div key={certificate.id} className="border rounded-lg p-6 bg-gradient-to-r from-purple-50 to-blue-50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Award className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">{certificate.program_name}</h4>
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Building className="w-4 h-4" />
                        <span>{certificate.institution_name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <Badge variant="outline" className="capitalize">
                          <GraduationCap className="w-3 h-3 mr-1" />
                          {certificate.program_type}
                        </Badge>
                        {getStatusBadge(certificate.verification_status)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {certificate.ipfs_url && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(certificate.ipfs_url, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeCertificate(certificate.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Issue Date</p>
                    <p className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(certificate.issue_date)}
                    </p>
                  </div>
                  
                  {certificate.expiry_date && (
                    <div>
                      <p className="font-medium text-muted-foreground">Expiry Date</p>
                      <p className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(certificate.expiry_date)}
                      </p>
                    </div>
                  )}
                  
                  {certificate.grade && (
                    <div>
                      <p className="font-medium text-muted-foreground">Grade</p>
                      <p>{certificate.grade}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="font-medium text-muted-foreground">Certificate ID</p>
                    <p className="font-mono text-xs bg-white px-2 py-1 rounded">
                      {certificate.certificate_id}
                    </p>
                  </div>
                </div>

                {certificate.skills && certificate.skills.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium text-muted-foreground mb-2">Skills Certified</p>
                    <div className="flex flex-wrap gap-2">
                      {certificate.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {certificate.blockchain_hash && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="font-medium text-muted-foreground mb-1">Blockchain Verification</p>
                    <p className="font-mono text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      {certificate.blockchain_hash}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

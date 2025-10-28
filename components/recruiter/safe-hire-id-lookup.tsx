"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { VerifiedBadge } from "@/components/shared/verified-badge"
import { toast } from "sonner"
import { 
  Search, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap,
  Award,
  Calendar,
  Building,
  ExternalLink,
  Shield
} from "lucide-react"

interface ProfileData {
  id: string
  user_id: string
  full_name: string
  email: string
  phone?: string
  location?: string
  bio?: string
  skills?: string[]
  experience_years?: number
  education?: string
  aadhaar_verified: boolean
  safe_hire_id: string
  created_at: string
  nft_certificates?: Array<{
    id: string
    certificate_name: string
    certificate_type: string
    issue_date: string
    description?: string
    nft_code: string
    metadata?: any
  }>
}

export function SafeHireIDLookup() {
  const [safeHireId, setSafeHireId] = useState("")
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const searchProfile = async () => {
    if (!safeHireId.trim()) {
      toast.error("Please enter a Safe Hire ID")
      return
    }

    setIsLoading(true)
    setHasSearched(true)
    
    try {
      const response = await fetch(`/api/profiles/lookup/${encodeURIComponent(safeHireId.trim())}`)
      const result = await response.json()

      if (response.ok) {
        setProfile(result.profile)
        if (!result.profile) {
          toast.error("No profile found with this Safe Hire ID")
        }
      } else {
        throw new Error(result.error || 'Failed to search profile')
      }
    } catch (error) {
      console.error('Profile search error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to search profile')
      setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchProfile()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Safe Hire ID Lookup
          </CardTitle>
          <CardDescription>
            Search for job seekers by their Safe Hire ID to view their verified profile and credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="safeHireId">Safe Hire ID</Label>
              <Input
                id="safeHireId"
                placeholder="Enter Safe Hire ID (e.g., SH-JS-12345)"
                value={safeHireId}
                onChange={(e) => setSafeHireId(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={searchProfile}
                disabled={isLoading || !safeHireId.trim()}
              >
                {isLoading ? 'Searching...' : 'Search Profile'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Results */}
      {isLoading && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Searching for profile...</p>
          </CardContent>
        </Card>
      )}

      {hasSearched && !isLoading && !profile && (
        <Card>
          <CardContent className="text-center py-8">
            <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Profile Found</h3>
            <p className="text-muted-foreground">
              No job seeker found with Safe Hire ID: <code className="bg-muted px-2 py-1 rounded">{safeHireId}</code>
            </p>
          </CardContent>
        </Card>
      )}

      {profile && (
        <div className="space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile.full_name}`} />
                  <AvatarFallback className="text-xl">
                    {profile.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold">{profile.full_name}</h2>
                    {profile.aadhaar_verified && <VerifiedBadge />}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="font-mono">
                      <Shield className="w-3 h-3 mr-1" />
                      {profile.safe_hire_id}
                    </Badge>
                    <Badge variant="secondary">Job Seeker</Badge>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.email}</span>
                    </div>
                    
                    {profile.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{profile.phone}</span>
                      </div>
                    )}
                    
                    {profile.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    
                    {profile.experience_years && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                        <span>{profile.experience_years} years experience</span>
                      </div>
                    )}
                  </div>

                  {profile.bio && (
                    <div className="mt-4">
                      <p className="text-muted-foreground">{profile.bio}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Education */}
          {profile.education && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <GraduationCap className="w-5 h-5" />
                  Education
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{profile.education}</p>
              </CardContent>
            </Card>
          )}

          {/* NFT Certificates */}
          {profile.nft_certificates && profile.nft_certificates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Award className="w-5 h-5" />
                  Verified Certificates ({profile.nft_certificates.length})
                </CardTitle>
                <CardDescription>
                  Blockchain-verified credentials and certifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profile.nft_certificates.map((cert) => (
                    <div key={cert.id} className="border rounded-lg p-4 bg-gradient-to-r from-purple-50 to-blue-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Award className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{cert.certificate_name}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Building className="w-3 h-3" />
                              <span>NFT Code: {cert.nft_code}</span>
                            </div>
                          </div>
                        </div>
                        
                        <Badge variant="outline" className="capitalize">
                          {cert.certificate_type}
                        </Badge>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-muted-foreground">Issue Date</p>
                          <p className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(cert.issue_date)}
                          </p>
                        </div>
                        
                        {cert.description && (
                          <div>
                            <p className="font-medium text-muted-foreground">Description</p>
                            <p className="text-sm">{cert.description}</p>
                          </div>
                        )}
                      </div>

                      {cert.metadata?.skills && cert.metadata.skills.length > 0 && (
                        <div className="mt-3">
                          <p className="font-medium text-muted-foreground mb-2 text-sm">Skills Certified</p>
                          <div className="flex flex-wrap gap-1">
                            {cert.metadata.skills.map((skill: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Profile Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                <p>{formatDate(profile.created_at)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Verification Status</p>
                <div className="flex items-center gap-2">
                  {profile.aadhaar_verified ? (
                    <Badge className="bg-green-100 text-green-800">
                      <Shield className="w-3 h-3 mr-1" />
                      Aadhaar Verified
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Not Verified</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

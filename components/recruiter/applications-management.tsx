"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { VerifiedBadge } from "@/components/shared/verified-badge"
import { 
  User,
  MapPin,
  Briefcase,
  GraduationCap,
  Mail,
  Phone,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  Calendar,
  Award
} from "lucide-react"

interface Application {
  id: string
  status: string
  cover_letter: string
  resume_url?: string
  created_at: string
  jobs: {
    id: string
    title: string
    location?: string
    company_id: string
  }
  profiles: {
    id: string
    full_name?: string
    email?: string
    phone?: string
    location?: string
    skills?: string[]
    experience_years?: number
    education?: string
    bio?: string
    aadhaar_verified: boolean
    safe_hire_id?: string
  }
}

interface ApplicationsManagementProps {
  applications: Application[]
  companyId: string
}

export function ApplicationsManagement({ applications, companyId }: ApplicationsManagementProps) {
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false)
  const [decisionType, setDecisionType] = useState<'accept' | 'reject' | null>(null)
  const [rejectionReason1, setRejectionReason1] = useState("")
  const [rejectionReason2, setRejectionReason2] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const getStatusBadgeProps = (status: string) => {
    switch (status) {
      case "pending":
        return { variant: "secondary" as const, icon: Clock, text: "Pending" }
      case "accepted":
        return { variant: "default" as const, icon: CheckCircle, text: "Accepted" }  
      case "rejected":
        return { variant: "destructive" as const, icon: XCircle, text: "Rejected" }
      default:
        return { variant: "secondary" as const, icon: Clock, text: "Unknown" }
    }
  }

  const handleDecision = async () => {
    if (!selectedApplication || !decisionType) return
    
    if (decisionType === 'reject' && (!rejectionReason1.trim() || !rejectionReason2.trim())) {
      toast.error("Please provide both rejection reasons")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/applications/${selectedApplication.id}/decision`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: decisionType === 'accept' ? 'accepted' : 'rejected',
          rejectionReasons: decisionType === 'reject' ? [rejectionReason1, rejectionReason2] : undefined,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(`Application ${decisionType === 'accept' ? 'accepted' : 'rejected'} successfully!`)
        setIsDecisionModalOpen(false)
        setSelectedApplication(null)
        setDecisionType(null)
        setRejectionReason1("")
        setRejectionReason2("")
        router.refresh()
      } else {
        throw new Error(result.error || 'Failed to update application')
      }
    } catch (error) {
      console.error('Decision error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update application')
    } finally {
      setIsLoading(false)
    }
  }

  const openDecisionModal = (application: Application, type: 'accept' | 'reject') => {
    setSelectedApplication(application)
    setDecisionType(type)
    setIsDecisionModalOpen(true)
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
          <p className="text-muted-foreground">
            Applications will appear here when job seekers apply to your job postings
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Applications List */}
      <div className="grid gap-6">
        {applications.map((application) => {
          const statusProps = getStatusBadgeProps(application.status)
          const StatusIcon = statusProps.icon

          return (
            <Card key={application.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${application.profiles.full_name}`} />
                      <AvatarFallback>
                        {application.profiles.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">
                          {application.profiles.full_name || 'Anonymous User'}
                        </CardTitle>
                        {application.profiles.aadhaar_verified && (
                          <VerifiedBadge size="sm" />
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <span className="font-medium">{application.jobs.title}</span>
                        {application.jobs.location && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{application.jobs.location}</span>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Applied {new Date(application.created_at).toLocaleDateString()}</span>
                        </div>
                        {application.profiles.experience_years && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Briefcase className="w-3 h-3" />
                              <span>{application.profiles.experience_years} years exp</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusProps.variant}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusProps.text}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Cover Letter Preview */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Cover Letter</h4>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {application.cover_letter}
                    </p>
                  </div>

                  {/* Quick Info */}
                  {(application.profiles.email || application.profiles.location || application.profiles.skills) && (
                    <div className="flex items-center gap-6 text-xs text-muted-foreground">
                      {application.profiles.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span>{application.profiles.email}</span>
                        </div>
                      )}
                      {application.profiles.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{application.profiles.location}</span>
                        </div>
                      )}
                      {application.profiles.skills && application.profiles.skills.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          <span>{application.profiles.skills.slice(0, 3).join(', ')}</span>
                          {application.profiles.skills.length > 3 && <span>+{application.profiles.skills.length - 3}</span>}
                        </div>
                      )}
                    </div>
                  )}

                  <Separator />

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            View Profile
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              {application.profiles.full_name || 'Anonymous User'}
                              {application.profiles.aadhaar_verified && (
                                <VerifiedBadge size="sm" />
                              )}
                            </DialogTitle>
                            <DialogDescription>
                              Candidate profile and application details
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-6">
                            {/* Profile Info */}
                            <div className="grid grid-cols-2 gap-4">
                              {application.profiles.email && (
                                <div>
                                  <Label className="text-xs text-muted-foreground">Email</Label>
                                  <p className="text-sm">{application.profiles.email}</p>
                                </div>
                              )}
                              {application.profiles.phone && (
                                <div>
                                  <Label className="text-xs text-muted-foreground">Phone</Label>
                                  <p className="text-sm">{application.profiles.phone}</p>
                                </div>
                              )}
                              {application.profiles.location && (
                                <div>
                                  <Label className="text-xs text-muted-foreground">Location</Label>
                                  <p className="text-sm">{application.profiles.location}</p>
                                </div>
                              )}
                              {application.profiles.experience_years && (
                                <div>
                                  <Label className="text-xs text-muted-foreground">Experience</Label>
                                  <p className="text-sm">{application.profiles.experience_years} years</p>
                                </div>
                              )}
                            </div>

                            {application.profiles.bio && (
                              <div>
                                <Label className="text-xs text-muted-foreground">Bio</Label>
                                <p className="text-sm mt-1">{application.profiles.bio}</p>
                              </div>
                            )}

                            {application.profiles.education && (
                              <div>
                                <Label className="text-xs text-muted-foreground">Education</Label>
                                <p className="text-sm mt-1">{application.profiles.education}</p>
                              </div>
                            )}

                            {application.profiles.skills && application.profiles.skills.length > 0 && (
                              <div>
                                <Label className="text-xs text-muted-foreground">Skills</Label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {application.profiles.skills.map((skill, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            <Separator />

                            <div>
                              <Label className="text-xs text-muted-foreground">Cover Letter</Label>
                              <div className="bg-muted p-3 rounded-md mt-1">
                                <p className="text-sm whitespace-pre-wrap">{application.cover_letter}</p>
                              </div>
                            </div>

                            {application.resume_url && (
                              <div>
                                <Label className="text-xs text-muted-foreground">Resume</Label>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-1"
                                  onClick={() => window.open(application.resume_url, '_blank')}
                                >
                                  <FileText className="w-4 h-4 mr-2" />
                                  View Resume
                                </Button>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      {application.resume_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(application.resume_url, '_blank')}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Resume
                        </Button>
                      )}
                    </div>

                    {application.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDecisionModal(application, 'reject')}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => openDecisionModal(application, 'accept')}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Accept
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Decision Modal */}
      <Dialog open={isDecisionModalOpen} onOpenChange={setIsDecisionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decisionType === 'accept' ? 'Accept' : 'Reject'} Application
            </DialogTitle>
            <DialogDescription>
              {decisionType === 'accept' 
                ? 'Are you sure you want to accept this application?'
                : 'Please provide two reasons for rejecting this application. This will help generate constructive feedback for the candidate.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedApplication && (
              <div className="p-3 bg-muted rounded-md">
                <p className="font-medium">{selectedApplication.profiles.full_name}</p>
                <p className="text-sm text-muted-foreground">{selectedApplication.jobs.title}</p>
              </div>
            )}

            {decisionType === 'reject' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reason1">First Reason *</Label>
                  <Input
                    id="reason1"
                    placeholder="e.g., Insufficient experience"
                    value={rejectionReason1}
                    onChange={(e) => setRejectionReason1(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="reason2">Second Reason *</Label>
                  <Input
                    id="reason2"
                    placeholder="e.g., Missing required skills"
                    value={rejectionReason2}
                    onChange={(e) => setRejectionReason2(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDecisionModalOpen(false)
                  setSelectedApplication(null)
                  setDecisionType(null)
                  setRejectionReason1("")
                  setRejectionReason2("")
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDecision}
                disabled={isLoading || (decisionType === 'reject' && (!rejectionReason1.trim() || !rejectionReason2.trim()))}
                variant={decisionType === 'reject' ? 'destructive' : 'default'}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <>
                    {decisionType === 'accept' ? 'Accept Application' : 'Reject Application'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

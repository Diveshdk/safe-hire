"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, User, Mail, Shield, Hash } from "lucide-react"

interface UserInfo {
  email: string
  role: string
  safe_hire_id: string | null
  aadhaar_verified: boolean
}

export default function DebugPage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchUserInfo()
  }, [])

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/profile/me')
      if (response.ok) {
        const data = await response.json()
        setUserInfo(data)
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateRole = async (newRole: string) => {
    setUpdating(true)
    setMessage("")
    
    try {
      const response = await fetch('/api/profile/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userInfo?.email,
          new_role: newRole
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setMessage(`✅ Successfully updated role from "${data.old_role}" to "${data.new_role}"`)
        await fetchUserInfo() // Refresh user info
        
        // Redirect after a short delay
        setTimeout(() => {
          if (newRole === 'institution') {
            window.location.href = '/institution/dashboard'
          } else if (newRole === 'employer_admin') {
            window.location.href = '/recruiter/dashboard'
          } else {
            window.location.href = '/employee/dashboard'
          }
        }, 2000)
      } else {
        setMessage(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setMessage(`❌ Failed to update role: ${error}`)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading user information...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Role Debug & Update</h1>
          <p className="text-muted-foreground mt-2">
            Use this page to check and update your user role
          </p>
        </div>

        {userInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Current User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{userInfo.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Current Role</p>
                    <Badge variant={userInfo.role === 'institution' ? 'default' : 'secondary'}>
                      {userInfo.role}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Safe Hire ID</p>
                    <p className="text-sm text-muted-foreground">
                      {userInfo.safe_hire_id || 'Not generated'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Aadhaar Verified</p>
                    <Badge variant={userInfo.aadhaar_verified ? 'default' : 'outline'}>
                      {userInfo.aadhaar_verified ? 'Verified' : 'Not Verified'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Update Your Role</CardTitle>
            <CardDescription>
              If your role is incorrect, you can update it here
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Button
                variant={userInfo?.role === 'job_seeker' ? 'default' : 'outline'}
                onClick={() => updateRole('job_seeker')}
                disabled={updating}
                className="h-20 flex-col"
              >
                <User className="w-6 h-6 mb-2" />
                Job Seeker
              </Button>
              
              <Button
                variant={userInfo?.role === 'employer_admin' ? 'default' : 'outline'}
                onClick={() => updateRole('employer_admin')}
                disabled={updating}
                className="h-20 flex-col"
              >
                <Shield className="w-6 h-6 mb-2" />
                Recruiter
              </Button>
              
              <Button
                variant={userInfo?.role === 'institution' ? 'default' : 'outline'}
                onClick={() => updateRole('institution')}
                disabled={updating}
                className="h-20 flex-col"
              >
                <Hash className="w-6 h-6 mb-2" />
                Institution
              </Button>
            </div>
            
            {updating && (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating role...
              </div>
            )}
            
            {message && (
              <Alert>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  )
}

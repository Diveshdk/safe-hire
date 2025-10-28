import { EmployeeNavbar } from "@/components/employee/navbar"
import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { VerifiedBadge } from "@/components/shared/verified-badge"
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Briefcase, 
  GraduationCap,
  Edit,
  Shield,
  Award
} from "lucide-react"
import Link from "next/link"

export default async function EmployeeProfilePage() {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/sign-in")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  return (
    <main className="min-h-dvh bg-background">
      <EmployeeNavbar profile={profile} />
      
      <section className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <User className="h-8 w-8 text-primary" />
            My Profile
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your professional profile and verification status
          </p>
        </div>

        <div className="grid gap-6">
          {/* Profile Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Profile Information</span>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </CardTitle>
              <CardDescription>
                Your basic information and professional details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                    <p className="text-lg font-medium">{profile?.full_name || "Not provided"}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {user.email}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {profile?.phone || "Not provided"}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Experience</Label>
                    <p className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      {profile?.experience_years ? `${profile.experience_years} years` : "Not provided"}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Education</Label>
                    <p className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      {profile?.education || "Not provided"}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Skills</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {profile?.skills && profile.skills.length > 0 ? (
                        profile.skills.map((skill: string, index: number) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-muted-foreground">No skills added</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verification Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Verification Status
              </CardTitle>
              <CardDescription>
                Track your verification progress to build trust with employers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Aadhaar Verification</p>
                      <p className="text-sm text-muted-foreground">Identity verification with Aadhaar</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {profile?.aadhaar_verified ? (
                      <VerifiedBadge />
                    ) : (
                      <Button asChild size="sm">
                        <Link href="/aadhaar">Verify Now</Link>
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Academic Verification</p>
                      <p className="text-sm text-muted-foreground">Educational credentials verification</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href="/employee/academic-verification">Manage</Link>
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Safe Hire ID</p>
                      <p className="text-sm text-muted-foreground">Your unique professional identifier</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {profile?.safe_hire_id ? (
                      <Badge variant="default" className="font-mono">
                        {profile.safe_hire_id}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common profile-related tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button asChild variant="outline" className="justify-start">
                  <Link href="/aadhaar" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Verify Aadhaar
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="justify-start">
                  <Link href="/employee/academic-verification" className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Add Credentials
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="justify-start">
                  <Link href="/employee/jobs" className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Browse Jobs
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}

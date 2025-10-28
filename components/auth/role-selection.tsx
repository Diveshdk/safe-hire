"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Briefcase, Users, ArrowRight, GraduationCap } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleRoleSelect = async (role: string) => {
    setIsUpdating(true)
    
    try {
      const response = await fetch("/api/profile/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })

      if (!response.ok) {
        throw new Error("Failed to set role")
      }

      const roleNames = {
        "employer_admin": "Recruiter",
        "job_seeker": "Job Seeker", 
        "institution": "Institution"
      }

      toast({
        title: "Role Selected",
        description: `Welcome to Safe Hire as a ${roleNames[role as keyof typeof roleNames]}!`,
      })

      // Redirect based on role
      if (role === "employer_admin") {
        router.push("/recruiter/dashboard")
      } else if (role === "job_seeker") {
        router.push("/employee/dashboard")
      } else if (role === "institution") {
        router.push("/institution/dashboard")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set your role. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <main className="min-h-dvh bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center">
              <span className="text-primary font-bold text-lg">SH</span>
            </div>
            <span className="font-semibold text-xl">Safe Hire</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Choose Your Role</h1>
          <p className="text-muted-foreground">
            Select how you'll be using Safe Hire to get the right experience
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Recruiter Role */}
          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedRole === "employer_admin" ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setSelectedRole("employer_admin")}
          >
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-xl">I'm a Recruiter</CardTitle>
              <CardDescription>
                I represent a company and want to hire qualified candidates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  Verify company legitimacy
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  Post job openings
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  Review candidate credentials
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  Access AI-powered candidate insights
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Job Seeker Role */}
          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedRole === "job_seeker" ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setSelectedRole("job_seeker")}
          >
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-xl">I'm a Job Seeker</CardTitle>
              <CardDescription>
                I'm looking for job opportunities with verified companies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  Verify identity with Aadhaar
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  Get Safe Hire ID credential
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  Apply to verified companies
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  Get AI resume feedback
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Institution Role */}
          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedRole === "institution" ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setSelectedRole("institution")}
          >
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-xl">I'm an Institution</CardTitle>
              <CardDescription>
                I represent an educational institution or organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                  Create and manage events
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                  Issue NFT certificates
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                  Bulk certificate generation
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                  Track certificate claims
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {selectedRole && (
          <div className="flex justify-center mt-8">
            <Button 
              size="lg" 
              onClick={() => handleRoleSelect(selectedRole)}
              disabled={isUpdating}
              className="px-8"
            >
              {isUpdating ? (
                "Setting up your account..."
              ) : (
                <>
                  Continue as {
                    selectedRole === "employer_admin" ? "Recruiter" : 
                    selectedRole === "job_seeker" ? "Job Seeker" : 
                    "Institution"
                  }
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}

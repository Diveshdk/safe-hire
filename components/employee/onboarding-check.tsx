"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { VerifiedBadge } from "@/components/shared/verified-badge"
import { 
  Shield, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  User, 
  GraduationCap,
  ArrowRight
} from "lucide-react"
import Link from "next/link"

interface OnboardingCheckProps {
  profile: any
}

export function OnboardingCheck({ profile }: OnboardingCheckProps) {
  const [academicVerified, setAcademicVerified] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAcademicVerification = async () => {
      try {
        const response = await fetch('/api/academic/verify')
        if (response.ok) {
          const data = await response.json()
          setAcademicVerified(data.verifications && data.verifications.length > 0)
        }
      } catch (error) {
        console.error('Error checking academic verification:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAcademicVerification()
  }, [])

  const steps = [
    {
      id: "aadhaar",
      title: "Aadhaar Verification",
      description: "Verify your identity with Aadhaar",
      completed: profile?.aadhaar_verified,
      icon: Shield,
      href: "/aadhaar"
    },
    {
      id: "academic",
      title: "Academic Verification",
      description: "Upload and verify your educational certificates",
      completed: academicVerified,
      icon: GraduationCap,
      href: "/employee/academic-verification"
    },
    {
      id: "safe_id",
      title: "Safe Hire ID",
      description: "Get your digital credential",
      completed: !!profile?.safe_hire_id,
      icon: CheckCircle,
      href: null // Auto-generated after other steps
    }
  ]

  const completedSteps = steps.filter(step => step.completed).length
  const progress = (completedSteps / steps.length) * 100

  return (
    <section className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Complete Your Profile</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Complete these steps to get verified and start applying to jobs from trusted companies.
        </p>
      </div>

      {/* Progress Overview */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Onboarding Progress</CardTitle>
              <CardDescription>
                {completedSteps} of {steps.length} steps completed
              </CardDescription>
            </div>
            <Badge variant={completedSteps === steps.length ? "default" : "secondary"}>
              {Math.round(progress)}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="w-full" />
        </CardContent>
      </Card>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isCompleted = step.completed
          const canStart = index === 0 || steps[index - 1].completed

          return (
            <Card key={step.id} className={`transition-colors ${isCompleted ? 'border-green-200 dark:border-green-800' : canStart ? 'border-primary/20' : 'border-muted'}`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isCompleted 
                      ? 'bg-green-100 dark:bg-green-900/20' 
                      : canStart 
                        ? 'bg-primary/10' 
                        : 'bg-muted'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    ) : canStart ? (
                      <Icon className="w-6 h-6 text-primary" />
                    ) : (
                      <Clock className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{step.title}</h3>
                      {isCompleted && <VerifiedBadge size="sm" />}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>

                  <div>
                    {isCompleted ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    ) : canStart && step.href ? (
                      <Button asChild>
                        <Link href={step.href}>
                          Start
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    ) : canStart ? (
                      <Badge variant="secondary">
                        <Clock className="w-3 h-3 mr-1" />
                        Auto-Generated
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <Clock className="w-3 h-3 mr-1" />
                        Waiting
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Next Steps */}
      {completedSteps < steps.length && (
        <Alert className="mt-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Next step:</strong> Complete {steps.find(s => !s.completed)?.title} to continue your onboarding process.
          </AlertDescription>
        </Alert>
      )}

      {completedSteps === steps.length && (
        <Alert className="mt-8 border-green-200 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription>
            <strong>Profile Complete!</strong> You can now start applying to jobs from verified companies.
          </AlertDescription>
        </Alert>
      )}
    </section>
  )
}

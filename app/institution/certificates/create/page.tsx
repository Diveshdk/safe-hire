import { InstitutionNavbar } from "@/components/institution/navbar"
import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Award, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CertificateCreateForm } from "@/components/institution/certificate-create-form"

export default async function CreateCertificatePage() {
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

  if (profile?.role !== "institution") {
    redirect("/")
  }

  return (
    <main className="min-h-dvh bg-background">
      <InstitutionNavbar profile={profile} />
      
      <section className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Award className="h-8 w-8 text-primary" />
            Issue New Certificate
          </h1>
          <p className="text-muted-foreground mt-2">
            Create a new NFT-verified certificate for a student or participant
          </p>
        </div>

        <div className="grid gap-6">
          {/* Information Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Each certificate will be assigned a unique NFT code that recipients can use to verify their credentials. 
              Make sure all information is accurate before issuing.
            </AlertDescription>
          </Alert>

          {/* Certificate Creation Form */}
          <Card>
            <CardHeader>
              <CardTitle>Certificate Details</CardTitle>
              <CardDescription>
                Fill in the details for the new certificate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CertificateCreateForm />
            </CardContent>
          </Card>

          {/* Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle>Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p>Ensure the recipient name matches exactly as it appears on their official documents</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p>Choose an appropriate certificate type to help with categorization</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p>Add detailed descriptions to help recipients understand the certificate value</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p>Set expiry dates for time-sensitive certifications (optional)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}

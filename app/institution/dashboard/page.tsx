import { InstitutionNavbar } from "@/components/institution/navbar"
import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Award, 
  Plus, 
  FileText, 
  Users, 
  CheckCircle, 
  Clock,
  Shield,
  GraduationCap
} from "lucide-react"
import Link from "next/link"
import { DemoCertificatesButton } from "@/components/institution/demo-certificates-button"

export default async function InstitutionDashboard() {
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

  // Get certificates issued by this institution
  const { data: certificates } = await supabase
    .from("nft_certificates")
    .select("*")
    .eq("institution_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10)

  const totalCertificates = certificates?.length || 0
  const activeCertificates = certificates?.filter(cert => cert.is_active)?.length || 0
  const recentCertificates = certificates?.slice(0, 5) || []

  return (
    <main className="min-h-dvh bg-background">
      <InstitutionNavbar profile={profile} />
      
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-primary" />
            Institution Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Issue and manage NFT-verified certificates for students and participants
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Certificates</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCertificates}</div>
              <p className="text-xs text-muted-foreground">
                Certificates issued
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Certificates</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCertificates}</div>
              <p className="text-xs text-muted-foreground">
                Currently valid
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verification Requests</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Pending verifications
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">NFT Security</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Active</div>
              <p className="text-xs text-muted-foreground">
                Blockchain verified
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Common tasks for certificate management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link href="/institution/certificates/create">
                  <Button className="w-full justify-start" variant="outline">
                    <Award className="h-4 w-4 mr-2" />
                    Issue New Certificate
                  </Button>
                </Link>
                <Link href="/institution/certificates">
                  <Button className="w-full justify-start" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Manage Certificates
                  </Button>
                </Link>
                <Link href="/institution/verification-requests">
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    View Verification Requests
                  </Button>
                </Link>
                <DemoCertificatesButton totalCertificates={totalCertificates} />
              </div>
            </CardContent>
          </Card>

          {/* Recent Certificates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Certificates
              </CardTitle>
              <CardDescription>
                Recently issued certificates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCertificates.length > 0 ? (
                  recentCertificates.map((cert: any) => (
                    <div key={cert.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{cert.certificate_name}</p>
                        <p className="text-sm text-muted-foreground">{cert.recipient_name}</p>
                        <p className="text-xs text-muted-foreground">NFT: {cert.nft_code}</p>
                      </div>
                      <Badge variant={cert.is_active ? "default" : "secondary"}>
                        {cert.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <GraduationCap className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No certificates issued yet</p>
                    <p className="text-sm">Create your first certificate to get started</p>
                  </div>
                )}
              </div>
              {recentCertificates.length > 0 && (
                <div className="mt-4">
                  <Link href="/institution/certificates">
                    <Button variant="outline" className="w-full">
                      View All Certificates
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}

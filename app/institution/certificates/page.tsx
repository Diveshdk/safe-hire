import { InstitutionNavbar } from "@/components/institution/navbar"
import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  Plus, 
  Calendar,
  User,
  Hash,
  Award
} from "lucide-react"
import Link from "next/link"

export default async function CertificatesPage() {
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

  // Get all certificates for this institution
  const { data: certificates } = await supabase
    .from("nft_certificates")
    .select("*")
    .eq("institution_id", user.id)
    .order("created_at", { ascending: false })

  const getCertificateTypeColor = (type: string) => {
    switch (type) {
      case 'academic': return 'bg-blue-100 text-blue-800'
      case 'certification': return 'bg-green-100 text-green-800'
      case 'course': return 'bg-purple-100 text-purple-800'
      case 'competition': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <main className="min-h-dvh bg-background">
      <InstitutionNavbar profile={profile} />
      
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              Certificates
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage all issued certificates and NFT codes
            </p>
          </div>
          <Link href="/institution/certificates/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Issue New Certificate
            </Button>
          </Link>
        </div>

        {certificates && certificates.length > 0 ? (
          <div className="grid gap-6">
            {certificates.map((cert: any) => (
              <Card key={cert.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        {cert.certificate_name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {cert.description}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getCertificateTypeColor(cert.certificate_type)}>
                        {cert.certificate_type}
                      </Badge>
                      <Badge variant={cert.is_active ? "default" : "secondary"}>
                        {cert.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Recipient</p>
                        <p className="text-sm text-muted-foreground">{cert.recipient_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">NFT Code</p>
                        <p className="text-sm font-mono text-muted-foreground">{cert.nft_code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Issue Date</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(cert.issue_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Expiry Date</p>
                        <p className="text-sm text-muted-foreground">
                          {cert.expiry_date ? new Date(cert.expiry_date).toLocaleDateString() : 'No expiry'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {cert.metadata && Object.keys(cert.metadata).length > 0 && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-2">Additional Details:</p>
                      <div className="grid gap-1 text-sm">
                        {Object.entries(cert.metadata).map(([key, value]) => (
                          <div key={key} className="flex gap-2">
                            <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                            <span className="text-muted-foreground">{JSON.stringify(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No certificates issued yet</h3>
              <p className="text-muted-foreground text-center mb-6">
                Start issuing certificates to students and participants to build your credential database.
              </p>
              <Link href="/institution/certificates/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Issue Your First Certificate
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  )
}

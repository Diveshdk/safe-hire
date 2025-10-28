import { InstitutionNavbar } from "@/components/institution/navbar"
import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BulkCertificateClient } from "./bulk-certificate-client"

interface BulkCertificatesPageProps {
  params: {
    id: string
  }
}

export default async function BulkCertificatesPage({ params }: BulkCertificatesPageProps) {
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
    <div className="flex min-h-screen flex-col">
      <InstitutionNavbar profile={profile} />
      <BulkCertificateClient eventId={params.id} />
    </div>
  )
}

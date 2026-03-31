import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CertificateDistributor } from "@/components/dashboard/certificate-distributor"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Trophy, Users, Award } from "lucide-react"
import Link from "next/link"

export default async function EventDetailsPage({ params }: { params: { id: string } }) {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/sign-in")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle()

  if (profile?.role !== "organisation") redirect("/dashboard")

  // Fetch event details
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", params.id)
    .eq("org_user_id", user.id)
    .maybeSingle()

  if (!event) {
    redirect("/dashboard/organisation/events")
  }

  return (
    <main className="min-h-dvh bg-background">
      <div className="container max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/organisation/events">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Link>
          </Button>
        </div>

        {/* Event Details Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{event.title}</CardTitle>
                <CardDescription>{event.achievement}</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                Event ID: {event.id.slice(0, 8)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Event Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <Award className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{event.total_certificates_issued || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Issued</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <Trophy className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">{event.winner_certificates_issued || 0}</p>
                  <p className="text-xs text-muted-foreground">Winners</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <Users className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{event.participant_certificates_issued || 0}</p>
                  <p className="text-xs text-muted-foreground">Participants</p>
                </div>
              </div>
            </div>

            {/* Event Metadata */}
            <div className="pt-4 border-t space-y-2 text-sm">
              {event.event_date && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Event Date: {new Date(event.event_date).toLocaleDateString()}</span>
                </div>
              )}
              {event.event_type && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="font-medium">Type:</span>
                  <Badge variant="secondary">{event.event_type}</Badge>
                </div>
              )}
              {event.event_description && (
                <p className="text-muted-foreground">{event.event_description}</p>
              )}
            </div>

            {/* Custom Fields */}
            {event.custom_fields && Array.isArray(event.custom_fields) && event.custom_fields.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Custom Fields:</p>
                <div className="flex flex-wrap gap-2">
                  {event.custom_fields.map((field: any, idx: number) => (
                    <Badge key={idx} variant="outline">
                      {typeof field === "string" ? field : field.name || `Field ${idx + 1}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Certificate Distribution */}
        <CertificateDistributor eventId={event.id} eventTitle={event.title} />
      </div>
    </main>
  )
}

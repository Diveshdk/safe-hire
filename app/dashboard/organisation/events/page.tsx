import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Calendar, Award, Trophy, Users, ArrowRight } from "lucide-react"
import Link from "next/link"

export default async function OrganisationEventsPage() {
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

  // Fetch all events
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("org_user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <main className="min-h-dvh bg-background">
      <div className="container max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Events & Certificates</h1>
            <p className="text-muted-foreground">Manage events and distribute certificates</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/organisation/events/create">
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Event
            </Link>
          </Button>
        </div>

        {/* Events List */}
        {!events || events.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium mb-1">No events yet</p>
              <p className="text-xs text-muted-foreground mb-4">
                Create your first event to start distributing certificates
              </p>
              <Button asChild>
                <Link href="/dashboard/organisation/events/create">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Your First Event
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((event) => (
              <Card key={event.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{event.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{event.achievement}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded bg-primary/5">
                      <p className="text-lg font-bold text-primary">{event.total_certificates_issued || 0}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div className="p-2 rounded bg-amber-500/5">
                      <p className="text-lg font-bold text-amber-600">{event.winner_certificates_issued || 0}</p>
                      <p className="text-xs text-muted-foreground">Winners</p>
                    </div>
                    <div className="p-2 rounded bg-blue-500/5">
                      <p className="text-lg font-bold text-blue-600">
                        {event.participant_certificates_issued || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Participants</p>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {event.event_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(event.event_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {event.event_type && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {event.event_type}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/dashboard/organisation/events/${event.id}`}>
                      Distribute Certificates
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

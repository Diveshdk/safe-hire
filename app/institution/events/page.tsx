import { InstitutionNavbar } from "@/components/institution/navbar"
import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  Plus, 
  Users, 
  Trophy,
  MapPin,
  Clock
} from "lucide-react"
import Link from "next/link"

export default async function EventsPage() {
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

  // Get events for this institution
  const { data: events } = await supabase
    .from("institution_events")
    .select("*")
    .eq("institution_id", user.id)
    .order("event_date", { ascending: false })

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'hackathon': return 'bg-purple-100 text-purple-800'
      case 'competition': return 'bg-orange-100 text-orange-800'
      case 'exam': return 'bg-blue-100 text-blue-800'
      case 'graduation': return 'bg-green-100 text-green-800'
      case 'workshop': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800'
      case 'ongoing': return 'bg-green-100 text-green-800' 
      case 'completed': return 'bg-gray-100 text-gray-800'
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
              <Calendar className="h-8 w-8 text-primary" />
              Events & Competitions
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage hackathons, competitions, exams, and generate bulk certificates
            </p>
          </div>
          <Link href="/institution/events/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </Link>
        </div>

        {events && events.length > 0 ? (
          <div className="grid gap-6">
            {events.map((event: any) => (
              <Card key={event.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5" />
                        {event.event_name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {event.description}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getEventTypeColor(event.event_type)}>
                        {event.event_type}
                      </Badge>
                      <Badge className={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Event Date</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.event_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Location</p>
                        <p className="text-sm text-muted-foreground">{event.location || 'Online'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Participants</p>
                        <p className="text-sm text-muted-foreground">
                          {event.current_participants || 0}
                          {event.max_participants ? ` / ${event.max_participants}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Created</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <Link href={`/institution/events/${event.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/institution/events/${event.id}/certificates`}>
                      <Button variant="outline" size="sm">
                        Manage Certificates
                      </Button>
                    </Link>
                    {event.status === 'completed' && (
                      <Link href={`/institution/events/${event.id}/bulk-certificates`}>
                        <Button size="sm">
                          Generate Certificates
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No events created yet</h3>
              <p className="text-muted-foreground text-center mb-6">
                Create your first event to start organizing hackathons, competitions, or academic ceremonies.
              </p>
              <Link href="/institution/events/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Event
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  Briefcase,
  MessageSquare,
  User
} from "lucide-react"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  created_at: string
  data?: {
    job_title?: string
    company_name?: string
    applicant_name?: string
    ai_response?: string
  }
}

interface NotificationsProps {
  userId: string
  userRole: string
}

export function Notifications({ userId, userRole }: NotificationsProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setUnreadCount(data.notifications.filter((n: Notification) => !n.read).length)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notification_ids: [notificationId],
        }),
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    if (unreadIds.length === 0) return

    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notification_ids: unreadIds,
        }),
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification => ({ ...notification, read: true }))
        )
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "application_accepted":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case "application_rejected":
        return <XCircle className="w-5 h-5 text-red-600" />
      case "new_application":
        return <User className="w-5 h-5 text-blue-600" />
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />
    }
  }

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case "application_accepted":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Accepted</Badge>
      case "application_rejected":
        return <Badge variant="destructive">Rejected</Badge>
      case "new_application":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">New Application</Badge>
      default:
        return <Badge variant="secondary">Update</Badge>
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
        <CardDescription>
          Stay updated on your {userRole === 'job_seeker' ? 'applications' : 'job postings'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No notifications</h3>
            <p className="text-muted-foreground text-sm">
              You'll see updates about your {userRole === 'job_seeker' ? 'job applications' : 'job postings'} here
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    notification.read 
                      ? 'bg-background' 
                      : 'bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        {getNotificationBadge(notification.type)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      
                      {/* Job/Company info */}
                      {notification.data && (
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                          {notification.data.job_title && (
                            <div className="flex items-center gap-1">
                              <Briefcase className="w-3 h-3" />
                              <span>{notification.data.job_title}</span>
                            </div>
                          )}
                          {notification.data.company_name && (
                            <span>at {notification.data.company_name}</span>
                          )}
                          {notification.data.applicant_name && (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>{notification.data.applicant_name}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* AI Response for rejections */}
                      {notification.data?.ai_response && (
                        <div className="mt-2 p-3 bg-muted rounded-md">
                          <div className="flex items-center gap-1 mb-2">
                            <MessageSquare className="w-3 h-3" />
                            <span className="text-xs font-medium">Feedback</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {notification.data.ai_response}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.created_at).toLocaleString()}
                        </span>
                        <div className="flex items-center gap-2">
                          {/* Action buttons for application notifications */}
                          {(notification.type === 'application_received' || 
                            notification.title.toLowerCase().includes('application') ||
                            notification.message.toLowerCase().includes('applied')) && 
                            userRole === 'recruiter' && (
                            <Link href="/recruiter/applications">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async (e) => {
                                  console.log('Marking notification as read...')
                                  await markAsRead(notification.id)
                                }}
                                className="text-xs h-6"
                              >
                                View Applications
                              </Button>
                            </Link>
                          )}
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs h-6"
                            >
                              Mark as read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

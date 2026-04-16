import React, { createContext, useContext, useEffect, useState } from 'react'
import { Notification, notificationService } from '../utils/notifications'
import { useAuth } from './AuthContext'

export type TabKey = 'home' | 'announcements' | 'events' | 'profile'

interface NotificationContextType {
  unreadCounts: Record<TabKey, number>
  clearUnread: (tab: TabKey) => void
  markAllAsRead: (tab?: TabKey) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
)

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth()
  const [unreadCounts, setUnreadCounts] = useState<Record<TabKey, number>>({
    home: 0,
    announcements: 0,
    events: 0,
    profile: 0,
  })

  const getTabFromType = (type: Notification['type']): TabKey => {
    switch (type) {
      case 'announcement':
        return 'announcements'
      case 'event':
        return 'events'
      case 'user':
        return 'profile'
      default:
        return 'home'
    }
  }

  const computeCounts = (
    notifications: Notification[]
  ): Record<TabKey, number> => {
    const counts = { home: 0, announcements: 0, events: 0, profile: 0 }
    notifications.forEach((n) => {
      if (!n.read) {
        counts[getTabFromType(n.type)]++
      }
    })
    return counts
  }

  useEffect(() => {
    if (!user) {
      setUnreadCounts({ home: 0, announcements: 0, events: 0, profile: 0 })
      return
    }

    const unsubscribe = notificationService.listenForNotifications(
      user.uid,
      (notifications) => {
        setUnreadCounts(computeCounts(notifications))
      }
    )

    return unsubscribe
  }, [user])

  const clearUnread = async (tab: TabKey) => {
    if (!user) return
    let types: Notification['type'][] = []
    if (tab === 'announcements') types = ['announcement']
    else if (tab === 'events') types = ['event']
    else if (tab === 'profile') types = ['user']
    else types = ['attendance', 'system']

    await notificationService.markNotificationsAsReadByTypes(user.uid, types)
  }

  const markAllAsRead = async (tab?: TabKey) => {
    if (!user) return
    if (tab) await clearUnread(tab)
    else await notificationService.markAllAsRead(user.uid)
  }

  return (
    <NotificationContext.Provider
      value={{ unreadCounts, clearUnread, markAllAsRead }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext)
  if (!ctx)
    throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}

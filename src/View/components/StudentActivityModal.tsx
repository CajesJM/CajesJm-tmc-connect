import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useMemo } from 'react'
import {
  FlatList,
  Modal,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native'
import { ThemeColors, useTheme } from '../../Controller/context/ThemeContext'

interface ActivityItem {
  id: string
  type: 'announcement' | 'event'
  title: string
  date: Date
  createdAt?: Date
  eventDate?: Date
  location?: string
  author?: string
}

interface StudentActivityModalProps {
  visible: boolean
  onClose: () => void
  announcements: ActivityItem[]
  events: ActivityItem[]
}

interface ActivityRowProps {
  item: ActivityItem
  colors: ThemeColors
  isDark: boolean
  isMobile: boolean
}

const ensureDate = (value: any): Date => {
  if (!value) return new Date()
  if (value instanceof Date) return value
  if (typeof value === 'number') return new Date(value)
  if (typeof value === 'string') return new Date(value)
  if (value.toDate) return value.toDate()
  if (value.seconds) return new Date(value.seconds * 1000)
  return new Date(value)
}

// Formatting functions
const formatDateTime = (date: Date): string => {
  if (!(date instanceof Date) || isNaN(date.getTime())) return 'Invalid date'
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatTimeAgo = (date: Date): string => {
  if (!(date instanceof Date) || isNaN(date.getTime())) return 'Invalid date'
  const diffMs = Date.now() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  if (diffSecs < 60) return `${diffSecs}s ago`
  const diffMins = Math.floor(diffSecs / 60)
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

// Memoized row component with proper typing
const ActivityRow = React.memo(
  ({ item, colors, isDark, isMobile }: ActivityRowProps) => {
    const date = ensureDate(item.date)
    const eventDate = item.eventDate ? ensureDate(item.eventDate) : undefined

    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          marginHorizontal: isMobile ? 16 : 20,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: `${colors.accent.primary}20`,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
          }}
        >
          {item.type === 'announcement' ? (
            <Feather name='bell' size={20} color={colors.accent.primary} />
          ) : (
            <Feather name='calendar' size={20} color={colors.accent.primary} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: colors.text,
            }}
          >
            {item.title}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: colors.sidebar.text.secondary,
              marginTop: 2,
            }}
          >
            {item.type === 'event' ? (
              <>
                Event on {formatDateTime(eventDate || date)}
                {item.location && ` • ${item.location}`}
                {'\n'}
                Created {formatTimeAgo(date)}
              </>
            ) : (
              <>
                Posted {formatTimeAgo(date)}
                {item.author && ` • ${item.author}`}
              </>
            )}
          </Text>
        </View>
      </View>
    )
  }
)

export const StudentActivityModal: React.FC<StudentActivityModalProps> = ({
  visible,
  onClose,
  announcements = [],
  events = [],
}) => {
  const { colors, isDark } = useTheme()
  const { width, height } = useWindowDimensions()
  const isMobile = width < 768

  // Process and sort activities
  const activities = useMemo(() => {
    const raw = [
      ...announcements.map((a) => ({ ...a, date: ensureDate(a.date) })),
      ...events.map((e) => ({
        ...e,
        date: ensureDate(e.date || e.eventDate || new Date()),
        eventDate: e.eventDate ? ensureDate(e.eventDate) : undefined,
      })),
    ]
    return raw.sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [announcements, events])

  const modalWidth = isMobile ? width - 32 : Math.min(500, width * 0.8)
  const maxHeight = height * 0.8

  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <TouchableWithoutFeedback>
            <View
              style={{
                width: modalWidth,
                maxHeight: maxHeight,
                backgroundColor: colors.card,
                borderRadius: 24,
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
                flex: 1,
              }}
            >
              <LinearGradient
                colors={
                  isDark ? ['#0f172a', '#1e293b'] : ['#1e40af', '#3b82f6']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  padding: isMobile ? 16 : 20,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{ fontSize: 18, fontWeight: '700', color: '#ffffff' }}
                >
                  Recent Activity
                </Text>
                <TouchableOpacity onPress={onClose}>
                  <Feather name='x' size={24} color='#ffffff' />
                </TouchableOpacity>
              </LinearGradient>

              {activities.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Feather
                    name='bell'
                    size={40}
                    color={colors.sidebar.text.muted}
                  />
                  <Text
                    style={{
                      marginTop: 12,
                      fontSize: 14,
                      color: colors.sidebar.text.muted,
                    }}
                  >
                    No new announcements or events
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={activities}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <ActivityRow
                      item={item}
                      colors={colors}
                      isDark={isDark}
                      isMobile={isMobile}
                    />
                  )}
                  contentContainerStyle={{
                    paddingVertical: isMobile ? 16 : 20,
                  }}
                  showsVerticalScrollIndicator={false}
                  removeClippedSubviews={true}
                  initialNumToRender={8}
                  maxToRenderPerBatch={10}
                  windowSize={21}
                />
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

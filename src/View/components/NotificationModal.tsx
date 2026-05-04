import { Feather, FontAwesome6 } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native'
import { Snackbar } from 'react-native-paper'
import { useTheme } from '../../Controller/context/ThemeContext'

const { height: screenHeight } = Dimensions.get('window')

export interface PendingApproval {
  id: string
  type: 'announcement' | 'event'
  title: string
  description?: string
  requestedBy: string
  requestedAt: Date
  data: {
    message?: string
    priority?: 'normal' | 'important' | 'urgent'
    [key: string]: any
  }
}

interface NotificationModalProps {
  visible: boolean
  onClose: () => void
  notifications: any[]
  onNotificationPress: (notification: any) => void
  onMarkAllRead: () => void
  pendingApprovals?: PendingApproval[]
  onApprove?: (approval: PendingApproval) => void
  onReject?: (approval: PendingApproval) => void
  approvalCount?: number
  loading?: boolean
  onRefresh?: () => Promise<void>
  onClearNotifications?: () => Promise<void>
  hideNotificationsTab?: boolean
  title?: string
  approvalStripeColor?: string
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  visible,
  onClose,
  notifications,
  onNotificationPress,
  onClearNotifications,
  onMarkAllRead,
  pendingApprovals = [],
  onApprove,
  onReject,
  approvalCount = 0,
  loading = false,
  onRefresh,
  hideNotificationsTab,
  title,
  approvalStripeColor,
}) => {
  const { width } = useWindowDimensions()
  const { colors, isDark } = useTheme()
  const [activeTab, setActiveTab] = useState<'notifications' | 'approvals'>(
    hideNotificationsTab || approvalCount > 0 ? 'approvals' : 'notifications'
  )
  const [refreshing, setRefreshing] = useState(false)
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [selectedApproval, setSelectedApproval] =
    useState<PendingApproval | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)

  const slideAnim = useRef(new Animated.Value(screenHeight)).current
  const overlayOpacity = useRef(new Animated.Value(0)).current
  const detailSlide = useRef(new Animated.Value(300)).current
  const detailOpacity = useRef(new Animated.Value(0)).current

  const [clearing, setClearing] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')

  const getPriorityColor = (priority?: string) => {
    if (priority === 'urgent') return '#ef4444'
    if (priority === 'important') return '#f59e0b'
    return '#3b82f6'
  }

  const getPriorityLabel = (priority?: string) => {
    if (priority === 'urgent') return 'URGENT'
    if (priority === 'important') return 'IMPORTANT'
    return 'NORMAL'
  }

  const handleClearAll = () => {
    if (!onClearNotifications) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    if (typeof Alert !== 'undefined') {
      Alert.alert(
        'Clear notification history',
        'Are you sure you want to permanently delete all your notifications?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete All',
            style: 'destructive',
            onPress: async () => {
              setClearing(true)
              await onClearNotifications()
              setClearing(false)
              setSnackbarMessage('Notification history cleared')
              setSnackbarVisible(true)
              setTimeout(() => setSnackbarVisible(false), 2000)
            },
          },
        ]
      )
    }
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 10,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          slideAnim.setValue(gesture.dy)
          overlayOpacity.setValue(1 - gesture.dy / screenHeight)
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > screenHeight * 0.3) {
          onClose()
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start()
          Animated.timing(overlayOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start()
        }
      },
    })
  ).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => onClose())
    }
  }, [visible])

  const openDetail = (approval: PendingApproval) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedApproval(approval)
    setDetailVisible(true)
    detailSlide.setValue(300)
    detailOpacity.setValue(0)
    Animated.parallel([
      Animated.spring(detailSlide, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }),
      Animated.timing(detailOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const closeDetail = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    Animated.parallel([
      Animated.timing(detailSlide, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(detailOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDetailVisible(false)
      setSelectedApproval(null)
    })
  }

  const handleApproveFromDetail = (approval: PendingApproval) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onApprove?.(approval)
    closeDetail()
  }

  const handleRejectFromDetail = (approval: PendingApproval) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onReject?.(approval)
    closeDetail()
  }

  const unreadCount = notifications.filter((n) => !n.read).length
  const modalWidth = Math.min(width * 0.92, 420)

  const withHaptic = (callback: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    callback()
  }

  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true)
      await onRefresh()
      setRefreshing(false)
    }
  }

  const handleMarkAllRead = () => {
    withHaptic(() => {
      onMarkAllRead()
      setSnackbarMessage('All notifications marked as read')
      setSnackbarVisible(true)
    })
  }

  const d = {
    overlay: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(15,23,42,0.55)',
    modalBg: isDark ? '#0f172a' : '#ffffff',
    headerBg: isDark ? '#0f172a' : '#ffffff',
    surfaceBg: isDark ? '#1e293b' : '#f8fafc',
    cardBg: isDark ? '#1e293b' : '#ffffff',
    cardBorder: isDark ? '#334155' : '#e2e8f0',
    tabBg: isDark ? '#1e293b' : '#f1f5f9',
    activeTabBg: isDark ? '#0ea5e9' : '#0284c7',
    textPrimary: isDark ? '#f1f5f9' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#475569',
    textMuted: isDark ? '#64748b' : '#94a3b8',
    accent: '#0ea5e9',
    accentGlow: isDark ? 'rgba(14,165,233,0.15)' : 'rgba(2,132,199,0.08)',
    unreadBg: isDark ? '#1e3a5f' : '#e0f2fe',
    unreadBorder: isDark ? '#3b82f6' : '#7dd3fc',
    dangerBg: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.07)',
    dangerBorder: isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.2)',
    successBg: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.07)',
    warnBg: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.08)',
    divider: isDark ? '#1e293b' : '#f1f5f9',
    shimmer: isDark ? '#334155' : '#e2e8f0',
  }

  const typeConfig = (type: 'announcement' | 'event') =>
    ({
      announcement: {
        label: 'Announcement',
        icon: 'alert-circle' as const,
        bg: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.1)',
        color: isDark ? '#fbbf24' : '#d97706',
        iconBg: isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.12)',
      },
      event: {
        label: 'Event',
        icon: 'calendar' as const,
        bg: isDark ? 'rgba(14,165,233,0.15)' : 'rgba(14,165,233,0.1)',
        color: isDark ? '#38bdf8' : '#0284c7',
        iconBg: isDark ? 'rgba(14,165,233,0.2)' : 'rgba(14,165,233,0.12)',
      },
    })[type]

  const renderTabs = () => (
    <View
      style={[
        styles.tabWrapper,
        { backgroundColor: d.surfaceBg, borderBottomColor: d.cardBorder },
      ]}
    >
      <View style={[styles.tabPill, { backgroundColor: d.tabBg }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'approvals' && [
              styles.activeTab,
              { backgroundColor: d.activeTabBg },
            ],
          ]}
          onPress={() => withHaptic(() => setActiveTab('approvals'))}
          activeOpacity={0.8}
        >
          <FontAwesome6
            name='clipboard-check'
            size={13}
            color={activeTab === 'approvals' ? '#fff' : d.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'approvals' ? '#fff' : d.textSecondary },
            ]}
          >
            Approvals
          </Text>
          {approvalCount > 0 && (
            <View
              style={[
                styles.tabBadge,
                {
                  backgroundColor:
                    activeTab === 'approvals'
                      ? 'rgba(255,255,255,0.25)'
                      : '#f59e0b',
                },
              ]}
            >
              <Text style={styles.tabBadgeText}>{approvalCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {!hideNotificationsTab && (
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'notifications' && [
                styles.activeTab,
                { backgroundColor: d.activeTabBg },
              ],
            ]}
            onPress={() => withHaptic(() => setActiveTab('notifications'))}
            activeOpacity={0.8}
          >
            <Feather
              name='bell'
              size={13}
              color={activeTab === 'notifications' ? '#fff' : d.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === 'notifications' ? '#fff' : d.textSecondary,
                },
              ]}
            >
              Notifications
            </Text>
            {unreadCount > 0 && (
              <View
                style={[
                  styles.tabBadge,
                  {
                    backgroundColor:
                      activeTab === 'notifications'
                        ? 'rgba(255,255,255,0.25)'
                        : '#ef4444',
                  },
                ]}
              >
                <Text style={styles.tabBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  )

  const renderApprovalCard = (approval: PendingApproval) => {
    const cfg = typeConfig(approval.type)
    const priority = approval.data?.priority || 'normal'
    const priorityColor = getPriorityColor(priority)

    const messageText =
      approval.type === 'event'
        ? approval.description || 'No description'
        : approval.data?.message ||
          approval.description ||
          'No additional message'
    return (
      <TouchableOpacity
        key={approval.id}
        style={[
          styles.approvalCard,
          { backgroundColor: d.cardBg, borderColor: d.cardBorder },
        ]}
        onPress={() => openDetail(approval)}
        activeOpacity={0.75}
      >
        <View
          style={[
            styles.approvalStripe,
            { backgroundColor: approvalStripeColor || cfg.color },
          ]}
        />

        <View style={styles.approvalCardInner}>
          <View style={styles.approvalTopRow}>
            <View
              style={[styles.approvalTypeIcon, { backgroundColor: cfg.iconBg }]}
            >
              <Feather name={cfg.icon} size={14} color={cfg.color} />
            </View>
            <View
              style={[styles.approvalTypeBadge, { backgroundColor: cfg.bg }]}
            >
              <Text
                style={[styles.approvalTypeBadgeText, { color: cfg.color }]}
              >
                {cfg.label}
              </Text>
            </View>
            {/* Priority Badge */}
            <View
              style={[styles.priorityBadge, { backgroundColor: priorityColor }]}
            >
              <Text style={styles.priorityBadgeText}>
                {getPriorityLabel(priority)}
              </Text>
            </View>
            <View style={styles.flex1} />
            <Text style={[styles.approvalTime, { color: d.textMuted }]}>
              {formatTime(approval.requestedAt)}
            </Text>
            <Feather
              name='chevron-right'
              size={14}
              color={d.textMuted}
              style={{ marginLeft: 4 }}
            />
          </View>

          {/* Title */}
          <Text
            style={[styles.approvalTitle, { color: d.textPrimary }]}
            numberOfLines={2}
          >
            {approval.title}
          </Text>

          <Text
            style={[styles.approvalPreview, { color: d.textSecondary }]}
            numberOfLines={2}
          >
            {messageText}
          </Text>

          {/* Footer */}
          <View style={styles.approvalFooter}>
            <View style={styles.requestedByRow}>
              <View
                style={[styles.avatarSmall, { backgroundColor: d.accentGlow }]}
              >
                <Feather name='user' size={10} color={d.accent} />
              </View>
              <Text style={[styles.requestedByText, { color: d.textMuted }]}>
                {approval.requestedBy}
              </Text>
            </View>
            <View style={styles.approvalQuickActions}>
              <TouchableOpacity
                style={[
                  styles.quickAction,
                  styles.quickReject,
                  { backgroundColor: d.dangerBg, borderColor: d.dangerBorder },
                ]}
                onPress={() => withHaptic(() => onReject?.(approval))}
              >
                <Feather name='x' size={12} color='#ef4444' />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.quickAction,
                  styles.quickApprove,
                  { backgroundColor: d.successBg },
                ]}
                onPress={() => withHaptic(() => onApprove?.(approval))}
              >
                <Feather name='check' size={12} color='#10b981' />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const renderApprovalsList = () => {
    if (pendingApprovals.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <View
            style={[
              styles.emptyIconWrap,
              {
                backgroundColor: isDark
                  ? 'rgba(16,185,129,0.12)'
                  : 'rgba(16,185,129,0.08)',
              },
            ]}
          >
            <Feather name='check-circle' size={28} color='#10b981' />
          </View>
          <Text style={[styles.emptyTitle, { color: d.textPrimary }]}>
            All clear!
          </Text>
          <Text style={[styles.emptySubtitle, { color: d.textSecondary }]}>
            No pending approvals right now. Admin requests will show up here.
          </Text>
        </View>
      )
    }

    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: d.textMuted }]}>
          {pendingApprovals.length} PENDING REVIEW
        </Text>
        {pendingApprovals.map(renderApprovalCard)}
      </ScrollView>
    )
  }

  const renderNotificationsList = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size='large' color={d.accent} />
        </View>
      )
    }

    if (notifications.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconWrap, { backgroundColor: d.tabBg }]}>
            <Feather name='bell-off' size={28} color={d.textMuted} />
          </View>
          <Text style={[styles.emptyTitle, { color: d.textPrimary }]}>
            All quiet
          </Text>
          <Text style={[styles.emptySubtitle, { color: d.textSecondary }]}>
            You'll be notified when something new arrives.
          </Text>
        </View>
      )
    }

    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[d.accent]}
              tintColor={d.accent}
            />
          ) : undefined
        }
      >
        {notifications.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.notifCard,
              {
                backgroundColor: item.read ? d.cardBg : d.unreadBg,
                borderColor: item.read ? d.cardBorder : d.unreadBorder,
                marginTop: index === 0 ? 12 : 0,
              },
            ]}
            onPress={() => withHaptic(() => onNotificationPress(item))}
            activeOpacity={0.75}
          >
            {!item.read && (
              <View
                style={[styles.notifStripe, { backgroundColor: d.accent }]}
              />
            )}
            <View style={styles.notifInner}>
              <View style={styles.notifHeader}>
                <Text
                  style={[styles.notifTitle, { color: d.textPrimary }]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                {!item.read && (
                  <View
                    style={[styles.unreadDot, { backgroundColor: d.accent }]}
                  />
                )}
              </View>
              <Text
                style={[styles.notifMessage, { color: d.textSecondary }]}
                numberOfLines={2}
              >
                {item.message}
              </Text>
              <Text style={[styles.notifTime, { color: d.textMuted }]}>
                {formatTime(item.timestamp)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    )
  }

  const renderApprovalDetail = () => {
    if (!selectedApproval) return null
    const cfg = typeConfig(selectedApproval.type)
    const priority = selectedApproval.data?.priority || 'normal'
    const priorityColor = getPriorityColor(priority)
    const messageText =
      selectedApproval.type === 'event'
        ? selectedApproval.description || 'No description'
        : selectedApproval.data?.message ||
          selectedApproval.description ||
          'No additional message'

    return (
      <Animated.View
        style={[
          styles.detailOverlay,
          {
            opacity: detailOpacity,
            backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(15,23,42,0.4)',
          },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={closeDetail}
          activeOpacity={1}
        />
        <Animated.View
          style={[
            styles.detailSheet,
            {
              backgroundColor: d.modalBg,
              transform: [{ translateY: detailSlide }],
              width: modalWidth,
            },
          ]}
        >
          {/* Detail Header */}
          <View
            style={[styles.detailHeader, { borderBottomColor: d.cardBorder }]}
          >
            <TouchableOpacity
              style={[styles.detailBackBtn, { backgroundColor: d.tabBg }]}
              onPress={closeDetail}
            >
              <Feather name='arrow-left' size={16} color={d.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.detailHeaderTitle, { color: d.textPrimary }]}>
              Review Request
            </Text>
            <View style={[styles.detailTypePill, { backgroundColor: cfg.bg }]}>
              <Text style={[styles.detailTypePillText, { color: cfg.color }]}>
                {cfg.label}
              </Text>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Priority Badge (prominent) */}
            <View
              style={[
                styles.detailPriorityContainer,
                {
                  backgroundColor: priorityColor + '20',
                  borderColor: priorityColor,
                },
              ]}
            >
              <Text
                style={[styles.detailPriorityLabel, { color: priorityColor }]}
              >
                {getPriorityLabel(priority)}
              </Text>
            </View>

            {/* Requester info */}
            <View
              style={[
                styles.detailRequesterCard,
                { backgroundColor: d.surfaceBg, borderColor: d.cardBorder },
              ]}
            >
              <View
                style={[styles.detailAvatar, { backgroundColor: d.accentGlow }]}
              >
                <Feather name='user' size={18} color={d.accent} />
              </View>
              <View>
                <Text
                  style={[styles.detailRequesterLabel, { color: d.textMuted }]}
                >
                  Requested by
                </Text>
                <Text
                  style={[styles.detailRequesterName, { color: d.textPrimary }]}
                >
                  {selectedApproval.requestedBy}
                </Text>
              </View>
              <View style={styles.flex1} />
              <Text
                style={[styles.detailRequesterTime, { color: d.textMuted }]}
              >
                {formatTime(selectedApproval.requestedAt)}
              </Text>
            </View>

            {/* Title & Message */}
            <View style={styles.detailSection}>
              <Text style={[styles.detailSectionLabel, { color: d.textMuted }]}>
                TITLE
              </Text>
              <Text
                style={[styles.detailContentTitle, { color: d.textPrimary }]}
              >
                {selectedApproval.title}
              </Text>
            </View>

            <View
              style={[
                styles.detailSection,
                styles.detailDivider,
                { borderTopColor: d.divider },
              ]}
            >
              <Text style={[styles.detailSectionLabel, { color: d.textMuted }]}>
                MESSAGE
              </Text>
              <Text
                style={[styles.detailContentBody, { color: d.textSecondary }]}
              >
                {messageText}
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View
            style={[
              styles.detailActions,
              { borderTopColor: d.cardBorder, backgroundColor: d.modalBg },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.detailActionBtn,
                styles.detailRejectBtn,
                { backgroundColor: d.dangerBg, borderColor: d.dangerBorder },
              ]}
              onPress={() => handleRejectFromDetail(selectedApproval)}
              activeOpacity={0.8}
            >
              <Feather name='x-circle' size={17} color='#ef4444' />
              <Text style={[styles.detailActionText, { color: '#ef4444' }]}>
                Reject
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.detailActionBtn, styles.detailApproveBtn]}
              onPress={() => handleApproveFromDetail(selectedApproval)}
              activeOpacity={0.8}
            >
              <Feather name='check-circle' size={17} color='#fff' />
              <Text style={[styles.detailActionText, { color: '#fff' }]}>
                Approve
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    )
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType='none'
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          styles.modalOverlay,
          { backgroundColor: d.overlay, opacity: overlayOpacity },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={() => withHaptic(onClose)}
          activeOpacity={1}
        />

        <Animated.View
          style={[
            styles.modalContainer,
            {
              width: modalWidth,
              backgroundColor: d.modalBg,
              transform: [{ translateY: slideAnim }],
              shadowColor: '#000',
              shadowOpacity: isDark ? 0.6 : 0.18,
            },
          ]}
        >
          {/* Drag handle */}
          <View {...panResponder.panHandlers} style={styles.dragHandleArea}>
            <View
              style={[
                styles.dragHandle,
                { backgroundColor: isDark ? '#334155' : '#e2e8f0' },
              ]}
            />
          </View>

          {/* Header */}
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: d.cardBorder, backgroundColor: d.headerBg },
            ]}
          >
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.headerIconWrap,
                  { backgroundColor: d.accentGlow },
                ]}
              >
                <Feather name='bell' size={17} color={d.accent} />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: d.textPrimary }]}>
                  {title || 'Notifications'}
                </Text>
                {unreadCount + approvalCount > 0 && (
                  <Text style={[styles.modalSubtitle, { color: d.textMuted }]}>
                    {unreadCount + approvalCount} need
                    {unreadCount + approvalCount === 1 ? 's' : ''} attention
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: d.tabBg }]}
              onPress={() => withHaptic(onClose)}
            >
              <Feather name='x' size={17} color={d.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          {(approvalCount > 0 || pendingApprovals.length > 0) && renderTabs()}

          {!hideNotificationsTab &&
            activeTab === 'notifications' &&
            notifications.length > 0 && (
              <View
                style={[
                  styles.markAllRow,
                  {
                    backgroundColor: d.surfaceBg,
                    borderBottomColor: d.cardBorder,
                  },
                ]}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    flex: 1,
                  }}
                >
                  {unreadCount > 0 && (
                    <TouchableOpacity
                      style={styles.markAllBtn}
                      onPress={handleMarkAllRead}
                      activeOpacity={0.7}
                    >
                      <Feather name='check-circle' size={13} color={d.accent} />
                      <Text style={[styles.markAllText, { color: d.accent }]}>
                        Mark all as read
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.markAllBtn]}
                    onPress={handleClearAll}
                    disabled={clearing}
                    activeOpacity={0.7}
                  >
                    {clearing ? (
                      <ActivityIndicator
                        size='small'
                        color='#ef4444'
                        style={{ marginRight: 4 }}
                      />
                    ) : (
                      <Feather name='trash-2' size={13} color='#ef4444' />
                    )}
                    <Text style={[styles.markAllText, { color: '#ef4444' }]}>
                      {clearing ? 'Clearing...' : 'Clear all'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.markAllCount, { color: d.textMuted }]}>
                  {notifications.length} total
                </Text>
              </View>
            )}

          {/* Content */}
          <View style={{ flex: 1 }}>
            {activeTab === 'approvals'
              ? renderApprovalsList()
              : renderNotificationsList()}
          </View>

          {detailVisible && renderApprovalDetail()}
        </Animated.View>
      </Animated.View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
        style={{
          backgroundColor: isDark ? '#1e293b' : '#0f172a',
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          borderRadius: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Feather
            name={
              snackbarMessage?.includes('cleared') ? 'trash-2' : 'check-circle'
            }
            size={14}
            color={snackbarMessage?.includes('cleared') ? '#ef4444' : '#10b981'}
          />
          <Text style={{ color: '#f1f5f9', fontSize: 13 }}>
            {snackbarMessage}
          </Text>
        </View>
      </Snackbar>
    </Modal>
  )
}

const formatTime = (timestamp: any) => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return date.toLocaleDateString()
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    borderRadius: 28,
    maxHeight: '82%',
    minHeight: 520,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 32,
    elevation: 32,
    overflow: 'hidden',
  },
  dragHandleArea: {
    paddingTop: 10,
    paddingBottom: 6,
    alignItems: 'center',
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },

  // Header
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Tabs
  tabWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  tabPill: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  activeTab: {
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabBadge: {
    borderRadius: 8,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },

  // Mark all read
  markAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  markAllCount: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Section label
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
  },

  // Approval cards
  approvalCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  approvalStripe: {
    width: 4,
  },
  approvalCardInner: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  approvalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  approvalTypeIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  approvalTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  approvalTypeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  approvalTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  approvalTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  approvalPreview: {
    fontSize: 12,
    lineHeight: 17,
  },
  approvalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  requestedByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatarSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestedByText: {
    fontSize: 11,
    fontWeight: '500',
  },
  approvalQuickActions: {
    flexDirection: 'row',
    gap: 6,
  },
  quickAction: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickReject: {
    borderWidth: 1,
  },
  quickApprove: {},

  // Priority badge (new)
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  detailPriorityContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  detailPriorityLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Notification cards
  notifCard: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  notifStripe: {
    width: 3,
  },
  notifInner: {
    flex: 1,
    padding: 14,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    letterSpacing: -0.2,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginLeft: 8,
  },
  notifMessage: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 4,
  },
  notifTime: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  emptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },

  // Approval Detail Sheet
  detailOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  detailSheet: {
    borderRadius: 24,
    maxHeight: '95%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
    marginBottom: 8,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  detailBackBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    letterSpacing: -0.3,
  },
  detailTypePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  detailTypePillText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailRequesterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  detailAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailRequesterLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  detailRequesterName: {
    fontSize: 14,
    fontWeight: '700',
  },
  detailRequesterTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  detailSection: {
    marginBottom: 16,
  },
  detailDivider: {
    paddingTop: 16,
    borderTopWidth: 1,
  },
  detailSectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  detailContentTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.4,
    lineHeight: 26,
  },
  detailContentBody: {
    fontSize: 14,
    lineHeight: 22,
  },
  detailDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 6,
    gap: 12,
  },
  detailDataKey: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  detailDataVal: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  detailActions: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
  },
  detailActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  detailRejectBtn: {
    borderWidth: 1,
  },
  detailApproveBtn: {
    backgroundColor: '#0ea5e9',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  detailActionText: {
    fontSize: 15,
    fontWeight: '700',
  },
})

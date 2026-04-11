import { Feather, FontAwesome6 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useTheme } from '../context/ThemeContext';

const { height: screenHeight } = Dimensions.get('window');

interface PendingApproval {
  id: string;
  type: 'announcement' | 'event';
  title: string;
  description: string;
  requestedBy: string;
  requestedAt: Date;
  data: any;
}

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  notifications: any[];
  onNotificationPress: (notification: any) => void;
  onMarkAllRead: () => void;
  pendingApprovals?: PendingApproval[];
  onApprove?: (approval: PendingApproval) => void;
  onReject?: (approval: PendingApproval) => void;
  approvalCount?: number;
  loading?: boolean;
  onRefresh?: () => Promise<void>;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  visible,
  onClose,
  notifications,
  onNotificationPress,
  onMarkAllRead,
  pendingApprovals = [],
  onApprove,
  onReject,
  approvalCount = 0,
  loading = false,
  onRefresh,
}) => {
  const { width } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'notifications' | 'approvals'>(
    approvalCount > 0 ? 'approvals' : 'notifications'
  );
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const tabTranslateX = useRef(new Animated.Value(activeTab === 'approvals' ? 0 : 1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 10,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          slideAnim.setValue(gesture.dy);
          overlayOpacity.setValue(1 - gesture.dy / screenHeight);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > screenHeight * 0.3) {
          onClose();
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start();
          Animated.timing(overlayOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

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
      ]).start();
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
      ]).start(() => onClose());
    }
  }, [visible]);

  useEffect(() => {
    Animated.spring(tabTranslateX, {
      toValue: activeTab === 'approvals' ? 0 : 1,
      tension: 65,
      friction: 11,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const modalWidth = Math.min(width * 0.9, 400);

  const withHaptic = (callback: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    callback();
  };

  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
  };

  const handleMarkAllRead = () => {
    withHaptic(() => {
      onMarkAllRead();
      setSnackbarVisible(true);
      setTimeout(() => setSnackbarVisible(false), 2000);
    });
  };

  const getNotificationStyles = () => ({
    overlay: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
    modalBg: colors.card,
    headerBorder: colors.border,
    tabBg: isDark ? '#0f172a' : '#f8fafc',
    tabBorder: colors.border,
    activeTabBg: colors.accent.primary,
    inactiveTabBg: isDark ? '#1e293b' : '#f1f5f9',
    textPrimary: colors.text,
    textSecondary: colors.sidebar.text.secondary,
    textMuted: colors.sidebar.text.muted,
    iconBg: isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9',
    unreadBg: isDark ? '#0ea5e915' : '#f0f9ff',
    unreadBorder: isDark ? '#0ea5e930' : '#bae6fd',
    badgeBg: '#ef4444',
    approvalBadgeBg: '#f59e0b',
  });

  const dynamic = getNotificationStyles();

  const SkeletonItem = () => (
    <View style={[styles.skeletonItem, { backgroundColor: dynamic.iconBg }]}>
      <View style={[styles.skeletonIcon, { backgroundColor: dynamic.textMuted }]} />
      <View style={styles.skeletonContent}>
        <View style={[styles.skeletonLine, { width: '70%', backgroundColor: dynamic.textMuted }]} />
        <View style={[styles.skeletonLine, { width: '90%', marginTop: 8, backgroundColor: dynamic.textMuted }]} />
        <View style={[styles.skeletonLine, { width: '40%', marginTop: 8, backgroundColor: dynamic.textMuted }]} />
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={[styles.tabContainer, { backgroundColor: dynamic.tabBg, borderBottomColor: dynamic.tabBorder }]}>
      <TouchableOpacity
        style={[
          styles.tab,
          { backgroundColor: activeTab === 'approvals' ? dynamic.activeTabBg : dynamic.inactiveTabBg }
        ]}
        onPress={() => setActiveTab('approvals')}
        activeOpacity={0.7}
      >
        <View style={styles.tabContent}>
          <FontAwesome6
            name="clipboard-check"
            size={14}
            color={activeTab === 'approvals' ? '#ffffff' : dynamic.textPrimary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'approvals' ? '#ffffff' : dynamic.textPrimary },
            ]}
          >
            Approvals
          </Text>
          {approvalCount > 0 && (
            <View style={[styles.badge, { backgroundColor: dynamic.approvalBadgeBg }]}>
              <Text style={styles.badgeText}>{approvalCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          { backgroundColor: activeTab === 'notifications' ? dynamic.activeTabBg : dynamic.inactiveTabBg }
        ]}
        onPress={() => setActiveTab('notifications')}
        activeOpacity={0.7}
      >
        <View style={styles.tabContent}>
          <Feather
            name="bell"
            size={14}
            color={activeTab === 'notifications' ? '#ffffff' : dynamic.textPrimary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'notifications' ? '#ffffff' : dynamic.textPrimary },
            ]}
          >
            Notifications
          </Text>
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: dynamic.badgeBg }]}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Animated indicator */}
      <Animated.View
        style={[
          styles.tabIndicator,
          {
            transform: [
              {
                translateX: tabTranslateX.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, modalWidth / 2 - 20],
                }),
              },
            ],
            backgroundColor: dynamic.activeTabBg,
          },
        ]}
      />
    </View>
  );

  const renderApprovalsList = () => {
    if (pendingApprovals.length === 0) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
          <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? '#10b98120' : '#f0fdf4' }]}>
            <Feather name="check-circle" size={32} color="#10b981" />
          </View>
          <Text style={[styles.emptyTitle, { color: dynamic.textPrimary }]}>All caught up!</Text>
          <Text style={[styles.emptySubtitle, { color: dynamic.textSecondary }]}>
            No pending approvals. Assistant admin requests will appear here.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
        {pendingApprovals.map((approval) => (
          <View
            key={approval.id}
            style={[
              styles.notificationItem,
              styles.approvalItem,
              {
                backgroundColor: dynamic.modalBg,
                borderColor: colors.border,
                shadowColor: isDark ? '#000' : '#000',
                shadowOpacity: isDark ? 0.3 : 0.1,
              },
            ]}
          >
            <View style={styles.approvalContent}>
              <View style={styles.notificationHeader}>
                <Text style={[styles.notificationTitle, { color: dynamic.textPrimary }]} numberOfLines={1}>
                  {approval.title}
                </Text>
                <View
                  style={[
                    styles.typeBadge,
                    {
                      backgroundColor:
                        approval.type === 'announcement'
                          ? isDark ? '#f59e0b30' : '#fef3c7'
                          : isDark ? '#0ea5e930' : '#dbeafe',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.typeBadgeText,
                      {
                        color:
                          approval.type === 'announcement'
                            ? isDark ? '#fbbf24' : '#d97706'
                            : isDark ? '#38bdf8' : '#0369a1',
                      },
                    ]}
                  >
                    {approval.type === 'announcement' ? 'Announcement' : 'Event'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.notificationMessage, { color: dynamic.textSecondary }]} numberOfLines={1}>
                Requested by {approval.requestedBy}
              </Text>

              <Text style={[styles.notificationTime, { color: dynamic.textMuted }]}>
                {formatTime(approval.requestedAt)}
              </Text>

              <View style={[styles.approvalActions, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.rejectButton,
                    { backgroundColor: isDark ? '#ef444420' : '#fef2f2' },
                  ]}
                  onPress={() => withHaptic(() => onReject?.(approval))}
                >
                  <Feather name="x" size={14} color="#dc2626" />
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton, { backgroundColor: '#0ea5e9' }]}
                  onPress={() => withHaptic(() => onApprove?.(approval))}
                >
                  <Feather name="check" size={14} color="#ffffff" />
                  <Text style={styles.approveButtonText}>Approve</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderNotificationsList = () => {
    if (loading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      );
    }

    if (notifications.length === 0) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
          <View style={[styles.emptyIconContainer, { backgroundColor: dynamic.iconBg }]}>
            <Feather name="bell-off" size={32} color={dynamic.textMuted} />
          </View>
          <Text style={[styles.emptyTitle, { color: dynamic.textPrimary }]}>All quiet here</Text>
          <Text style={[styles.emptySubtitle, { color: dynamic.textSecondary }]}>
            You'll see notifications when something new arrives.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.accent.primary]}
              tintColor={colors.accent.primary}
            />
          ) : undefined
        }
      >
        {notifications.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.notificationItem,
              {
                backgroundColor: item.read ? dynamic.modalBg : dynamic.unreadBg,
                borderColor: item.read ? colors.border : dynamic.unreadBorder,
              },
            ]}
            onPress={() => withHaptic(() => onNotificationPress(item))}
            activeOpacity={0.7}
          >
            <View style={styles.notificationContent}>
              <View style={styles.notificationHeader}>
                <Text style={[styles.notificationTitle, { color: dynamic.textPrimary }]} numberOfLines={1}>
                  {item.title}
                </Text>
                {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.accent.primary }]} />}
              </View>
              <Text style={[styles.notificationMessage, { color: dynamic.textSecondary }]} numberOfLines={2}>
                {item.message}
              </Text>
              <Text style={[styles.notificationTime, { color: dynamic.textMuted }]}>
                {formatTime(item.timestamp)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        style={[styles.modalOverlay, { backgroundColor: dynamic.overlay, opacity: overlayOpacity }]}
        {...panResponder.panHandlers}
      >
        <Animated.View
          style={[
            styles.modalContainer,
            {
              width: modalWidth,
              backgroundColor: dynamic.modalBg,
              transform: [{ translateY: slideAnim }],
              shadowColor: isDark ? '#000' : '#000',
              shadowOpacity: isDark ? 0.5 : 0.25,
            },
          ]}
        >
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: dynamic.headerBorder, backgroundColor: dynamic.modalBg }]}>
            <View style={styles.headerTitleContainer}>
              <Feather name="bell" size={20} color={colors.accent.primary} />
              <Text style={[styles.modalTitle, { color: dynamic.textPrimary }]}>Notifications</Text>
              {(unreadCount + approvalCount) > 0 && (
                <View style={[styles.unreadBadge, { backgroundColor: colors.accent.primary }]}>
                  <Text style={styles.unreadBadgeText}>{unreadCount + approvalCount}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: dynamic.iconBg }]}
              onPress={() => withHaptic(onClose)}
            >
              <Feather name="x" size={20} color={dynamic.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Tabs (only show if approvals exist) */}
          {(approvalCount > 0 || pendingApprovals.length > 0) && renderTabs()}

          {/* Mark All Read Button */}
          {activeTab === 'notifications' && unreadCount > 0 && (
            <View style={[styles.markAllContainer, { borderBottomColor: dynamic.headerBorder, backgroundColor: dynamic.tabBg }]}>
              <TouchableOpacity
                style={[styles.markAllButton, { backgroundColor: dynamic.modalBg, borderColor: colors.border }]}
                onPress={handleMarkAllRead}
              >
                <Feather name="check-circle" size={16} color={colors.accent.primary} />
                <Text style={[styles.markAllText, { color: colors.accent.primary }]}>Mark all as read</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Cross‑fade content container – removed transform scale */}
          <View style={{ flex: 1 }}>
            {activeTab === 'approvals' ? renderApprovalsList() : renderNotificationsList()}
          </View>
        </Animated.View>
      </Animated.View>

      {/* Snackbar for confirmation */ }
  <Snackbar
    visible={snackbarVisible}
    onDismiss={() => setSnackbarVisible(false)}
    duration={2000}
    style={{ backgroundColor: isDark ? '#1e293b' : '#fff', position: 'absolute', bottom: 20, left: 20, right: 20 }}
  >
    <Text style={{ color: dynamic.textPrimary }}>All notifications marked as read</Text>
  </Snackbar>
    </Modal >
  );
};

const formatTime = (timestamp: any) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    borderRadius: 28,
    maxHeight: '80%',
    minHeight: 500,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    elevation: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  unreadBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    position: 'relative',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: '50%',
    borderRadius: 3,
    marginBottom: -1,
  },
  badge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  markAllContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
minHeight: 400,
  },
  notificationsList: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  approvalItem: {
    flexDirection: 'column',
    gap: 12,
  },
  notificationContent: {
    flex: 1,
  },
  approvalContent: {
    flex: 1,
    marginLeft: 0,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  notificationMessage: {
    fontSize: 13,
    marginBottom: 4,
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  approvalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  rejectButton: {
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  rejectButtonText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '600',
  },
  approveButton: {
    backgroundColor: '#0ea5e9',
  },
  approveButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  skeletonItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    backgroundColor: '#f1f5f9',
  },
  skeletonIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    marginRight: 12,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonLine: {
    height: 14,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
  },
});

// Helper components (not used directly but kept for reference)
const RefreshControl = require('react-native').RefreshControl;
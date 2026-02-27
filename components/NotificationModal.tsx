import { Feather, FontAwesome6 } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View,
} from 'react-native';

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
}) => {
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<'notifications' | 'approvals'>(
    approvalCount > 0 ? 'approvals' : 'notifications'
  );
  
  const unreadCount = notifications.filter(n => !n.read).length;
  const modalWidth = Math.min(width * 0.9, 400);

  React.useEffect(() => {
    if (visible && approvalCount > 0) {
      setActiveTab('approvals');
    }
  }, [visible, approvalCount]);

  const handleReject = (approval: PendingApproval) => {
    Alert.alert(
      'Reject Request',
      `Are you sure you want to reject "${approval.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => onReject?.(approval),
        },
      ]
    );
  };

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'approvals' && styles.activeTab]}
        onPress={() => setActiveTab('approvals')}
      >
        <View style={styles.tabContent}>
          <FontAwesome6 
            name="clipboard-check" 
            size={14} 
            color={activeTab === 'approvals' ? '#ffffff' : '#64748b'} 
          />
          <Text style={[styles.tabText, activeTab === 'approvals' && styles.activeTabText]}>
            Approvals
          </Text>
          {approvalCount > 0 && (
            <View style={[styles.badge, styles.approvalBadge]}>
              <Text style={styles.badgeText}>{approvalCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'notifications' && styles.activeTab]}
        onPress={() => setActiveTab('notifications')}
      >
        <View style={styles.tabContent}>
          <Feather 
            name="bell" 
            size={14} 
            color={activeTab === 'notifications' ? '#ffffff' : '#64748b'} 
          />
          <Text style={[styles.tabText, activeTab === 'notifications' && styles.activeTabText]}>
            Notifications
          </Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderApprovalsList = () => (
    <ScrollView 
      style={styles.notificationsList}
      showsVerticalScrollIndicator={false}
    >
      {pendingApprovals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: '#f0fdf4' }]}>
            <Feather name="check-circle" size={32} color="#10b981" />
          </View>
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptySubtitle}>
            No pending approvals. Assistant admin requests will appear here.
          </Text>
        </View>
      ) : (
        pendingApprovals.map((approval) => (
          <View
            key={approval.id}
            style={[styles.notificationItem, styles.approvalItem]}
          >
            <View style={[
              styles.notificationIcon,
              { backgroundColor: approval.type === 'announcement' ? '#fef3c7' : '#dbeafe' }
            ]}>
              <FontAwesome6
                name={approval.type === 'announcement' ? 'bullhorn' : 'calendar'}
                size={18}
                color={approval.type === 'announcement' ? '#f59e0b' : '#0ea5e9'}
              />
            </View>
            
            <View style={styles.approvalContent}>
              <View style={styles.notificationHeader}>
                <Text style={styles.notificationTitle} numberOfLines={1}>
                  {approval.title}
                </Text>
                <View style={[
                  styles.typeBadge,
                  { backgroundColor: approval.type === 'announcement' ? '#fef3c7' : '#dbeafe' }
                ]}>
                  <Text style={[
                    styles.typeBadgeText,
                    { color: approval.type === 'announcement' ? '#d97706' : '#0369a1' }
                  ]}>
                    {approval.type === 'announcement' ? 'Announcement' : 'Event'}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.notificationMessage} numberOfLines={1}>
                Requested by {approval.requestedBy}
              </Text>
              
              <Text style={styles.notificationTime}>
                {formatTime(approval.requestedAt)}
              </Text>

              <View style={styles.approvalActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleReject(approval)}
                >
                  <Feather name="x" size={14} color="#dc2626" />
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => onApprove?.(approval)}
                >
                  <Feather name="check" size={14} color="#ffffff" />
                  <Text style={styles.approveButtonText}>Approve</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderNotificationsList = () => (
    <ScrollView 
      style={styles.notificationsList}
      showsVerticalScrollIndicator={false}
    >
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Feather name="bell-off" size={32} color="#cbd5e1" />
          </View>
          <Text style={styles.emptyTitle}>No notifications</Text>
          <Text style={styles.emptySubtitle}>
            You're all caught up! Check back later for updates.
          </Text>
        </View>
      ) : (
        notifications.map((notification) => (
          <TouchableOpacity
            key={notification.id}
            style={[
              styles.notificationItem,
              !notification.read && styles.unreadItem
            ]}
            onPress={() => onNotificationPress(notification)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.notificationIcon,
              { backgroundColor: getNotificationColor(notification.type) + '15' }
            ]}>
              <Feather
                name={getNotificationIcon(notification.type)}
                size={18}
                color={getNotificationColor(notification.type)}
              />
            </View>
            <View style={styles.notificationContent}>
              <View style={styles.notificationHeader}>
                <Text style={styles.notificationTitle} numberOfLines={1}>
                  {notification.title}
                </Text>
                {!notification.read && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.notificationMessage} numberOfLines={2}>
                {notification.message}
              </Text>
              <Text style={styles.notificationTime}>
                {formatTime(notification.timestamp)}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { width: modalWidth }]}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleContainer}>
              <Feather name="bell" size={20} color="#0ea5e9" />
              <Text style={styles.modalTitle}>Notifications</Text>
              {(unreadCount + approvalCount) > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount + approvalCount}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Feather name="x" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          {(approvalCount > 0 || pendingApprovals.length > 0) && renderTabs()}

          {/* Mark All Read Button (only for notifications tab) */}
          {activeTab === 'notifications' && unreadCount > 0 && (
            <View style={styles.markAllContainer}>
              <TouchableOpacity
                style={styles.markAllButton}
                onPress={onMarkAllRead}
              >
                <Feather name="check-circle" size={16} color="#0ea5e9" />
                <Text style={styles.markAllText}>Mark all as read</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Content based on active tab */}
          {activeTab === 'approvals' ? renderApprovalsList() : renderNotificationsList()}
        </View>
      </View>
    </Modal>
  );
};

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'event': return 'calendar';
    case 'announcement': return 'bell';
    case 'attendance': return 'check-square';
    case 'user': return 'user-plus';
    default: return 'bell';
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'event': return '#0ea5e9';
    case 'announcement': return '#f59e0b';
    case 'attendance': return '#10b981';
    case 'user': return '#8b5cf6';
    default: return '#64748b';
  }
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
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
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  unreadBadge: {
    backgroundColor: '#0ea5e9',
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
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  activeTab: {
    backgroundColor: '#0ea5e9',
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
    color: '#64748b',
  },
  activeTabText: {
    color: '#ffffff',
  },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  approvalBadge: {
    backgroundColor: '#f59e0b',
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
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignSelf: 'flex-start',
  },
  markAllText: {
    color: '#0ea5e9',
    fontSize: 13,
    fontWeight: '600',
  },
  notificationsList: {
    padding: 16,
    maxHeight: 500,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  unreadItem: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
  },
  approvalItem: {
    flexDirection: 'column',
    gap: 12,
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
    color: '#0f172a',
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
    color: '#475569',
    marginBottom: 4,
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0ea5e9',
    marginLeft: 8,
  },

  approvalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
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
    backgroundColor: '#fef2f2',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default NotificationModal;
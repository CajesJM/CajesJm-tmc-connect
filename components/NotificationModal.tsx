import { Feather, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import {
    Dimensions,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Notification } from '../utils/notifications';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  notifications: Notification[];
  onNotificationPress: (notification: Notification) => void;
  onMarkAllRead: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  visible,
  onClose,
  notifications,
  onNotificationPress,
  onMarkAllRead,
}) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string, priority?: string) => {
    switch (type) {
      case 'event':
        return { name: 'calendar', color: '#0ea5e9' };
      case 'announcement':
        return { name: 'megaphone', color: '#f59e0b' };
      case 'attendance':
        return { name: 'qr-code', color: '#10b981' };
      case 'user':
        return { name: 'people', color: '#8b5cf6' };
      default:
        return { name: 'notifications', color: '#64748b' };
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={20} style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={onClose}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity activeOpacity={1} style={styles.modalContainer}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={styles.headerLeft}>
                  <Text style={styles.modalTitle}>Notifications</Text>
                  {unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{unreadCount}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.headerRight}>
                  {unreadCount > 0 && (
                    <TouchableOpacity 
                      style={styles.markAllButton}
                      onPress={onMarkAllRead}
                    >
                      <Text style={styles.markAllText}>Mark all read</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={onClose}
                  >
                    <Feather name="x" size={20} color="#64748b" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Notification List */}
              <ScrollView 
                style={styles.notificationList}
                showsVerticalScrollIndicator={false}
              >
                {notifications.length > 0 ? (
                  notifications.map((notification) => {
                    const icon = getNotificationIcon(notification.type, notification.priority);
                    
                    return (
                      <TouchableOpacity
                        key={notification.id}
                        style={[
                          styles.notificationItem,
                          !notification.read && styles.unreadItem
                        ]}
                        onPress={() => {
                          onNotificationPress(notification);
                          onClose();
                        }}
                      >
                        <View style={[styles.notificationIcon, { backgroundColor: `${icon.color}15` }]}>
                          <Ionicons name={icon.name as any} size={20} color={icon.color} />
                        </View>
                        
                        <View style={styles.notificationContent}>
                          <View style={styles.notificationHeader}>
                            <Text style={styles.notificationTitle} numberOfLines={1}>
                              {notification.title}
                            </Text>
                            <Text style={styles.notificationTime}>
                              {formatTime(notification.timestamp)}
                            </Text>
                          </View>
                          <Text style={styles.notificationMessage} numberOfLines={2}>
                            {notification.message}
                          </Text>
                          {notification.priority === 'high' && (
                            <View style={styles.priorityBadge}>
                              <Text style={styles.priorityText}>Important</Text>
                            </View>
                          )}
                        </View>
                        
                        {!notification.read && <View style={styles.unreadDot} />}
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={styles.emptyState}>
                    <Feather name="bell-off" size={40} color="#cbd5e1" />
                    <Text style={styles.emptyText}>No notifications yet</Text>
                  </View>
                )}
              </ScrollView>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: isWeb ? 400 : width * 0.9,
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  },
  unreadText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  markAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  markAllText: {
    color: '#0ea5e9',
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationList: {
    maxHeight: 400,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    position: 'relative',
  },
  unreadItem: {
    backgroundColor: '#f0f9ff',
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
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
  },
  notificationTime: {
    fontSize: 11,
    color: '#94a3b8',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 4,
  },
  priorityBadge: {
    backgroundColor: '#ef444420',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  priorityText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0ea5e9',
    position: 'absolute',
    top: 20,
    right: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94a3b8',
  },
});
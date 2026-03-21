import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, orderBy, query, Unsubscribe } from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../../context/AuthContext';
import { auth, db } from '../../../lib/firebaseConfig';
import { studentAnnouncementStyles } from '../../../styles/student/announcementStyle';

dayjs.extend(relativeTime);

interface Announcement {
  id: string;
  title: string;
  message: string;
  createdAt?: any;
  priority?: 'normal' | 'important' | 'urgent';
  status?: 'approved';
  createdByName?: string;
}

type TimeFilter = 'all' | 'today' | 'week' | 'month';

export default function StudentAnnouncements() {
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 640;
  const { userData } = useAuth();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const styles = studentAnnouncementStyles;

  useEffect(() => {
    let unsubscribeAnnouncements: Unsubscribe | null = null;
    let unsubscribeAuth: Unsubscribe | null = null;

    unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      const authenticated = !!user;
      setIsUserAuthenticated(authenticated);

      if (unsubscribeAnnouncements) {
        unsubscribeAnnouncements();
        unsubscribeAnnouncements = null;
      }

      if (authenticated) {
        setLoading(true);
        setQueryError(null);
        unsubscribeAnnouncements = setupAnnouncementsListener();
      } else {
        setAnnouncements([]);
        setFilteredAnnouncements([]);
        setLoading(false);
        setRefreshing(false);
      }
    });

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeAnnouncements) unsubscribeAnnouncements();
    };
  }, []);

  const setupAnnouncementsListener = (): Unsubscribe => {
    // Fetch all announcements (no status filter)
    const q = query(
      collection(db, 'updates'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        if (auth.currentUser) {
          const list: Announcement[] = snapshot.docs
            .map((doc) => {
              const data = doc.data();
              const hasStatus = 'status' in data;
              const isApproved = hasStatus && data.status === 'approved';
              const isAdminEvent = !hasStatus;

              if (isApproved || isAdminEvent) {
                return {
                  id: doc.id,
                  ...(data as Omit<Announcement, 'id'>),
                };
              }
              return null;
            })
            .filter((item): item is Announcement => item !== null);

          setAnnouncements(list);
          filterAnnouncements(list, timeFilter);
          setLoading(false);
          setRefreshing(false);
          setQueryError(null);
        }
      },
      (error) => {
        console.error('Error fetching announcements:', error);
        if (auth.currentUser) {
          if (error.code === 'failed-precondition') {
            setQueryError(
              'The announcements index is still being built. Please wait a moment and refresh.'
            );
          } else {
            setQueryError('Failed to load announcements. Please try again later.');
          }
        }
        setLoading(false);
        setRefreshing(false);
      }
    );
  };

  useEffect(() => {
    filterAnnouncements(announcements, timeFilter);
    setCurrentPage(1); // reset pagination on filter change
  }, [timeFilter, announcements]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      const filtered = announcements.filter(
        (ann) =>
          ann.title.toLowerCase().includes(searchLower) ||
          ann.message.toLowerCase().includes(searchLower)
      );
      setFilteredAnnouncements(filtered);
      setCurrentPage(1);
    } else {
      filterAnnouncements(announcements, timeFilter);
    }
  }, [searchQuery, announcements]);

  const filterAnnouncements = (announcementsList: Announcement[], filter: TimeFilter) => {
    const now = dayjs();
    let filtered = announcementsList;

    switch (filter) {
      case 'today':
        filtered = announcementsList.filter(
          (ann) => ann.createdAt && dayjs(ann.createdAt.toDate()).isSame(now, 'day')
        );
        break;
      case 'week':
        filtered = announcementsList.filter(
          (ann) => ann.createdAt && dayjs(ann.createdAt.toDate()).isAfter(now.subtract(1, 'week'))
        );
        break;
      case 'month':
        filtered = announcementsList.filter(
          (ann) => ann.createdAt && dayjs(ann.createdAt.toDate()).isAfter(now.subtract(1, 'month'))
        );
        break;
      default:
        filtered = announcementsList;
    }
    setFilteredAnnouncements(filtered);
  };

  const isNewAnnouncement = (createdAt: any) => {
    if (!createdAt) return false;
    return dayjs(createdAt.toDate()).isAfter(dayjs().subtract(1, 'day'));
  };

  const getPriorityColor = (priority?: string, title?: string) => {
    if (priority === 'urgent' || title?.toLowerCase().includes('urgent')) return '#ef4444';
    if (priority === 'important' || title?.toLowerCase().includes('important')) return '#f59e0b';
    return '#0ea5e9';
  };

  const getPriorityLabel = (priority?: string, title?: string) => {
    if (priority === 'urgent' || title?.toLowerCase().includes('urgent')) return 'URGENT';
    if (priority === 'important' || title?.toLowerCase().includes('important')) return 'IMPORTANT';
    return 'NORMAL';
  };

  const stats = useMemo(() => {
    const total = announcements.length;
    const today = announcements.filter(
      (ann) => ann.createdAt && dayjs(ann.createdAt.toDate()).isSame(dayjs(), 'day')
    ).length;
    const important = announcements.filter(
      (ann) => ann.priority === 'important' || ann.title?.toLowerCase().includes('important')
    ).length;
    const urgent = announcements.filter(
      (ann) => ann.priority === 'urgent' || ann.title?.toLowerCase().includes('urgent')
    ).length;
    return { total, today, important, urgent };
  }, [announcements]);

  const handleRefresh = () => {
    if (!isUserAuthenticated) return;
    setRefreshing(true);
    setRefreshing(false);
  };

  // Pagination
  const totalPages = Math.ceil(filteredAnnouncements.length / itemsPerPage);
  const paginatedAnnouncements = filteredAnnouncements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const openDetailModal = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setShowDetailModal(true);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
          onPress={goToPreviousPage}
          disabled={currentPage === 1}
        >
          <Feather name="chevron-left" size={18} color={currentPage === 1 ? '#cbd5e1' : '#0f172a'} />
          <Text style={[styles.paginationText, currentPage === 1 && styles.paginationTextDisabled]}>
            Prev
          </Text>
        </TouchableOpacity>

        <Text style={styles.paginationPageInfo}>
          {currentPage} / {totalPages}
        </Text>

        <TouchableOpacity
          style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
          onPress={goToNextPage}
          disabled={currentPage === totalPages}
        >
          <Text style={[styles.paginationText, currentPage === totalPages && styles.paginationTextDisabled]}>
            Next
          </Text>
          <Feather name="chevron-right" size={18} color={currentPage === totalPages ? '#cbd5e1' : '#0f172a'} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderAnnouncementCard = ({ item }: { item: Announcement }) => {
    const priorityColor = getPriorityColor(item.priority, item.title);
    const isNew = isNewAnnouncement(item.createdAt);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => openDetailModal(item)}
        activeOpacity={0.7}
      >

        <View style={styles.cardContent}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.cardHeaderRight}>
              {isNew && (
                <View style={[styles.badge, { backgroundColor: '#3b82f6' }]}>
                  <Text style={styles.badgeText}>NEW</Text>
                </View>
              )}
              <View style={[styles.priorityDotSmall, { backgroundColor: priorityColor }]} />
              <Text style={styles.cardTime}>
                {item.createdAt ? dayjs(item.createdAt.toDate()).fromNow() : 'Just now'}
              </Text>
            </View>
          </View>
          <Text style={styles.cardMessage} numberOfLines={1}>
            {item.message}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Detail Modal
  const renderDetailModal = () => (
    <Modal
      visible={showDetailModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowDetailModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.detailModalContainer}>
          {selectedAnnouncement && (
            <>
              <View style={styles.detailModalHeader}>
                <View style={styles.detailModalHeaderLeft}>
                  <View
                    style={[
                      styles.detailPriorityIndicator,
                      {
                        backgroundColor: getPriorityColor(
                          selectedAnnouncement.priority,
                          selectedAnnouncement.title
                        ),
                      },
                    ]}
                  />
                  <Text style={styles.detailModalTitle}>Announcement Details</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowDetailModal(false)}
                  style={styles.detailModalClose}
                >
                  <Feather name="x" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.detailModalContent} showsVerticalScrollIndicator={false}>
                <View style={styles.detailBadges}>
                  {isNewAnnouncement(selectedAnnouncement.createdAt) && (
                    <View style={[styles.detailBadge, { backgroundColor: '#3b82f6' }]}>
                      <Text style={styles.detailBadgeText}>NEW</Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.detailBadge,
                      {
                        backgroundColor: getPriorityColor(
                          selectedAnnouncement.priority,
                          selectedAnnouncement.title
                        ),
                      },
                    ]}
                  >
                    <Text style={styles.detailBadgeText}>
                      {getPriorityLabel(selectedAnnouncement.priority, selectedAnnouncement.title)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.detailTitle}>{selectedAnnouncement.title}</Text>

                <View style={styles.detailMeta}>
                  <View style={styles.detailMetaItem}>
                    <Feather name="clock" size={14} color="#64748b" />
                    <Text style={styles.detailMetaText}>
                      {selectedAnnouncement.createdAt
                        ? dayjs(selectedAnnouncement.createdAt.toDate()).format('MMM D, YYYY • h:mm A')
                        : 'Just now'}
                    </Text>
                  </View>
                  {selectedAnnouncement.createdByName && (
                    <View style={styles.detailMetaItem}>
                      <Feather name="user" size={14} color="#64748b" />
                      <Text style={styles.detailMetaText}>
                        by {selectedAnnouncement.createdByName}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.detailMessageContainer}>
                  <Text style={styles.detailMessage}>{selectedAnnouncement.message}</Text>
                </View>
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  if (loading && isUserAuthenticated) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#14203d', '#0f172a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.userName}>{userData?.name || 'Student'}</Text>
              <Text style={styles.role}>Student</Text>
            </View>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => router.push('/student/profile')}
            >
              {userData?.photoURL ? (
                <Image source={{ uri: userData.photoURL }} style={styles.profileImage} />
              ) : (
                <View style={[styles.profileImage, styles.profileFallback]}>
                  <Text style={styles.profileInitials}>
                    {userData?.name ? userData.name.charAt(0).toUpperCase() : 'S'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.headerBottom}>
            <View style={styles.dateContainer}>
              <Feather name="calendar" size={12} color="#94a3b8" />
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </View>
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>Loading announcements...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#14203d', '#06080b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{userData?.name || 'Student'}</Text>
            <Text style={styles.role}>Student</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/student/profile')}
          >
            {userData?.photoURL ? (
              <Image source={{ uri: userData.photoURL }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImage, styles.profileFallback]}>
                <Text style={styles.profileInitials}>
                  {userData?.name ? userData.name.charAt(0).toUpperCase() : 'S'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.headerBottom}>
          <View style={styles.dateContainer}>
            <Feather name="calendar" size={12} color="#94a3b8" />
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {isUserAuthenticated ? (
        <>
          {/* Stats */}
          <View style={styles.statsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
              <View style={[styles.statCard, { borderRightWidth: 3, borderRightColor: '#1266d4' }]}>
                <View style={[styles.statIcon, { backgroundColor: '#0ea5e915' }]}>
                  <Icon name="file-document" size={18} color="#0ea5e9" />
                </View>
                <Text style={styles.statNumber}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={[styles.statCard, { borderRightWidth: 3, borderRightColor: '#1266d4' }]}>
                <View style={[styles.statIcon, { backgroundColor: '#10b98115' }]}>
                  <Feather name="sun" size={18} color="#10b981" />
                </View>
                <Text style={styles.statNumber}>{stats.today}</Text>
                <Text style={styles.statLabel}>Today</Text>
              </View>
              <View style={[styles.statCard, { borderRightWidth: 3, borderRightColor: '#1266d4' }]}>
                <View style={[styles.statIcon, { backgroundColor: '#f59e0b15' }]}>
                  <Icon name="flag" size={18} color="#f59e0b" />
                </View>
                <Text style={styles.statNumber}>{stats.important}</Text>
                <Text style={styles.statLabel}>Important</Text>
              </View>
              <View style={[styles.statCard, { borderRightWidth: 3, borderRightColor: '#1266d4' }]}>
                <View style={[styles.statIcon, { backgroundColor: '#ef444415' }]}>
                  <Icon name="alert-circle" size={18} color="#ef4444" />
                </View>
                <Text style={styles.statNumber}>{stats.urgent}</Text>
                <Text style={styles.statLabel}>Urgent</Text>
              </View>
            </ScrollView>
          </View>

          {/* Search Bar */}
          <View style={styles.searchSection}>
            <View style={styles.searchBar}>
              <Feather name="search" size={18} color="#64748b" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search announcements..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#94a3b8"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClear}>
                  <Feather name="x" size={18} color="#64748b" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Filter Chips */}
          <View style={styles.filterSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              {(['all', 'today', 'week', 'month'] as const).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[styles.filterChip, timeFilter === filter && styles.filterChipActive]}
                  onPress={() => setTimeFilter(filter)}
                >
                  <Text style={[styles.filterChipText, timeFilter === filter && styles.filterChipTextActive]}>
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.resultsInfo}>
            <Text style={styles.resultsText}>
              {filteredAnnouncements.length} announcement{filteredAnnouncements.length !== 1 ? 's' : ''}
              {timeFilter !== 'all' && ` from ${timeFilter}`}
              {searchQuery ? ` matching "${searchQuery}"` : ''}
            </Text>
          </View>

          {queryError ? (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={24} color="#DC2626" />
              <Text style={styles.errorText}>{queryError}</Text>
            </View>
          ) : (
            <FlatList
              data={paginatedAnnouncements}
              keyExtractor={(item) => item.id}
              renderItem={renderAnnouncementCard}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#0ea5e9']} />
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <View style={styles.emptyStateIcon}>
                    <Icon name="bullhorn-outline" size={40} color="#cbd5e1" />
                  </View>
                  <Text style={styles.emptyStateTitle}>No announcements</Text>
                  <Text style={styles.emptyStateText}>
                    {searchQuery
                      ? 'Try different search terms'
                      : timeFilter !== 'all'
                        ? `No announcements from ${timeFilter}`
                        : 'Check back later for new announcements'}
                  </Text>
                </View>
              }
              ListFooterComponent={renderPagination}
              ListFooterComponentStyle={styles.paginationWrapper}
            />
          )}
        </>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyStateIcon}>
            <Icon name="account-off" size={40} color="#cbd5e1" />
          </View>
          <Text style={styles.emptyStateTitle}>Please log in</Text>
          <Text style={styles.emptyStateText}>Sign in to see the latest campus updates</Text>
        </View>
      )}

      {renderDetailModal()}
    </View>
  );
}
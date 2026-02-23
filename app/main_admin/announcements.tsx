import { Feather, FontAwesome6, Ionicons, MaterialIcons } from '@expo/vector-icons';
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc,
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import { useAuth } from "../../context/AuthContext";
import { db } from "../../lib/firebaseConfig";
import { announcementStyles } from '../../styles/main-admin/announcementStyles';

dayjs.extend(relativeTime);

interface Announcement {
  id: string;
  title: string;
  message: string;
  createdAt?: any;
}

export default function MainAdminAnnouncements() {
  const { width: screenWidth } = useWindowDimensions();
  
  const isMobile = screenWidth < 640;
  const isTablet = screenWidth >= 640 && screenWidth < 1024;
  const isDesktop = screenWidth >= 1024;
  const isSmallScreen = screenWidth < 375;

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [paginatedAnnouncements, setPaginatedAnnouncements] = useState<Announcement[]>([]);
  const [searchResults, setSearchResults] = useState<Announcement[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'week' | 'month' | 'pinned'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [itemsPerPage] = useState(isMobile ? 5 : 10);

  const [selectedAnnouncement, setSelectedAnnouncement] = useState<string | null>(null);
  const [priority, setPriority] = useState<'normal' | 'important' | 'urgent'>('normal');
  const { user, userData } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const q = query(collection(db, "updates"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Announcement[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Announcement, "id">),
      }));
      setAnnouncements(list);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching announcements:", error);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let filtered = filterAnnouncementsByTime(announcements, activeFilter);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedAnnouncements(filtered.slice(startIndex, endIndex));
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
  }, [announcements, activeFilter, currentPage, itemsPerPage]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      const results = announcements.filter(ann =>
        ann.title.toLowerCase().includes(searchLower) ||
        ann.message.toLowerCase().includes(searchLower)
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, announcements]);

  const filterAnnouncementsByTime = (announcementsList: Announcement[], filter: 'all' | 'week' | 'month' | 'pinned') => {
    const now = dayjs();

    switch (filter) {
      case 'week':
        return announcementsList.filter(ann => {
          if (!ann.createdAt) return false;
          return dayjs(ann.createdAt.toDate()).isAfter(now.subtract(1, 'week'));
        });
      case 'month':
        return announcementsList.filter(ann => {
          if (!ann.createdAt) return false;
          return dayjs(ann.createdAt.toDate()).isAfter(now.subtract(1, 'month'));
        });
      case 'pinned':
        return announcementsList.filter(ann =>
          ann.title.toLowerCase().includes('important') ||
          ann.title.toLowerCase().includes('urgent')
        );
      default:
        return announcementsList;
    }
  };

  const handleFilterChange = (filter: 'all' | 'week' | 'month' | 'pinned') => {
    setActiveFilter(filter);
    setCurrentPage(1); 
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const handleAddAnnouncement = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert("Validation Error", "Please fill in both title and message");
      return;
    }

    let finalTitle = title.trim();
    if (priority === 'urgent' && !finalTitle.toLowerCase().includes('urgent')) {
      finalTitle = `URGENT: ${finalTitle}`;
    } else if (priority === 'important' && !finalTitle.toLowerCase().includes('important')) {
      finalTitle = `IMPORTANT: ${finalTitle}`;
    }

    try {
      await addDoc(collection(db, "updates"), {
        title: finalTitle,
        message: message.trim(),
        createdAt: serverTimestamp(),
      });
      resetForm();
      Alert.alert("Success", "Announcement created successfully!");
    } catch (error) {
      console.error("Error adding announcement:", error);
      Alert.alert("Error", "Failed to create announcement");
    }
  };

  const handleEditStart = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setTitle(announcement.title);
    setMessage(announcement.message);

    if (announcement.title.toLowerCase().includes('urgent')) {
      setPriority('urgent');
    } else if (announcement.title.toLowerCase().includes('important')) {
      setPriority('important');
    } else {
      setPriority('normal');
    }

    setShowCreateForm(true);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !title.trim() || !message.trim()) return;
    let finalTitle = title.trim();
    if (priority === 'urgent' && !finalTitle.toLowerCase().includes('urgent')) {
      finalTitle = `URGENT: ${finalTitle}`;
    } else if (priority === 'important' && !finalTitle.toLowerCase().includes('important')) {
      finalTitle = `IMPORTANT: ${finalTitle}`;
    }

    try {
      const announcementRef = doc(db, "updates", editingId);
      await updateDoc(announcementRef, {
        title: finalTitle,
        message: message.trim()
      });
      resetForm();
      Alert.alert("Success", "Announcement updated successfully!");
    } catch (error) {
      console.error("Error updating announcement:", error);
      Alert.alert("Error", "Failed to update announcement");
    }
  };

  const handleDelete = async (id: string, announcementTitle: string) => {
    if (Platform.OS === 'web') {
      const isConfirmed = window.confirm(`Are you sure you want to delete "${announcementTitle}"?`);
      if (isConfirmed) {
        try {
          await deleteDoc(doc(db, "updates", id));
          window.alert("Announcement deleted successfully!");
        } catch (error) {
          console.error("Error deleting announcement:", error);
          window.alert("Failed to delete announcement");
        }
      }
    } else {
      Alert.alert(
        "Delete Announcement",
        `Are you sure you want to delete "${announcementTitle}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteDoc(doc(db, "updates", id));
                Alert.alert("Success", "Announcement deleted successfully!");
              } catch (error) {
                console.error("Error deleting announcement:", error);
                Alert.alert("Error", "Failed to delete announcement");
              }
            }
          },
        ]
      );
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setMessage("");
    setPriority('normal');
    setShowCreateForm(false);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const stats = useMemo(() => {
    const total = announcements.length;
    const today = announcements.filter(ann => {
      if (!ann.createdAt) return false;
      return dayjs(ann.createdAt.toDate()).isSame(dayjs(), 'day');
    }).length;
    const urgent = announcements.filter(ann =>
      ann.title.toLowerCase().includes('urgent') ||
      ann.title.toLowerCase().includes('important')
    ).length;
    return { total, today, urgent };
  }, [announcements]);

  const isNewAnnouncement = (createdAt: any) => {
    if (!createdAt) return false;
    return dayjs(createdAt.toDate()).isAfter(dayjs().subtract(1, 'day'));
  };

  const isUrgentAnnouncement = (title: string) => {
    return title.toLowerCase().includes('urgent');
  };

  const isImportantAnnouncement = (title: string) => {
    return title.toLowerCase().includes('important');
  };

  const formatDate = (date: Date) => {
    return dayjs(date).format('MMM D, YYYY • h:mm A');
  };

  const getPriorityColor = (title: string) => {
    if (title.toLowerCase().includes('urgent')) return '#ef4444';
    if (title.toLowerCase().includes('important')) return '#f59e0b';
    return '#0ea5e9';
  };

  const renderPaginatedItem = ({ item, index }: { item: Announcement; index: number }) => {
    const isActive = selectedAnnouncement === item.id;
    const priorityColor = getPriorityColor(item.title);

    return (
      <TouchableOpacity
        style={[
          styles.paginatedItem, 
          isActive && styles.paginatedItemActive,
          isMobile && styles.paginatedItemMobile
        ]}
        onPress={() => setSelectedAnnouncement(item.id)}
      >
        <View style={[styles.paginatedNumber, { backgroundColor: `${priorityColor}15` }]}>
          <Text style={[styles.paginatedNumberText, { color: priorityColor }]}>
            {(currentPage - 1) * itemsPerPage + index + 1}
          </Text>
        </View>
        <View style={styles.paginatedInfo}>
          <Text style={[styles.paginatedTitle, isMobile && styles.paginatedTitleMobile]} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.paginatedMeta}>
            <Text style={[styles.paginatedDate, isMobile && styles.paginatedDateMobile]}>
              {item.createdAt ? dayjs(item.createdAt.toDate()).fromNow() : 'Just now'}
            </Text>
            {isNewAnnouncement(item.createdAt) && (
              <View style={[styles.paginatedBadge, { backgroundColor: '#3b82f6' }]}>
                <Text style={styles.paginatedBadgeText}>NEW</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.paginatedActions}>
          <TouchableOpacity
            style={[styles.paginatedEditButton, isMobile && styles.paginatedEditButtonMobile]}
            onPress={() => handleEditStart(item)}
          >
            <Feather name="edit-2" size={isMobile ? 12 : 14} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.paginatedDeleteButton, isMobile && styles.paginatedDeleteButtonMobile]}
            onPress={() => handleDelete(item.id, item.title)}
          >
            <Feather name="trash-2" size={isMobile ? 12 : 14} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSearchResultItem = ({ item }: { item: Announcement }) => {
    const priorityColor = getPriorityColor(item.title);

    return (
      <View style={[styles.searchResultItem, isMobile && styles.searchResultItemMobile]}>
        <View style={styles.searchResultHeader}>
          <View style={styles.searchResultTitleContainer}>
            <Text style={[styles.searchResultTitle, isMobile && styles.searchResultTitleMobile]} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.searchResultBadges}>
              {isNewAnnouncement(item.createdAt) && (
                <View style={[styles.searchResultBadge, { backgroundColor: '#3b82f6' }]}>
                  <Text style={styles.searchResultBadgeText}>NEW</Text>
                </View>
              )}
              {isUrgentAnnouncement(item.title) && (
                <View style={[styles.searchResultBadge, { backgroundColor: '#ef4444' }]}>
                  <Text style={styles.searchResultBadgeText}>URGENT</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.searchResultActions}>
            <TouchableOpacity
              style={[styles.searchResultEditButton, isMobile && styles.searchResultEditButtonMobile]}
              onPress={() => handleEditStart(item)}
            >
              <Feather name="edit-2" size={isMobile ? 12 : 14} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.searchResultDeleteButton, isMobile && styles.searchResultDeleteButtonMobile]}
              onPress={() => handleDelete(item.id, item.title)}
            >
              <Feather name="trash-2" size={isMobile ? 12 : 14} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.searchResultMessage, isMobile && styles.searchResultMessageMobile]} numberOfLines={2}>
          {item.message}
        </Text>

        <View style={styles.searchResultFooter}>
          <View style={styles.searchResultDate}>
            <Feather name="clock" size={isMobile ? 8 : 10} color="#64748b" />
            <Text style={[styles.searchResultDateText, isMobile && styles.searchResultDateTextMobile]}>
              {item.createdAt ? dayjs(item.createdAt.toDate()).fromNow() : 'Just now'}
            </Text>
          </View>
          <Text style={[styles.searchResultFullDate, isMobile && styles.searchResultFullDateMobile]}>
            {item.createdAt ? dayjs(item.createdAt.toDate()).format('MMM D, YYYY') : ''}
          </Text>
        </View>
      </View>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <View style={[styles.paginationContainer, isMobile && styles.paginationContainerMobile]}>
        <TouchableOpacity
          style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled, isMobile && styles.paginationButtonMobile]}
          onPress={handlePrevPage}
          disabled={currentPage === 1}
        >
          <Feather name="chevron-left" size={isMobile ? 14 : 16} color={currentPage === 1 ? '#cbd5e1' : '#0ea5e9'} />
          {!isMobile && <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>
            Prev
          </Text>}
        </TouchableOpacity>

        <View style={styles.pageInfo}>
          <Text style={[styles.pageInfoText, isMobile && styles.pageInfoTextMobile]}>{currentPage}/{totalPages}</Text>
        </View>

        <TouchableOpacity
          style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled, isMobile && styles.paginationButtonMobile]}
          onPress={handleNextPage}
          disabled={currentPage === totalPages}
        >
          {!isMobile && <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonTextDisabled]}>
            Next
          </Text>}
          <Feather name="chevron-right" size={isMobile ? 14 : 16} color={currentPage === totalPages ? '#cbd5e1' : '#0ea5e9'} />
        </TouchableOpacity>
      </View>
    );
  };

  const styles = announcementStyles;

  return (
    <View style={styles.container}>
      {/* Header with Gradient (matching dashboard) */}
      <LinearGradient
        colors={['#14203d', '#06080b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, isMobile && styles.headerGradientMobile]}
      >
        <View style={[styles.headerContent, isMobile && styles.headerContentMobile]}>
          <View>
            <Text style={[styles.greetingText, isMobile && styles.greetingTextMobile]}>Welcome back,</Text>
            <Text style={[styles.userName, isMobile && styles.userNameMobile]}>{userData?.name || 'Admin'}</Text>
            <Text style={[styles.roleText, isMobile && styles.roleTextMobile]}>Announcements Manager</Text>
          </View>

          <TouchableOpacity
            style={[styles.profileButton, isMobile && styles.profileButtonMobile]}
            onPress={() => router.push('/main_admin/profile')}
          >
            {userData?.photoURL ? (
              <Image
                source={{ uri: userData.photoURL }}
                style={styles.profileImage}
              />
            ) : (
              <View style={[styles.profileImage, styles.profileFallback]}>
                <Text style={[styles.profileInitials, isMobile && styles.profileInitialsMobile]}>
                  {userData?.name ? userData.name.charAt(0).toUpperCase() : 'A'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.dateSection, isMobile && styles.dateSectionMobile]}>
          <View style={[styles.dateContainer, isMobile && styles.dateContainerMobile]}>
            <Feather name="calendar" size={isMobile ? 10 : 12} color="#94a3b8" />
            <Text style={[styles.dateText, isMobile && styles.dateTextMobile]}>
              {new Date().toLocaleDateString('en-US', {
                weekday: isMobile ? 'short' : 'long',
                year: 'numeric',
                month: isMobile ? 'short' : 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.headerAction, isMobile && styles.headerActionMobile]}
              onPress={() => setShowCreateForm(true)}
            >
              <Feather name="plus" size={isMobile ? 16 : 18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Stats Grid - Responsive */}
      <View style={[styles.statsGrid, isMobile && styles.statsGridMobile]}>
        <View style={[styles.statCard, isMobile && styles.statCardMobile, { borderLeftColor: '#0ea5e9' }]}>
          <View style={[styles.statIconContainer, isMobile && styles.statIconContainerMobile, { backgroundColor: '#0ea5e915' }]}>
            <Ionicons name="document-text" size={isMobile ? 16 : 20} color="#0ea5e9" />
          </View>
          <Text style={[styles.statNumber, isMobile && styles.statNumberMobile]}>{stats.total}</Text>
          <Text style={[styles.statLabel, isMobile && styles.statLabelMobile]}>Total</Text>
        </View>

        <View style={[styles.statCard, isMobile && styles.statCardMobile, { borderLeftColor: '#10b981' }]}>
          <View style={[styles.statIconContainer, isMobile && styles.statIconContainerMobile, { backgroundColor: '#10b98115' }]}>
            <Feather name="sun" size={isMobile ? 16 : 20} color="#10b981" />
          </View>
          <Text style={[styles.statNumber, isMobile && styles.statNumberMobile]}>{stats.today}</Text>
          <Text style={[styles.statLabel, isMobile && styles.statLabelMobile]}>Today</Text>
        </View>

        <View style={[styles.statCard, isMobile && styles.statCardMobile, { borderLeftColor: '#f59e0b' }]}>
          <View style={[styles.statIconContainer, isMobile && styles.statIconContainerMobile, { backgroundColor: '#f59e0b15' }]}>
            <MaterialIcons name="priority-high" size={isMobile ? 16 : 20} color="#f59e0b" />
          </View>
          <Text style={[styles.statNumber, isMobile && styles.statNumberMobile]}>{stats.urgent}</Text>
          <Text style={[styles.statLabel, isMobile && styles.statLabelMobile]}>Urgent</Text>
        </View>
      </View>

      {/* Main Content Grid - Responsive */}
      <View style={[styles.mainContent, isMobile && styles.mainContentMobile]}>
        {/* Left Grid - Paginated Announcements */}
        <View style={[styles.leftGrid, isMobile && styles.leftGridMobile]}>
          <View style={[styles.leftHeader, isMobile && styles.leftHeaderMobile]}>
            <Text style={[styles.leftTitle, isMobile && styles.leftTitleMobile]}>Announcements</Text>
            <View style={[styles.leftControls, isMobile && styles.leftControlsMobile]}>
              <Text style={[styles.announcementCount, isMobile && styles.announcementCountMobile]}>
                {filterAnnouncementsByTime(announcements, activeFilter).length}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={[styles.leftFilters, isMobile && styles.leftFiltersMobile]}
              >
                <TouchableOpacity
                  style={[
                    styles.leftFilterButton,
                    activeFilter === 'all' && styles.leftFilterButtonActive,
                    isMobile && styles.leftFilterButtonMobile
                  ]}
                  onPress={() => handleFilterChange('all')}
                >
                  <Text style={[
                    styles.leftFilterButtonText,
                    activeFilter === 'all' && styles.leftFilterButtonTextActive,
                    isMobile && styles.leftFilterButtonTextMobile
                  ]}>All</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.leftFilterButton,
                    activeFilter === 'week' && styles.leftFilterButtonActive,
                    isMobile && styles.leftFilterButtonMobile
                  ]}
                  onPress={() => handleFilterChange('week')}
                >
                  <Text style={[
                    styles.leftFilterButtonText,
                    activeFilter === 'week' && styles.leftFilterButtonTextActive,
                    isMobile && styles.leftFilterButtonTextMobile
                  ]}>Week</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.leftFilterButton,
                    activeFilter === 'month' && styles.leftFilterButtonActive,
                    isMobile && styles.leftFilterButtonMobile
                  ]}
                  onPress={() => handleFilterChange('month')}
                >
                  <Text style={[
                    styles.leftFilterButtonText,
                    activeFilter === 'month' && styles.leftFilterButtonTextActive,
                    isMobile && styles.leftFilterButtonTextMobile
                  ]}>Month</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.leftFilterButton,
                    activeFilter === 'pinned' && styles.leftFilterButtonActive,
                    isMobile && styles.leftFilterButtonMobile
                  ]}
                  onPress={() => handleFilterChange('pinned')}
                >
                  <Text style={[
                    styles.leftFilterButtonText,
                    activeFilter === 'pinned' && styles.leftFilterButtonTextActive,
                    isMobile && styles.leftFilterButtonTextMobile
                  ]}>Important</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size={isMobile ? "small" : "large"} color="#0ea5e9" />
              <Text style={[styles.loadingText, isMobile && styles.loadingTextMobile]}>Loading...</Text>
            </View>
          ) : (
            <>
              <FlatList
                data={paginatedAnnouncements}
                keyExtractor={(item) => item.id}
                renderItem={renderPaginatedItem}
                style={styles.paginatedList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={[styles.emptyState, isMobile && styles.emptyStateMobile]}>
                    <View style={[styles.emptyStateIcon, isMobile && styles.emptyStateIconMobile]}>
                      <FontAwesome6 name="bullhorn" size={isMobile ? 24 : 32} color="#cbd5e1" />
                    </View>
                    <Text style={[styles.emptyStateTitle, isMobile && styles.emptyStateTitleMobile]}>No announcements</Text>
                    <Text style={[styles.emptyStateText, isMobile && styles.emptyStateTextMobile]}>
                      Create your first announcement to get started
                    </Text>
                  </View>
                }
              />

              {/* Selected Announcement Detail View - Responsive */}
              {selectedAnnouncement && (
                <View style={[styles.selectedDetailContainer, isMobile && styles.selectedDetailContainerMobile]}>
                  <View style={[styles.selectedDetailHeader, isMobile && styles.selectedDetailHeaderMobile]}>
                    <Text style={[styles.selectedDetailTitle, isMobile && styles.selectedDetailTitleMobile]}>Details</Text>
                    <TouchableOpacity onPress={() => setSelectedAnnouncement(null)}>
                      <Feather name="x" size={isMobile ? 18 : 20} color="#64748b" />
                    </TouchableOpacity>
                  </View>

                  {(() => {
                    const selected = announcements.find(a => a.id === selectedAnnouncement);
                    if (!selected) return null;

                    return (
                      <View style={styles.selectedDetailContent}>
                        <View style={[styles.selectedDetailBadges, isMobile && styles.selectedDetailBadgesMobile]}>
                          {isNewAnnouncement(selected.createdAt) && (
                            <View style={[styles.detailBadge, { backgroundColor: '#3b82f6' }, isMobile && styles.detailBadgeMobile]}>
                              <Text style={[styles.detailBadgeText, isMobile && styles.detailBadgeTextMobile]}>NEW</Text>
                            </View>
                          )}
                          {isUrgentAnnouncement(selected.title) && (
                            <View style={[styles.detailBadge, { backgroundColor: '#ef4444' }, isMobile && styles.detailBadgeMobile]}>
                              <Text style={[styles.detailBadgeText, isMobile && styles.detailBadgeTextMobile]}>URGENT</Text>
                            </View>
                          )}
                          {isImportantAnnouncement(selected.title) && (
                            <View style={[styles.detailBadge, { backgroundColor: '#f59e0b' }, isMobile && styles.detailBadgeMobile]}>
                              <Text style={[styles.detailBadgeText, isMobile && styles.detailBadgeTextMobile]}>IMPORTANT</Text>
                            </View>
                          )}
                        </View>

                        <Text style={[styles.selectedDetailMessage, isMobile && styles.selectedDetailMessageMobile]}>
                          {selected.message}
                        </Text>

                        <View style={[styles.selectedDetailFooter, isMobile && styles.selectedDetailFooterMobile]}>
                          <View style={[styles.selectedDetailDate, isMobile && styles.selectedDetailDateMobile]}>
                            <Feather name="calendar" size={isMobile ? 12 : 14} color="#64748b" />
                            <Text style={[styles.selectedDetailDateText, isMobile && styles.selectedDetailDateTextMobile]}>
                              {selected.createdAt ? dayjs(selected.createdAt.toDate()).format('MMM D, YYYY') : ''}
                            </Text>
                          </View>

                          <View style={[styles.selectedDetailActions, isMobile && styles.selectedDetailActionsMobile]}>
                            <TouchableOpacity
                              style={[styles.selectedDetailEditButton, isMobile && styles.selectedDetailEditButtonMobile]}
                              onPress={() => handleEditStart(selected)}
                            >
                              <Feather name="edit-2" size={isMobile ? 14 : 16} color="#3b82f6" />
                              {!isMobile && <Text style={styles.selectedDetailEditText}>Edit</Text>}
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.selectedDetailDeleteButton, isMobile && styles.selectedDetailDeleteButtonMobile]}
                              onPress={() => handleDelete(selected.id, selected.title)}
                            >
                              <Feather name="trash-2" size={isMobile ? 14 : 16} color="#ef4444" />
                              {!isMobile && <Text style={styles.selectedDetailDeleteText}>Delete</Text>}
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  })()}
                </View>
              )}

              {renderPagination()}
            </>
          )}
        </View>

        {/* Right Grid - Search and Results */}
        <View style={[styles.rightGrid, isMobile && styles.rightGridMobile]}>
          <View style={[styles.rightHeader, isMobile && styles.rightHeaderMobile]}>
            <Text style={[styles.searchTitle, isMobile && styles.searchTitleMobile]}>Search</Text>

            {/* Search Bar */}
            <View style={[styles.searchContainer, isMobile && styles.searchContainerMobile]}>
              <Feather name="search" size={isMobile ? 14 : 16} color="#64748b" />
              <TextInput
                style={[styles.searchInput, isMobile && styles.searchInputMobile]}
                placeholder="Type to search..."
                value={searchQuery}
                onChangeText={handleSearch}
                autoCapitalize="none"
                placeholderTextColor="#94a3b8"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={clearSearch} style={styles.searchClearButton}>
                  <Feather name="x" size={isMobile ? 14 : 16} color="#64748b" />
                </TouchableOpacity>
              )}
            </View>

            {/* Search Stats */}
            {searchQuery && (
              <View style={[styles.searchStats, isMobile && styles.searchStatsMobile]}>
                <Text style={[styles.resultsCount, isMobile && styles.resultsCountMobile]}>
                  Found <Text style={styles.resultsHighlight}>{searchResults.length}</Text> {isMobile ? '' : 'results'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.searchResultsContainer}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size={isMobile ? "small" : "small"} color="#0ea5e9" />
              </View>
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={renderSearchResultItem}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  searchQuery ? (
                    <View style={[styles.emptyState, isMobile && styles.emptyStateMobile]}>
                      <View style={[styles.emptyStateIcon, isMobile && styles.emptyStateIconMobile]}>
                        <Feather name="search" size={isMobile ? 24 : 32} color="#cbd5e1" />
                      </View>
                      <Text style={[styles.emptyStateTitle, isMobile && styles.emptyStateTitleMobile]}>No matches</Text>
                      <Text style={[styles.emptyStateText, isMobile && styles.emptyStateTextMobile]}>
                        Try different keywords
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.emptyState, isMobile && styles.emptyStateMobile]}>
                      <View style={[styles.emptyStateIcon, isMobile && styles.emptyStateIconMobile]}>
                        <Feather name="search" size={isMobile ? 24 : 32} color="#cbd5e1" />
                      </View>
                      <Text style={[styles.emptyStateTitle, isMobile && styles.emptyStateTitleMobile]}>Start searching</Text>
                      <Text style={[styles.emptyStateText, isMobile && styles.emptyStateTextMobile]}>
                        Type to find announcements
                      </Text>
                    </View>
                  )
                }
              />
            )}
          </View>
        </View>
      </View>

      {/* Create/Edit Modal - Responsive */}
      <Modal
        visible={showCreateForm}
        transparent={true}
        animationType="fade"
        onRequestClose={resetForm}
      >
        <View style={styles.modernModalOverlay}>
          <View style={[styles.modernModalContainer, isMobile && styles.modernModalContainerMobile]}>
            <View style={[styles.modernModalHeader, isMobile && styles.modernModalHeaderMobile]}>
              <View style={[styles.modernModalHeaderLeft, isMobile && styles.modernModalHeaderLeftMobile]}>
                <View style={[styles.modernModalIconContainer, isMobile && styles.modernModalIconContainerMobile]}>
                  <FontAwesome6
                    name={editingId ? "pen-to-square" : "bullhorn"}
                    size={isMobile ? 16 : 20}
                    color="#0ea5e9"
                  />
                </View>
                <View style={styles.modernModalTitleContainer}>
                  <Text style={[styles.modernModalTitle, isMobile && styles.modernModalTitleMobile]}>
                    {editingId ? 'Edit' : 'New'}
                  </Text>
                  <Text style={[styles.modernModalSubtitle, isMobile && styles.modernModalSubtitleMobile]}>
                    {editingId ? 'Update details' : 'Create announcement'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={resetForm}
                style={[styles.modernModalCloseButton, isMobile && styles.modernModalCloseButtonMobile]}
              >
                <Feather name="x" size={isMobile ? 18 : 20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              <ScrollView style={[styles.modernModalContent, isMobile && styles.modernModalContentMobile]}>
                <View style={styles.modernFormGroup}>
                  <Text style={[styles.modernFormLabel, isMobile && styles.modernFormLabelMobile]}>Priority</Text>
                  <View style={[styles.priorityContainer, isMobile && styles.priorityContainerMobile]}>
                    <TouchableOpacity
                      style={[
                        styles.priorityButton,
                        priority === 'normal' && styles.priorityButtonNormalActive,
                        isMobile && styles.priorityButtonMobile
                      ]}
                      onPress={() => setPriority('normal')}
                    >
                      <View style={[
                        styles.priorityIndicator,
                        { backgroundColor: '#0ea5e9' },
                        isMobile && styles.priorityIndicatorMobile
                      ]} />
                      <Text style={[
                        styles.priorityButtonText,
                        priority === 'normal' && styles.priorityButtonTextActive,
                        isMobile && styles.priorityButtonTextMobile
                      ]}>Normal</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.priorityButton,
                        priority === 'important' && styles.priorityButtonImportantActive,
                        isMobile && styles.priorityButtonMobile
                      ]}
                      onPress={() => setPriority('important')}
                    >
                      <View style={[
                        styles.priorityIndicator,
                        { backgroundColor: '#f59e0b' },
                        isMobile && styles.priorityIndicatorMobile
                      ]} />
                      <Text style={[
                        styles.priorityButtonText,
                        priority === 'important' && styles.priorityButtonTextActive,
                        isMobile && styles.priorityButtonTextMobile
                      ]}>Important</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.priorityButton,
                        priority === 'urgent' && styles.priorityButtonUrgentActive,
                        isMobile && styles.priorityButtonMobile
                      ]}
                      onPress={() => setPriority('urgent')}
                    >
                      <View style={[
                        styles.priorityIndicator,
                        { backgroundColor: '#ef4444' },
                        isMobile && styles.priorityIndicatorMobile
                      ]} />
                      <Text style={[
                        styles.priorityButtonText,
                        priority === 'urgent' && styles.priorityButtonTextActive,
                        isMobile && styles.priorityButtonTextMobile
                      ]}>Urgent</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.modernFormGroup}>
                  <Text style={[styles.modernFormLabel, isMobile && styles.modernFormLabelMobile]}>Title</Text>
                  <TextInput
                    style={[styles.modernFormInput, isMobile && styles.modernFormInputMobile]}
                    placeholder="Enter title"
                    placeholderTextColor="#94a3b8"
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>

                <View style={styles.modernFormGroup}>
                  <Text style={[styles.modernFormLabel, isMobile && styles.modernFormLabelMobile]}>Message</Text>
                  <TextInput
                    style={[styles.modernFormInput, styles.modernTextArea, isMobile && styles.modernFormInputMobile]}
                    placeholder="Write message..."
                    placeholderTextColor="#94a3b8"
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    numberOfLines={isMobile ? 4 : 6}
                    textAlignVertical="top"
                  />
                </View>

                <View style={[styles.modernFormActions, isMobile && styles.modernFormActionsMobile]}>
                  <TouchableOpacity
                    style={[
                      styles.modernSubmitButton,
                      (!title.trim() || !message.trim()) && styles.modernSubmitButtonDisabled,
                      isMobile && styles.modernSubmitButtonMobile
                    ]}
                    onPress={editingId ? handleSaveEdit : handleAddAnnouncement}
                    disabled={!title.trim() || !message.trim()}
                  >
                    <Feather
                      name={editingId ? "check-circle" : "send"}
                      size={isMobile ? 16 : 18}
                      color="#ffffff"
                    />
                    <Text style={[styles.modernSubmitButtonText, isMobile && styles.modernSubmitButtonTextMobile]}>
                      {editingId ? 'Save' : 'Publish'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modernCancelButton, isMobile && styles.modernCancelButtonMobile]}
                    onPress={resetForm}
                  >
                    <Text style={[styles.modernCancelButtonText, isMobile && styles.modernCancelButtonTextMobile]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
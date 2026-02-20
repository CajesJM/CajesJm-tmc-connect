import {
  Feather,
  FontAwesome6,
  Ionicons,
  MaterialIcons,
  Octicons
} from '@expo/vector-icons';
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions
} from 'react-native';
import { useAuth } from "../../context/AuthContext";
import { db } from "../../lib/firebaseConfig";

dayjs.extend(relativeTime);

interface Announcement {
  id: string;
  title: string;
  message: string;
  createdAt?: any;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#cbd5e1',
    fontSize: 12,
    marginTop: 2,
  },
  createAnnouncementButton: {
    backgroundColor: '#0ea5e9',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  createAnnouncementButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardPrimary: {
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  statCardSuccess: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  statCardWarning: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  controlsContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#1e293b',
  },
  filtersContainer: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f1f5f9',
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  resultsSubtitle: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  resultsFilterText: {
    fontSize: 12,
    color: '#64748b',
  },
  resultsSearchText: {
    fontSize: 12,
    color: '#0ea5e9',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  urgentCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  importantCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  newBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  urgentBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  importantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  importantBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardMessage: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#64748b',
  },
  fullDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 300,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyStateButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalBackText: {
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: '600',
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginLeft: -80,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1e293b',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  formActions: {
    marginTop: 24,
    gap: 12,
  },
  submitButton: {
    backgroundColor: '#0ea5e9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default function MainAdminAnnouncements() {
  const { width: screenWidth } = useWindowDimensions();
  const isSmallScreen = screenWidth < 375;
  const isMediumScreen = screenWidth < 768;
  
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'week' | 'month' | 'pinned'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true); 
  const { user } = useAuth();

  useEffect(() => {
    const q = query(collection(db, "updates"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Announcement[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Announcement, "id">),
      }));
      setAnnouncements(list);
      filterAnnouncements(list, activeFilter);
      setIsLoading(false); 
    }, (error) => {
      console.error("Error fetching announcements:", error);
      setIsLoading(false); 
    });
    return () => unsubscribe();
  }, []);

  const filterAnnouncements = (announcementsList: Announcement[], filter: 'all' | 'week' | 'month' | 'pinned') => {
    const now = dayjs();
    let filtered = announcementsList;

    switch (filter) {
      case 'week':
        filtered = announcementsList.filter(ann => {
          if (!ann.createdAt) return false;
          return dayjs(ann.createdAt.toDate()).isAfter(now.subtract(1, 'week'));
        });
        break;
      case 'month':
        filtered = announcementsList.filter(ann => {
          if (!ann.createdAt) return false;
          return dayjs(ann.createdAt.toDate()).isAfter(now.subtract(1, 'month'));
        });
        break;
      case 'pinned':
        filtered = announcementsList.filter(ann => ann.title.toLowerCase().includes('important') || 
                                                 ann.title.toLowerCase().includes('urgent'));
        break;
      default:
        filtered = announcementsList;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(ann => 
        ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ann.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredAnnouncements(filtered);
  };

  const handleFilterChange = (filter: 'all' | 'week' | 'month' | 'pinned') => {
    setActiveFilter(filter);
    filterAnnouncements(announcements, filter);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    filterAnnouncements(announcements, activeFilter);
  };

  const handleAddAnnouncement = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert("Validation Error", "Please fill in both title and message");
      return;
    }

    try {
      await addDoc(collection(db, "updates"), {
        title: title.trim(),
        message: message.trim(),
        createdAt: serverTimestamp(),
      });
      setTitle("");
      setMessage("");
      setShowCreateForm(false);
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
    setShowCreateForm(true);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !title.trim() || !message.trim()) return;
    
    try {
      const announcementRef = doc(db, "updates", editingId);
      await updateDoc(announcementRef, { 
        title: title.trim(), 
        message: message.trim() 
      });
      setEditingId(null);
      setTitle("");
      setMessage("");
      setShowCreateForm(false);
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

  const handleCloseCreateForm = () => {
    setEditingId(null);
    setTitle("");
    setMessage("");
    setShowCreateForm(false);
  };

  const totalAnnouncements = announcements.length;
  const todayAnnouncements = announcements.filter(ann => {
    if (!ann.createdAt) return false;
    return dayjs(ann.createdAt.toDate()).isSame(dayjs(), 'day');
  }).length;
  const urgentAnnouncements = announcements.filter(ann => 
    ann.title.toLowerCase().includes('urgent') || 
    ann.title.toLowerCase().includes('important')
  ).length;

  const formatDate = (date: Date) => {
    return dayjs(date).format('MMM D, YYYY • h:mm A');
  };

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

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#0ea5e9" />
      <Text style={styles.loadingText}>Loading announcements...</Text>
    </View>
  );

  const renderAnnouncementItem = ({ item }: { item: Announcement }) => (
    <View style={[
      styles.card,
      isUrgentAnnouncement(item.title) && styles.urgentCard,
      isImportantAnnouncement(item.title) && styles.importantCard,
    ]}>
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            {isNewAnnouncement(item.createdAt) && (
              <View style={styles.newBadge}>
                <Feather name="zap" size={10} color="#ffffff" />
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            )}
            {isUrgentAnnouncement(item.title) && (
              <View style={styles.urgentBadge}>
                <MaterialIcons name="warning" size={10} color="#ffffff" />
                <Text style={styles.urgentBadgeText}>URGENT</Text>
              </View>
            )}
            {isImportantAnnouncement(item.title) && (
              <View style={styles.importantBadge}>
                <Octicons name="star-fill" size={10} color="#ffffff" />
                <Text style={styles.importantBadgeText}>IMPORTANT</Text>
              </View>
            )}
          </View>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditStart(item)}
          >
            <Feather name="edit-2" size={16} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id, item.title)}
          >
            <Feather name="trash-2" size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.cardMessage} numberOfLines={3}>{item.message}</Text>
      
      {item.createdAt && (
        <View style={styles.cardFooter}>
          <View style={styles.dateInfo}>
            <Feather name="clock" size={12} color="#64748b" />
            <Text style={styles.timestamp}>
              {dayjs(item.createdAt.toDate()).fromNow()}
            </Text>
          </View>
          <Text style={styles.fullDate}>
            {formatDate(item.createdAt.toDate())}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <FontAwesome6 name="bullhorn" size={24} color="#ffffff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Announcements Management</Text>
            <Text style={styles.headerSubtitle}>Broadcast and manage official announcements</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.createAnnouncementButton}
          onPress={() => setShowCreateForm(true)}
        >
          <Feather name="plus" size={18} color="#ffffff" />
          <Text style={styles.createAnnouncementButtonText}>New Announcement</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.statCardPrimary]}>
          <View style={styles.statIconContainer}>
            <Ionicons name="document-text" size={20} color="#0ea5e9" />
          </View>
          <View>
            <Text style={styles.statNumber}>{totalAnnouncements}</Text>
            <Text style={styles.statLabel}>Total Announcements</Text>
          </View>
        </View>
        
        <View style={[styles.statCard, styles.statCardSuccess]}>
          <View style={styles.statIconContainer}>
            <Feather name="sun" size={20} color="#10b981" />
          </View>
          <View>
            <Text style={styles.statNumber}>{todayAnnouncements}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
        </View>
        
        <View style={[styles.statCard, styles.statCardWarning]}>
          <View style={styles.statIconContainer}>
            <MaterialIcons name="priority-high" size={20} color="#f59e0b" />
          </View>
          <View>
            <Text style={styles.statNumber}>{urgentAnnouncements}</Text>
            <Text style={styles.statLabel}>Urgent</Text>
          </View>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.controlsContainer}>
        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search announcements..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
        >
          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === 'all' && styles.filterButtonActive
            ]}
            onPress={() => handleFilterChange('all')}
          >
            <Feather name="grid" size={16} color={activeFilter === 'all' ? '#ffffff' : '#64748b'} />
            <Text style={[
              styles.filterButtonText,
              activeFilter === 'all' && styles.filterButtonTextActive
            ]}>All</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === 'week' && styles.filterButtonActive
            ]}
            onPress={() => handleFilterChange('week')}
          >
            <Feather name="calendar" size={16} color={activeFilter === 'week' ? '#ffffff' : '#64748b'} />
            <Text style={[
              styles.filterButtonText,
              activeFilter === 'week' && styles.filterButtonTextActive
            ]}>This Week</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === 'month' && styles.filterButtonActive
            ]}
            onPress={() => handleFilterChange('month')}
          >
            <Feather name="calendar" size={16} color={activeFilter === 'month' ? '#ffffff' : '#64748b'} />
            <Text style={[
              styles.filterButtonText,
              activeFilter === 'month' && styles.filterButtonTextActive
            ]}>This Month</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === 'pinned' && styles.filterButtonActive
            ]}
            onPress={() => handleFilterChange('pinned')}
          >
            <Octicons name="pin" size={16} color={activeFilter === 'pinned' ? '#ffffff' : '#64748b'} />
            <Text style={[
              styles.filterButtonText,
              activeFilter === 'pinned' && styles.filterButtonTextActive
            ]}>Important</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Results Info */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>
          {filteredAnnouncements.length} announcement{filteredAnnouncements.length !== 1 ? 's' : ''}
        </Text>
        <View style={styles.resultsSubtitle}>
          {activeFilter !== 'all' && (
            <Text style={styles.resultsFilterText}>
              • Filtered by {activeFilter}
            </Text>
          )}
          {searchQuery && (
            <Text style={styles.resultsSearchText}>
              • Matching "{searchQuery}"
            </Text>
          )}
        </View>
      </View>

      {isLoading ? (
        renderLoading()
      ) : (
        <FlatList
          data={filteredAnnouncements}
          keyExtractor={(item) => item.id}
          renderItem={renderAnnouncementItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <FontAwesome6 name="bullhorn" size={48} color="#cbd5e1" />
              </View>
              <Text style={styles.emptyStateTitle}>
                No announcements found
              </Text>
              <Text style={styles.emptyStateText}>
                {activeFilter !== 'all' || searchQuery 
                  ? 'Try changing your filters or search query'
                  : 'Create your first announcement to get started'}
              </Text>
              <TouchableOpacity 
                style={styles.emptyStateButton}
                onPress={() => setShowCreateForm(true)}
              >
                <Feather name="plus" size={18} color="#ffffff" />
                <Text style={styles.emptyStateButtonText}>Create Announcement</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Create/Edit Modal */}
      <Modal
        visible={showCreateForm}
        animationType="slide"
        presentationStyle={isSmallScreen ? "fullScreen" : "formSheet"}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderTop}>
              <TouchableOpacity onPress={handleCloseCreateForm} style={styles.modalBackButton}>
                <Feather name="arrow-left" size={20} color="#0ea5e9" />
                <Text style={styles.modalBackText}>Back</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {editingId ? 'Edit Announcement' : 'Create New Announcement'}
              </Text>
            </View>
            <Text style={styles.modalSubtitle}>
              {editingId ? 'Update the announcement details' : 'Fill in the announcement details'}
            </Text>
          </View>

          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            <ScrollView style={styles.modalContent}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Title *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter announcement title"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Message *</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  placeholder="Write your announcement message..."
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.formActions}>
                <TouchableOpacity 
                  style={[
                    styles.submitButton,
                    (!title.trim() || !message.trim()) && styles.submitButtonDisabled
                  ]}
                  onPress={editingId ? handleSaveEdit : handleAddAnnouncement}
                  disabled={!title.trim() || !message.trim()}
                >
                  <Feather 
                    name={editingId ? "save" : "check-circle"} 
                    size={18} 
                    color="#ffffff" 
                  />
                  <Text style={styles.submitButtonText}>
                    {editingId ? 'Save Changes' : 'Publish Announcement'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={handleCloseCreateForm}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}
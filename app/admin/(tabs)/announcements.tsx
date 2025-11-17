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
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions
} from 'react-native';
import { db } from "../../../lib/firebaseConfig";
import { useAuth } from "../../context/AuthContext";
import { AnnouncementStyles as styles } from "../../styles/AnnouncementStyles";

dayjs.extend(relativeTime);

interface Announcement {
  id: string;
  title: string;
  message: string;
  createdAt?: any;
}

export default function AnnouncementScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const isSmallScreen = screenWidth < 375;
  
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'week' | 'month'>('all');
  const [isLoading, setIsLoading] = useState(true); // Add loading state
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

  const filterAnnouncements = (announcementsList: Announcement[], filter: 'all' | 'week' | 'month') => {
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
      default:
        filtered = announcementsList;
    }

    setFilteredAnnouncements(filtered);
  };

  const handleFilterChange = (filter: 'all' | 'week' | 'month') => {
    setActiveFilter(filter);
    filterAnnouncements(announcements, filter);
  };

  const handleAddAnnouncement = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert("Error", "Please fill in both title and message");
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
  const thisWeekAnnouncements = announcements.filter(ann => {
    if (!ann.createdAt) return false;
    return dayjs(ann.createdAt.toDate()).isAfter(dayjs().subtract(1, 'week'));
  }).length;

  const formatDate = (date: Date) => {
    return dayjs(date).format('MMM D, YYYY [at] h:mm A');
  };
const renderLoading = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator 
      size="large" 
      color="#1E88E5"
    />
    <Text style={styles.loadingText}>Loading announcements...</Text>
  </View>
);

  const renderAnnouncementItem = ({ item }: { item: Announcement }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditStart(item)}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id, item.title)}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.cardMessage}>{item.message}</Text>
      
      {item.createdAt && (
        <View style={styles.dateContainer}>
          <Text style={styles.timestamp}>
            Created {dayjs(item.createdAt.toDate()).fromNow()}
          </Text>
          <Text style={styles.fullDate}>
            {formatDate(item.createdAt.toDate())}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Announcements</Text>
          <Text style={styles.subtitle}>Manage campus announcements</Text>
        </View>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => setShowCreateForm(true)}
        >
          <Text style={styles.createButtonText}>+ Create</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        renderLoading()
      ) : (
        <>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{totalAnnouncements}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{todayAnnouncements}</Text>
              <Text style={styles.statLabel}>Today</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{thisWeekAnnouncements}</Text>
              <Text style={styles.statLabel}>This Week</Text>
            </View>
          </View>

          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilter === 'all' && styles.filterButtonActive
              ]}
              onPress={() => handleFilterChange('all')}
            >
              <Text style={[
                styles.filterButtonText,
                activeFilter === 'all' && styles.filterButtonTextActive
              ]}>All Announcements</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilter === 'week' && styles.filterButtonActive
              ]}
              onPress={() => handleFilterChange('week')}
            >
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
              <Text style={[
                styles.filterButtonText,
                activeFilter === 'month' && styles.filterButtonTextActive
              ]}>This Month</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={filteredAnnouncements}
            keyExtractor={(item) => item.id}
            renderItem={renderAnnouncementItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>
                  {activeFilter === 'all' ? 'No announcements' : 
                  activeFilter === 'week' ? 'No announcements this week' : 
                  'No announcements this month'}
                </Text>
                <Text style={styles.emptyStateText}>
                  {activeFilter === 'all' ? 'Create your first announcement to get started' :
                  activeFilter === 'week' ? 'No announcements created in the past 7 days' :
                  'No announcements created in the past 30 days'}
                </Text>
              </View>
            }
          />
        </>
      )}

      <Modal
        visible={showCreateForm}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCloseCreateForm}>
              <Text style={styles.backButton}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingId ? 'Edit Announcement' : 'Create Announcement'}
            </Text>
            <View style={styles.placeholder} />
          </View>

          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            <ScrollView style={styles.modalContent}>
              <View style={styles.formSection}>
                <Text style={styles.label}>Title</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter announcement title"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.label}>Message</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Write your announcement message..."
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={6}
                />
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={[
                    styles.submitButton,
                    (!title.trim() || !message.trim()) && styles.submitButtonDisabled
                  ]}
                  onPress={editingId ? handleSaveEdit : handleAddAnnouncement}
                  disabled={!title.trim() || !message.trim()}
                >
                  <Text style={styles.submitButtonText}>
                    {editingId ? 'Save Changes' : 'Create Announcement'}
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
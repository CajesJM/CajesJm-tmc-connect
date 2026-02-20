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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from "../../../context/AuthContext";
import { db } from "../../../lib/firebaseConfig";
import { AnnouncementStyles as styles } from "../../../styles/AnnouncementStyles";

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
  const isMediumScreen = screenWidth < 768;
  
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'week' | 'month'>('all');
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
    return dayjs(date).format('MMM D, YYYY • h:mm A');
  };

  const isNewAnnouncement = (createdAt: any) => {
    if (!createdAt) return false;
    return dayjs(createdAt.toDate()).isAfter(dayjs().subtract(1, 'day'));
  };

const renderLoading = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator 
      size="large" 
      color="#4F46E5"
    />
    <Text style={styles.loadingText}>Loading announcements...</Text>
  </View>
);

  const renderAnnouncementItem = ({ item }: { item: Announcement }) => (
    <View style={[
      styles.card,
      isSmallScreen && styles.cardSmall
    ]}>
      <View style={[
        styles.cardHeader,
        isSmallScreen && styles.cardHeaderSmall
      ]}>
        <View style={styles.titleContainer}>
          {isNewAnnouncement(item.createdAt) && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
          <Text style={[
            styles.cardTitle,
            isSmallScreen && styles.cardTitleSmall
          ]}>{item.title}</Text>
        </View>
        <View style={[
          styles.cardActions,
          isSmallScreen && styles.cardActionsSmall
        ]}>
          <TouchableOpacity
            style={[
              styles.editButton,
              isSmallScreen && styles.editButtonSmall
            ]}
            onPress={() => handleEditStart(item)}
          >
            <Text style={[
              styles.editButtonText,
              isSmallScreen && styles.editButtonTextSmall
            ]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.deleteButton,
              isSmallScreen && styles.deleteButtonSmall
            ]}
            onPress={() => handleDelete(item.id, item.title)}
          >
            <Text style={[
              styles.deleteButtonText,
              isSmallScreen && styles.deleteButtonTextSmall
            ]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={[
        styles.cardMessage,
        isSmallScreen && styles.cardMessageSmall
      ]}>{item.message}</Text>
      
      {item.createdAt && (
        <View style={[
          styles.dateContainer,
          isSmallScreen && styles.dateContainerSmall
        ]}>
          <Icon name="clock-outline" size={isSmallScreen ? 10 : 12} color="#6B7280" />
          <Text style={[
            styles.timestamp,
            isSmallScreen && styles.timestampSmall
          ]}>
            {dayjs(item.createdAt.toDate()).fromNow()} • {formatDate(item.createdAt.toDate())}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[
        styles.header,
        isSmallScreen && styles.headerSmall
      ]}>
        <View style={[
          styles.headerIcon,
          isSmallScreen && styles.headerIconSmall
        ]}>
          <Icon name="bullhorn" size={isSmallScreen ? 16 : 20} color="#FFFFFF" />
        </View>
        <Text style={[
          styles.headerTitle,
          isSmallScreen && styles.headerTitleSmall
        ]}>Announcements</Text>
        <Text style={[
          styles.headerSubtitle,
          isSmallScreen && styles.headerSubtitleSmall
        ]}>
          Manage campus announcements and updates
        </Text>
      </View>

      {isLoading ? (
        renderLoading()
      ) : (
        <>
          <View style={[
            styles.statsContainer,
            isSmallScreen && styles.statsContainerSmall
          ]}>
            <View style={[
              styles.statCard,
              isSmallScreen && styles.statCardSmall
            ]}>
              <Text style={[
                styles.statNumber,
                isSmallScreen && styles.statNumberSmall
              ]}>{totalAnnouncements}</Text>
              <Text style={[
                styles.statLabel,
                isSmallScreen && styles.statLabelSmall
              ]}>Total</Text>
            </View>
            <View style={[
              styles.statCard,
              isSmallScreen && styles.statCardSmall
            ]}>
              <Text style={[
                styles.statNumber,
                isSmallScreen && styles.statNumberSmall
              ]}>{todayAnnouncements}</Text>
              <Text style={[
                styles.statLabel,
                isSmallScreen && styles.statLabelSmall
              ]}>Today</Text>
            </View>
            <View style={[
              styles.statCard,
              isSmallScreen && styles.statCardSmall
            ]}>
              <Text style={[
                styles.statNumber,
                isSmallScreen && styles.statNumberSmall
              ]}>{thisWeekAnnouncements}</Text>
              <Text style={[
                styles.statLabel,
                isSmallScreen && styles.statLabelSmall
              ]}>This Week</Text>
            </View>
          </View>

          <View style={[
            styles.filterSection,
            isSmallScreen && styles.filterSectionSmall
          ]}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.filterScrollView}
            >
              <View style={styles.filterChips}>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    activeFilter === 'all' && styles.filterChipActive,
                    isSmallScreen && styles.filterChipSmall
                  ]}
                  onPress={() => handleFilterChange('all')}
                >
                  <Text style={[
                    styles.filterChipText,
                    activeFilter === 'all' && styles.filterChipTextActive,
                    isSmallScreen && styles.filterChipTextSmall
                  ]}>All</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    activeFilter === 'week' && styles.filterChipActive,
                    isSmallScreen && styles.filterChipSmall
                  ]}
                  onPress={() => handleFilterChange('week')}
                >
                  <Text style={[
                    styles.filterChipText,
                    activeFilter === 'week' && styles.filterChipTextActive,
                    isSmallScreen && styles.filterChipTextSmall
                  ]}>This Week</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    activeFilter === 'month' && styles.filterChipActive,
                    isSmallScreen && styles.filterChipSmall
                  ]}
                  onPress={() => handleFilterChange('month')}
                >
                  <Text style={[
                    styles.filterChipText,
                    activeFilter === 'month' && styles.filterChipTextActive,
                    isSmallScreen && styles.filterChipTextSmall
                  ]}>This Month</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={[
                styles.createButton,
                isSmallScreen && styles.createButtonSmall
              ]}
              onPress={() => setShowCreateForm(true)}
            >
              <Icon name="plus" size={isSmallScreen ? 14 : 16} color="#FFFFFF" />
              {!isSmallScreen && (
                <Text style={styles.createButtonText}>Create</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={[
            styles.resultsInfo,
            isSmallScreen && styles.resultsInfoSmall
          ]}>
            <Text style={[
              styles.resultsText,
              isSmallScreen && styles.resultsTextSmall
            ]}>
              {filteredAnnouncements.length} announcement{filteredAnnouncements.length !== 1 ? 's' : ''}
              {activeFilter === 'week' ? ' this week' : activeFilter === 'month' ? ' this month' : ''}
            </Text>
          </View>

          <FlatList
            data={filteredAnnouncements}
            keyExtractor={(item) => item.id}
            renderItem={renderAnnouncementItem}
            contentContainerStyle={[
              styles.listContent,
              isSmallScreen && styles.listContentSmall
            ]}
            ListEmptyComponent={
              <View style={[
                styles.emptyState,
                isSmallScreen && styles.emptyStateSmall
              ]}>
                <Icon name="bullhorn-outline" size={isSmallScreen ? 36 : 48} color="#9CA3AF" />
                <Text style={[
                  styles.emptyStateTitle,
                  isSmallScreen && styles.emptyStateTitleSmall
                ]}>
                  {activeFilter === 'all' ? 'No announcements' : 
                  activeFilter === 'week' ? 'No announcements this week' : 
                  'No announcements this month'}
                </Text>
                <Text style={[
                  styles.emptyStateText,
                  isSmallScreen && styles.emptyStateTextSmall
                ]}>
                  {activeFilter === 'all' ? 'Create your first announcement to get started' :
                  activeFilter === 'week' ? 'No announcements created in the past 7 days' :
                  'No announcements created in the past 30 days'}
                </Text>
                {activeFilter === 'all' && (
                  <TouchableOpacity 
                    style={[
                      styles.emptyStateButton,
                      isSmallScreen && styles.emptyStateButtonSmall
                    ]}
                    onPress={() => setShowCreateForm(true)}
                  >
                    <Text style={[
                      styles.emptyStateButtonText,
                      isSmallScreen && styles.emptyStateButtonTextSmall
                    ]}>Create Announcement</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        </>
      )}

      <Modal
        visible={showCreateForm}
        animationType="slide"
        presentationStyle={isSmallScreen ? "fullScreen" : "formSheet"}
      >
        <View style={styles.modalContainer}>
          <View style={[
            styles.modalHeader,
            isSmallScreen && styles.modalHeaderSmall
          ]}>
            <TouchableOpacity onPress={handleCloseCreateForm} style={styles.backButton}>
              <Icon name="arrow-left" size={isSmallScreen ? 18 : 20} color="#4F46E5" />
              <Text style={[
                styles.backButtonText,
                isSmallScreen && styles.backButtonTextSmall
              ]}>Back</Text>
            </TouchableOpacity>
            <Text style={[
              styles.modalTitle,
              isSmallScreen && styles.modalTitleSmall
            ]}>
              {editingId ? 'Edit Announcement' : 'Create Announcement'}
            </Text>
            <View style={styles.placeholder} />
          </View>

          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            <ScrollView style={styles.modalContent} contentContainerStyle={[
              styles.modalContentContainer,
              isSmallScreen && styles.modalContentContainerSmall
            ]}>
              <View style={styles.formSection}>
                <Text style={[
                  styles.label,
                  isSmallScreen && styles.labelSmall
                ]}>Title</Text>
                <TextInput
                  style={[
                    styles.input,
                    isSmallScreen && styles.inputSmall
                  ]}
                  placeholder="Enter announcement title"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={[
                  styles.label,
                  isSmallScreen && styles.labelSmall
                ]}>Message</Text>
                <TextInput
                  style={[
                    styles.input, 
                    styles.textArea,
                    isSmallScreen && styles.inputSmall,
                    isSmallScreen && styles.textAreaSmall
                  ]}
                  placeholder="Write your announcement message..."
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={isSmallScreen ? 4 : 6}
                  textAlignVertical="top"
                />
              </View>

              <View style={[
                styles.buttonContainer,
                isSmallScreen && styles.buttonContainerSmall
              ]}>
                <TouchableOpacity 
                  style={[
                    styles.submitButton,
                    (!title.trim() || !message.trim()) && styles.submitButtonDisabled,
                    isSmallScreen && styles.submitButtonSmall
                  ]}
                  onPress={editingId ? handleSaveEdit : handleAddAnnouncement}
                  disabled={!title.trim() || !message.trim()}
                >
                  <Text style={[
                    styles.submitButtonText,
                    isSmallScreen && styles.submitButtonTextSmall
                  ]}>
                    {editingId ? 'Save Changes' : 'Create Announcement'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.cancelButton,
                    isSmallScreen && styles.cancelButtonSmall
                  ]}
                  onPress={handleCloseCreateForm}
                >
                  <Text style={[
                    styles.cancelButtonText,
                    isSmallScreen && styles.cancelButtonTextSmall
                  ]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}
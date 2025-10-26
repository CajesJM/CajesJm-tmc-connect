import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
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
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const q = query(collection(db, "updates"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Announcement[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Announcement, "id">),
      }));
      setAnnouncements(list);
    });
    return () => unsubscribe();
  }, []);

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
  };

  const handleCloseCreateForm = () => {
    setEditingId(null);
    setTitle("");
    setMessage("");
    setShowCreateForm(false);
  };

  // Stats calculation
  const totalAnnouncements = announcements.length;
  const todayAnnouncements = announcements.filter(ann => {
    if (!ann.createdAt) return false;
    return dayjs(ann.createdAt.toDate()).isSame(dayjs(), 'day');
  }).length;

  const renderAnnouncementItem = ({ item }: { item: Announcement }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
      </View>
      <Text style={styles.cardMessage} numberOfLines={3}>{item.message}</Text>
      {item.createdAt && (
        <Text style={styles.timestamp}>
          📅 {dayjs(item.createdAt.toDate()).fromNow()}
        </Text>
      )}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditStart(item)}
        >
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item.id, item.title)}
        >
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Campus Announcements</Text>
          <Text style={styles.subtitle}>Manage campus-wide announcements</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowCreateForm(true)}
        >
          <Text style={styles.addButtonText}>Add New</Text>
        </TouchableOpacity>
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalAnnouncements}</Text>
          <Text style={styles.statLabel}>Total Announcements</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{todayAnnouncements}</Text>
          <Text style={styles.statLabel}>Today's Announcements</Text>
        </View>
      </View>

      {/* Announcements List */}
      <FlatList
        data={announcements}
        keyExtractor={(item) => item.id}
        renderItem={renderAnnouncementItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No announcements yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Create your first announcement to get started!
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Full Page Create/Edit Announcement Modal */}
      <Modal
        visible={showCreateForm}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={styles.fullPageModalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleCloseCreateForm}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingId ? 'Edit Announcement' : 'Create New Announcement'}
            </Text>
            <View style={styles.placeholder} />
          </View>

          {/* Scrollable Form Content */}
          <KeyboardAvoidingView 
            style={styles.keyboardAvoidingView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView 
              style={styles.fullPageScrollView}
              contentContainerStyle={styles.fullPageFormContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formSection}>
                <Text style={styles.sectionLabel}>Announcement Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter announcement title"
                  value={title}
                  onChangeText={setTitle}
                  placeholderTextColor="#94A3B8"
                  maxLength={100}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.sectionLabel}>Announcement Message *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Write your announcement message here..."
                  value={message}
                  onChangeText={setMessage}
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  maxLength={500}
                />
              </View>

              {/* Submit Button */}
              <View style={styles.submitButtonContainer}>
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
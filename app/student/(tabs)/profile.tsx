import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth, db } from '../../../lib/firebaseConfig';
import type { Attendee, EventData, MissedEvent } from '../../../lib/types';
import { useAuth } from '../../context/AuthContext';

export default function StudentProfile() {
  const { logout, userData } = useAuth();
  const router = useRouter();
  const [missedEvents, setMissedEvents] = useState<MissedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);

  useEffect(() => {
    fetchMissedEvents();
    fetchProfileImage();
  }, []);

  const fetchMissedEvents = async () => {
    try {
      // Use type assertion to access studentID safely
      const studentID = (userData as any)?.studentID;
      if (!studentID) return;

      const eventsRef = collection(db, 'events');
      const q = query(
        eventsRef,
        where('date', '<', new Date().toISOString())
      );
      
      const querySnapshot = await getDocs(q);
      const events: MissedEvent[] = [];

      for (const doc of querySnapshot.docs) {
        const eventData = doc.data() as EventData;
        const attendees = eventData.attendees || [];
        
        // Check if student attended this event
        const attended = attendees.some((attendee: Attendee) => 
          attendee.studentID === studentID
        );

        if (!attended && eventData.title && eventData.date && eventData.location) {
          events.push({
            id: doc.id,
            title: eventData.title,
            date: eventData.date,
            location: eventData.location,
            attendanceDeadline: eventData.attendanceDeadline
          });
        }
      }

      setMissedEvents(events);
    } catch (error) {
      console.error('Error fetching missed events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileImage = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists() && userDoc.data().profilePhoto) {
          setProfileImage(userDoc.data().profilePhoto as string);
        }
      }
    } catch (error) {
      console.error('Error fetching profile image:', error);
    }
  };

  const pickImage = async (useCamera = false) => {
    try {
      setShowImageOptions(false);
      
      const permissionResult = useCamera 
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Please allow access to proceed.');
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
          });

      if (!result.canceled && result.assets && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setUploading(true);
      const user = auth.currentUser;
      
      if (!user) {
        Alert.alert('Error', 'User not found.');
        return;
      }

      // Convert image to blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload to Firebase Storage
      const storage = getStorage();
      const storageRef = ref(storage, `profile-photos/${user.uid}`);
      await uploadBytes(storageRef, blob);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Update user document in Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        profilePhoto: downloadURL
      });

      setProfileImage(downloadURL);
      Alert.alert('Success', 'Profile photo updated successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeProfileImage = async () => {
    try {
      setShowImageOptions(false);
      
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        profilePhoto: null
      });

      setProfileImage(null);
      Alert.alert('Success', 'Profile photo removed successfully!');
    } catch (error) {
      console.error('Error removing profile image:', error);
      Alert.alert('Error', 'Failed to remove profile photo.');
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const getUsername = () => {
    if (!userData?.email) return 'Student';
    return userData.email.split('@')[0];
  };

  const getDisplayName = () => {
    if (userData?.name) return userData.name;
    return getUsername();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date not available';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Date not available';
    }
  };

  // Safely access user data properties with proper typing
  // Use type assertion to access the properties that exist in your actual data
  const userCourse = (userData as any)?.course || 'Course not set';
  const userYearLevel = (userData as any)?.yearLevel || 'N/A';
  const userBlock = (userData as any)?.block || 'Block not assigned';
  const userStudentID = (userData as any)?.studentID || 'Not assigned';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>My Profile</Text>
      
      {/* Profile Card with Photo */}
      <View style={styles.profileCard}>
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={() => setShowImageOptions(true)}
          disabled={uploading}
        >
          {uploading ? (
            <View style={styles.avatar}>
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
          ) : profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getDisplayName().charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.cameraIcon}>
            <Icon name="camera" size={16} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        
        <Text style={styles.name}>{getDisplayName()}</Text>
        <Text style={styles.id}>ID: {userStudentID}</Text>
        <Text style={styles.course}>{userCourse}</Text>
        <Text style={styles.yearLevel}>Year {userYearLevel} • {userBlock}</Text>
      </View>

      {/* Missed Events Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📅 Missed Events</Text>
          <Text style={styles.eventsCount}>({missedEvents.length})</Text>
        </View>
        
        {loading ? (
          <ActivityIndicator size="small" color="#3B82F6" style={styles.loading} />
        ) : missedEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="check-circle-outline" size={48} color="#10B981" />
            <Text style={styles.emptyStateText}>Great! You haven't missed any events.</Text>
          </View>
        ) : (
          <View style={styles.eventsList}>
            {missedEvents.slice(0, 5).map((event) => (
              <View key={event.id} style={styles.eventItem}>
                <View style={styles.eventIcon}>
                  <Icon name="calendar-alert" size={20} color="#DC2626" />
                </View>
                <View style={styles.eventDetails}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventDate}>
                    {formatDate(event.date)} • {event.location}
                  </Text>
                  {event.attendanceDeadline && (
                    <Text style={styles.deadlineText}>
                      Deadline: {formatDate(event.attendanceDeadline)}
                    </Text>
                  )}
                </View>
              </View>
            ))}
            {missedEvents.length > 5 && (
              <Text style={styles.moreEventsText}>
                +{missedEvents.length - 5} more missed events
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Menu Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Quick Actions</Text>
        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuItem}>
            <Icon name="book-open-variant" size={20} color="#3B82F6" />
            <Text style={styles.menuText}>My Courses</Text>
            <Icon name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Icon name="chart-bar" size={20} color="#8B5CF6" />
            <Text style={styles.menuText}>Attendance Report</Text>
            <Icon name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Icon name="calendar-clock" size={20} color="#10B981" />
            <Text style={styles.menuText}>Event Schedule</Text>
            <Icon name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Icon name="cog" size={20} color="#6B7280" />
            <Text style={styles.menuText}>Settings</Text>
            <Icon name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Icon name="help-circle" size={20} color="#F59E0B" />
            <Text style={styles.menuText}>Help & Support</Text>
            <Icon name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="logout" size={20} color="#DC2626" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* Image Picker Modal */}
      <Modal
        visible={showImageOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageOptions(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowImageOptions(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.imageOptions}>
                <Text style={styles.optionsTitle}>Profile Photo</Text>
                
                <TouchableOpacity 
                  style={styles.optionButton}
                  onPress={() => pickImage(false)}
                >
                  <Icon name="image" size={24} color="#3B82F6" />
                  <Text style={styles.optionText}>Choose from Gallery</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.optionButton}
                  onPress={() => pickImage(true)}
                >
                  <Icon name="camera" size={24} color="#10B981" />
                  <Text style={styles.optionText}>Take Photo</Text>
                </TouchableOpacity>
                
                {profileImage && (
                  <TouchableOpacity 
                    style={[styles.optionButton, styles.removeButton]}
                    onPress={removeProfileImage}
                  >
                    <Icon name="delete" size={24} color="#DC2626" />
                    <Text style={[styles.optionText, styles.removeText]}>Remove Photo</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setShowImageOptions(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScrollView>
  );
}

// ... keep your existing styles the same ...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1E293B',
    textAlign: 'center',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3B82F6',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#111827',
  },
  id: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 4,
  },
  course: {
    fontSize: 16,
    color: '#475569',
    fontWeight: '600',
    marginBottom: 2,
  },
  yearLevel: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  eventsCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  loading: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
  },
  eventsList: {
    gap: 12,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  eventIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  deadlineText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
  },
  moreEventsText: {
    fontSize: 13,
    color: '#3B82F6',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  menu: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuText: {
    fontSize: 16,
    marginLeft: 12,
    marginRight: 'auto',
    color: '#374151',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imageOptions: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 300,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  optionText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#374151',
    fontWeight: '500',
  },
  removeButton: {
    backgroundColor: '#FEF2F2',
  },
  removeText: {
    color: '#DC2626',
  },
  cancelButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#F1F5F9',
  },
  cancelText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
});
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
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth, db } from '../../../lib/firebaseConfig';
import type { Attendee, EventData, MissedEvent } from '../../../lib/types';
import { useAuth } from '../../context/AuthContext';
import { styles } from '../../styles/studentsProfile';

interface TeamMember {
  id: string;
  name: string;
  profilePhoto?: any;
  role?: string;
  email?: string;
}

interface AboutInfo {
  submittedBy: {
    members: TeamMember[];
    organization?: string;
  };
  submittedTo: {
    name: string;
    profilePhoto?:any;
    department?: string;
    institution?: string;
  };
  version?: string;
  description?: string;
}

export default function StudentProfile() {
  const { logout, userData } = useAuth();
  const router = useRouter();
  const [missedEvents, setMissedEvents] = useState<MissedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const [aboutInfo] = useState<AboutInfo>({
    submittedBy: {
      members: [
        {
          id: '1',
          name: 'Ken Suarez',
          profilePhoto: require('../../../assets/images/Profile/ken.jpg'),
          role: 'Lead Developer',
          email: 'kensuarez31@gmail.com'
        },
        {
          id: '2',
          name: 'John Mark Cajes',
          profilePhoto: require('../../../assets/images/Profile/Jm.jpg'),
          role: '',
          email: 'markcajes24@gmail.com'
        },
        {
          id: '3',
          name: 'Kenneth Baculpo',
          profilePhoto: require('../../../assets/images/Profile/kenneth.jpg'),
          role: '',
          email: 'johnkennethbaculpo@gmail.com'
        },
        {
          id: '4',
          name: 'Kristian Jay Ayuban',
          profilePhoto: require('../../../assets/images/Profile/kian.jpg'),
          role: '',
          email: 'ayubankristianjay711@gmail.com'
        },
        {
          id: '5',
          name: 'Mc Air Jun Olmillo',
          profilePhoto: require('../../../assets/images/Profile/mcair.jpg'),
          role: '',
          email: 'airtatzolmillo@gmail.com'

        },
         {
          id: '6',
          name: 'Cherry Ann Cagoco',
          profilePhoto: require('../../../assets/images/Profile/cherry.jpg'),
          role: '',
          email: 'cherryanncagoco@gmail.com'

        },
         {
          id: '7',
          name: 'Flor Albert Asa ',
          profilePhoto: require('../../../assets/images/Profile/flor.jpg'),
          role: '',
          email: 'afloralbert@gmail.com'
        },
          {
          id: '8',
          name: 'Christian Bautista',
          profilePhoto: require('../../../assets/images/Profile/kristian.gif'),
          role: '',
          email: 'yashians120704@gmail.com'

        },
        {
          id: '8',
          name: 'Kento Mabanag',
          role: '',
          email: 'mabanagkento@gmail.com'

        },
        {
          id: '8',
          name: 'Madelo',
          role: '',
          email: 'yashians120704@gmail.com'

        },
      ],
      organization: 'TMC Connect Developers'
    },
    submittedTo: {
      name: 'Jay Ian Camelotes',
      profilePhoto: '',
      department: 'Bachelor of Information Technology',
      institution: ''
    },
    version: '1.0.1',
    description: 'TMC Connect - A comprehensive solution for managing campus events, attendance tracking, and student engagement.'
  });

  useEffect(() => {
    fetchMissedEvents();
    fetchProfileImage();
  }, []);

  const fetchMissedEvents = async () => {
    try {
     
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


  const userCourse = (userData as any)?.course || 'Course not set';
  const userYearLevel = (userData as any)?.yearLevel || 'N/A';
  const userBlock = (userData as any)?.block || 'Block not assigned';
  const userStudentID = (userData as any)?.studentID || 'Not assigned';

  const renderAboutModal = () => (
    <Modal
      visible={showAboutModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowAboutModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.aboutModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>About This App</Text>
            <TouchableOpacity onPress={() => setShowAboutModal(false)}>
              <Icon name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.aboutContent} showsVerticalScrollIndicator={false}>
        
            {aboutInfo.description && (
              <View style={styles.aboutSection}>
                <Text style={styles.aboutDescription}>
                  {aboutInfo.description}
                </Text>
              </View>
            )}

    
            <View style={styles.aboutSection}>
           
              {aboutInfo.submittedBy.organization && (
                <Text style={styles.organizationName}>
                  {aboutInfo.submittedBy.organization}
                </Text>
              )}

              <View style={styles.membersList}>
                {aboutInfo.submittedBy.members.map((member) => (
                  <View key={member.id} style={styles.memberItem}>
               
                    {member.profilePhoto ? (
                      <Image
                        source={member.profilePhoto}
                        style={styles.memberAvatarImage}
                      />
                    ) : (
                      <View style={styles.memberAvatar}>
                        <Text style={styles.memberAvatarText}>
                          {member.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      {member.role && (
                        <Text style={styles.memberRole}>{member.role}</Text>
                      )}
                      {member.email && (
                        <Text style={styles.memberEmail}>{member.email}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>

         
            <View style={styles.aboutSection}>
              <Text style={styles.sectionLabel}>Submitted To</Text>
              <View style={styles.submittedToCard}>
                <Icon name="school" size={24} color="#3B82F6" />
                <View style={styles.submittedToInfo}>
                  <Text style={styles.submittedToName}>
                    {aboutInfo.submittedTo.name}
                  </Text>
                  {aboutInfo.submittedTo.department && (
                    <Text style={styles.submittedToDepartment}>
                      {aboutInfo.submittedTo.department}
                    </Text>
                  )}
                  {aboutInfo.submittedTo.institution && (
                    <Text style={styles.submittedToInstitution}>
                      {aboutInfo.submittedTo.institution}
                    </Text>
                  )}
                </View>
              </View>
            </View>

      
            {aboutInfo.version && (
              <View style={styles.versionSection}>
                <Text style={styles.versionText}>
                  Version {aboutInfo.version}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      

     
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

 
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Missed Events</Text>
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


      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
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

         

       
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowAboutModal(true)}
          >
            <Icon name="information" size={20} color="#F59E0B" />
            <Text style={styles.menuText}>About this App</Text>
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

      {/* About Modal */}
      {renderAboutModal()}
    </ScrollView>
  );
}


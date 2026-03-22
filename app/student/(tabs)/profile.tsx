import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View, useWindowDimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../../context/AuthContext';
import { useNotifications } from '../../../context/NotificationContext';
//import { usePushNotifications } from '../../../hooks/usePushNotifications';
import { useTheme } from '../../../context/ThemeContext';
import { auth, db } from '../../../lib/firebaseConfig';
import type { AttendanceRecord, MissedEvent } from '../../../lib/types';
import { createProfileStyles } from '../../../styles/student/profileStyles';

interface Penalty {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate?: string;
  studentId: string;
  studentName: string;
  status: 'pending' | 'paid' | 'completed';
  severity?: 'low' | 'medium' | 'high';
  consequences?: string;
  deadline?: string;
  createdAt: string | any;
}

interface StudentEvent extends MissedEvent {
  scannedAt?: string;
}


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
    profilePhoto?: any;
    department?: string;
    institution?: string;
  };
  version?: string;
  description?: string;
}

export default function StudentProfile() {
  const { logout, userData } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;
  const isDesktop = width >= 1024;
  const [missedEvents, setMissedEvents] = useState<MissedEvent[]>([]);
  const [attendedEvents, setAttendedEvents] = useState<MissedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'missed' | 'attended'>('attended');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [penalties, setPenalties] = useState<any[]>([]);
  const [showPenaltiesModal, setShowPenaltiesModal] = useState(false);
  const [penaltyLoading, setPenaltyLoading] = useState(false);
  const [penaltyMap, setPenaltyMap] = useState<Record<string, { status: string; id: string }>>({});
  const { incrementUnread, clearUnread } = useNotifications();
  const isFocused = useRef(true);
  const initialLoadDone = useRef(false);
  const lastPenaltyTimestamp = useRef<string | null>(null);
  //const { expoPushToken } = usePushNotifications();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const { theme, setTheme, colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(
    () => createProfileStyles(colors, isDark, isMobile, isTablet, isDesktop),
    [colors, isDark, isMobile, isTablet, isDesktop]
  );


  const [aboutInfo] = useState<AboutInfo>({
    submittedBy: {
      members: [
        {
          id: '1',
          name: 'John Mark Cajes',
          profilePhoto: require('../../../assets/images/Profile/Jm.jpg'),
          role: 'Lead Developer',
          email: 'markcajes@gmail.com'
        },
        {
          id: '2',
          name: 'Ken Suarez',
          profilePhoto: require('../../../assets/images/Profile/ken.jpg'),
          role: 'Lead Developer',
          email: 'kensuarez31@gmail.com'
        },
        {
          id: '3',
          name: 'Denmerk Apa',
          profilePhoto: require('../../../assets/images/Profile/denmerk.jpg'),
          role: 'QA Tester',
          email: 'denmerk@gmail.com'
        },
        {
          id: '4',
          name: 'Sherylann Inanod',
          profilePhoto: require('../../../assets/images/Profile/Jm.jpg'),
          role: 'UI/UX Designer',
          email: 'inanodsherylann@gmail.com'
        },
        {
          id: '5',
          name: 'Karl James Ayuban',
          profilePhoto: require('../../../assets/images/Profile/jim.jpg'),
          role: '',
          email: 'ayubankarljames@gmail.com'

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


  const fetchEvents = async () => {
    try {
      setLoading(true);
      const studentID = (userData as any)?.studentID;

      console.log('Student ID:', studentID);

      if (!studentID) {
        console.log('No student ID found');
        setLoading(false);
        return;
      }

      const eventsRef = collection(db, 'events');
      const querySnapshot = await getDocs(eventsRef);

      console.log('Total events found:', querySnapshot.docs.length);

      const missed: StudentEvent[] = [];
      const attended: StudentEvent[] = [];

      for (const docSnapshot of querySnapshot.docs) {
        const eventData = docSnapshot.data();

        const hasStatus = 'status' in eventData;
        const isApproved = hasStatus && eventData.status === 'approved';
        const isAdminEvent = !hasStatus;

        if (!isApproved && !isAdminEvent) {
          console.log('Skipping event (not approved and not admin):', eventData.title);
          continue;
        }

        console.log('Event:', eventData.title, 'Date:', eventData.date);

        const eventDate = typeof eventData.date === 'object' && (eventData.date as any)?.toDate
          ? (eventData.date as any).toDate()
          : new Date((eventData.date as string) || '');

        const now = new Date();

        if (eventDate > now) {
          console.log('Event is in future, skipping:', eventData.title);
          continue;
        }

        const attendees = eventData.attendees || [];

        console.log('Attendees:', attendees.length);

        if (!eventData.title || !eventData.location) {
          console.log('Missing required fields, skipping');
          continue;
        }

        const studentAttendance = attendees.find((attendee: AttendanceRecord) =>
          attendee.studentID === studentID.toString()
        );

        console.log('Student attendance found:', !!studentAttendance);

        const eventInfo: StudentEvent = {
          id: docSnapshot.id,
          title: eventData.title,
          date: eventDate.toISOString(),
          location: eventData.location,
          attendanceDeadline: eventData.attendanceDeadline,
          scannedAt: studentAttendance?.scannedAt || studentAttendance?.timestamp
        };

        if (studentAttendance) {
          attended.push(eventInfo);
          console.log('Added to attended:', eventData.title);
        } else {
          missed.push(eventInfo);
          console.log('Added to missed:', eventData.title);
        }
      }

      console.log('Final counts - Attended:', attended.length, 'Missed:', missed.length);

      missed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      attended.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setMissedEvents(missed);
      setAttendedEvents(attended);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const penaltiesQuery = query(
      collection(db, 'penalties'),
      where('studentId', '==', userId)
    );

    const unsubscribe = onSnapshot(
      penaltiesQuery,
      (snapshot) => {
        const allPenalties: any[] = [];
        const map: Record<string, { status: string; id: string }> = {};
        snapshot.forEach(doc => {
          const data = doc.data();
          allPenalties.push({ id: doc.id, ...data });
          if (data.eventId) {
            map[data.eventId] = { status: data.status, id: doc.id };
          }
        });
        allPenalties.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));

        const pendingPenalties = allPenalties.filter(p => p.status === 'pending');
        if (pendingPenalties.length > 0) {
          const newest = pendingPenalties.reduce((a, b) =>
            (a.createdAt?.toMillis?.() || 0) > (b.createdAt?.toMillis?.() || 0) ? a : b
          );
          if (newest && newest.createdAt) {
            const newestMillis = newest.createdAt.toMillis?.() || newest.createdAt.getTime();
            const lastMillis = lastPenaltyTimestamp.current ? parseInt(lastPenaltyTimestamp.current) : 0;
            if (newestMillis > lastMillis && initialLoadDone.current && !isFocused.current) {
              incrementUnread('profile');
            }
            lastPenaltyTimestamp.current = newestMillis.toString();
          }
        }

        if (!initialLoadDone.current) {
          initialLoadDone.current = true;
        }

        setPenalties(allPenalties);
        setPenaltyMap(map);
        setPenaltyLoading(false);
      },
      (error) => {
        console.error('Error in penalties listener:', error);
        setPenaltyLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useFocusEffect(
    useCallback(() => {
      isFocused.current = true;
      clearUnread('profile');

      return () => {
        isFocused.current = false;
      };
    }, [clearUnread])
  );
  useEffect(() => {
    fetchEvents();
    fetchProfileImage();

  }, []);


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

      const response = await fetch(uri);
      const blob = await response.blob();

      const storage = getStorage();
      const storageRef = ref(storage, `profile-photos/${user.uid}`);
      await uploadBytes(storageRef, blob);

      const downloadURL = await getDownloadURL(storageRef);

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

  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'Date not available';

    try {
      let date: Date;
      if (typeof dateValue === 'object' && dateValue.toDate) {
        date = dateValue.toDate();
      } else if (typeof dateValue === 'object' && dateValue.seconds) {
        date = new Date(dateValue.seconds * 1000);
      } else if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      } else {
        return 'Date not available';
      }

      if (isNaN(date.getTime())) return 'Date not available';

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Date not available';
    }
  };
  const getPenaltyDate = (penalty: { eventDate?: any; createdAt?: any }) => {
    if (penalty.eventDate) {
      return formatDate(penalty.eventDate);
    }
    if (penalty.createdAt) {
      return formatDate(penalty.createdAt);
    }
    return 'Date not available';
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

  const renderPenaltiesModal = () => {
  const pendingCount = penalties.filter(p => p.status === 'pending').length;
  const paidCount = penalties.filter(p => p.status === 'paid').length;

  const severityColors = {
    low: '#10b981',  
    medium: '#f59e0b', 
    high: '#ef4444',  
  };

  return (
    <Modal
      visible={showPenaltiesModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowPenaltiesModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.aboutModal, { maxHeight: '90%' }]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>My Penalties</Text>
              <Text style={styles.modalSubtitle}>
                {pendingCount > 0
                  ? `${pendingCount} pending`
                  : paidCount > 0
                  ? 'All penalties paid'
                  : 'No penalties'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowPenaltiesModal(false)}>
              <Icon name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {penaltyLoading ? (
            <ActivityIndicator size="large" color="#3B82F6" style={{ padding: 40 }} />
          ) : penalties.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="check-circle-outline" size={64} color="#10B981" />
              <Text style={styles.emptyStateTitle}>No Penalties!</Text>
              <Text style={styles.emptyStateText}>
                Great job! You have no pending penalties.
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {penalties
                .filter(p => p.status === 'pending')
                .map((penalty) => {
                  const eventTitle = penalty.eventTitle || penalty.eventName || 'Unknown Event';
                  const penaltyDate = getPenaltyDate(penalty);
                  const severity = penalty.severity || 'medium';
                  const severityColor = severityColors[severity as keyof typeof severityColors] || '#f59e0b';

                  return (
                    <View
                      key={penalty.id}
                      style={[
                        styles.penaltyCard,
                        { borderLeftColor: severityColor, borderLeftWidth: 4 },
                        { backgroundColor: colors.card }, 
                      ]}
                    >
                      <View style={styles.penaltyHeader}>
                        <Text style={[styles.penaltyEventTitle, { color: colors.text }]}>
                          {eventTitle}
                        </Text>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: severityColor + '20' }
                        ]}>
                          <Text style={[styles.statusText, { color: severityColor }]}>
                            {severity.toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      <Text style={{ fontSize: 12, color: colors.sidebar.text.secondary, marginTop: 4 }}>
                        Missed on: {penaltyDate}
                      </Text>

                      {/* Show admin consequences if available */}
                      {penalty.consequences && (
                        <View style={{
                          marginTop: 8,
                          backgroundColor: colors.border,
                          padding: 10,
                          borderRadius: 8,
                        }}>
                          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 4 }}>
                            Requirements:
                          </Text>
                          <Text style={{ fontSize: 12, color: colors.sidebar.text.secondary, lineHeight: 18 }}>
                            {penalty.consequences}
                          </Text>
                        </View>
                      )}

                      {/* Show deadline if available */}
                      {penalty.deadline && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 }}>
                          <Icon name="clock-outline" size={14} color={severityColor} />
                          <Text style={{ fontSize: 12, color: severityColor, fontWeight: '500' }}>
                            Deadline: {formatDate(penalty.deadline)}
                          </Text>
                        </View>
                      )}

                      {/* If no consequences provided, show generic message */}
                      {!penalty.consequences && (
                        <View style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginTop: 8,
                          gap: 6,
                          backgroundColor: severityColor + '15',
                          padding: 8,
                          borderRadius: 6,
                        }}>
                          <Icon name="clock-alert" size={16} color={severityColor} />
                          <Text style={{ fontSize: 13, color: severityColor, fontWeight: '500' }}>
                            Please contact admin to settle this penalty
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};
  const renderSettingsModal = () => (
    <Modal
      visible={showSettingsModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowSettingsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.aboutModal, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Settings</Text>
            <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.settingsSection}>
            <Text style={[styles.settingsSectionTitle, { color: colors.text }]}>Theme</Text>

            <TouchableOpacity
              style={styles.settingsOption}
              onPress={() => setTheme('light')}
            >
              <View style={styles.settingsOptionLeft}>
                <Icon name="weather-sunny" size={24} color={colors.accent.primary} />
                <Text style={[styles.settingsOptionText, { color: colors.text }]}>Light</Text>
              </View>
              {theme === 'light' && (
                <Icon name="check-circle" size={20} color={colors.accent.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsOption}
              onPress={() => setTheme('dark')}
            >
              <View style={styles.settingsOptionLeft}>
                <Icon name="weather-night" size={24} color={colors.accent.primary} />
                <Text style={[styles.settingsOptionText, { color: colors.text }]}>Dark</Text>
              </View>
              {theme === 'dark' && (
                <Icon name="check-circle" size={20} color={colors.accent.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsOption}
              onPress={() => setTheme('system')}
            >
              <View style={styles.settingsOptionLeft}>
                <Icon name="cellphone" size={24} color={colors.accent.primary} />
                <Text style={[styles.settingsOptionText, { color: colors.text }]}>System</Text>
              </View>
              {theme === 'system' && (
                <Icon name="check-circle" size={20} color={colors.accent.primary} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>



      <View style={styles.profileCard}>
        {/* Penalty Badge - Shows if has penalties */}
        {penalties.filter(p => p.status === 'pending').length > 0 && (
          <TouchableOpacity
            style={styles.penaltyBadge}
            onPress={() => setShowPenaltiesModal(true)}
          >
            <Icon name="alert-circle" size={16} color="#FFFFFF" />
            
          </TouchableOpacity>
        )}

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
        <Text style={styles.yearLevel}> {userYearLevel} • Block {userBlock}</Text>
      </View>

      <View style={styles.section}>
        {/* Tab Headers */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'attended' && styles.activeTab]}
            onPress={() => setActiveTab('attended')}
          >
            <Icon
              name="check-circle"
              size={18}
              color={activeTab === 'attended' ? '#10B981' : '#6B7280'}
            />
            <Text style={[styles.tabText, activeTab === 'attended' && styles.activeTabText]}>
              Attended
            </Text>
            <View style={[styles.badge, { backgroundColor: '#10B98120' }]}>
              <Text style={[styles.badgeText, { color: '#10B981' }]}>{attendedEvents.length}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'missed' && styles.activeTab]}
            onPress={() => setActiveTab('missed')}
          >
            <Icon
              name="calendar-remove"
              size={18}
              color={activeTab === 'missed' ? '#DC2626' : '#6B7280'}
            />
            <Text style={[styles.tabText, activeTab === 'missed' && styles.activeTabText]}>
              Missed
            </Text>
            <View style={[styles.badge, { backgroundColor: '#DC262620' }]}>
              <Text style={[styles.badgeText, { color: '#DC2626' }]}>{missedEvents.length}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color="#3B82F6" style={styles.loading} />
        ) : activeTab === 'attended' ? (

          attendedEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="calendar-clock" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No attended events yet.</Text>
              <Text style={styles.emptyStateSubtext}>Start attending events to see them here!</Text>
            </View>
          ) : (
            <View style={styles.eventsList}>
              {attendedEvents.slice(0, 5).map((event) => (
                <View key={event.id} style={[styles.eventItem, styles.attendedEventItem]}>
                  <View style={[styles.eventIcon, { backgroundColor: '#10B98115' }]}>
                    <Icon name="check" size={20} color="#10B981" />
                  </View>
                  <View style={styles.eventDetails}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventDate}>
                      {formatDate(event.date)} • {event.location}
                    </Text>
                    {event.scannedAt && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <Icon name="clock-check" size={12} color="#10B981" />
                        <Text style={[styles.scannedAtText, { marginLeft: 4 }]}>
                          Scanned at {new Date(event.scannedAt).toLocaleTimeString()}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
              {attendedEvents.length > 5 && (
                <Text style={styles.moreEventsText}>
                  +{attendedEvents.length - 5} more attended events
                </Text>
              )}
            </View>
          )
        ) : (
          // Missed Events List
          missedEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="check-circle-outline" size={48} color="#10B981" />
              <Text style={styles.emptyStateText}>Great! You haven't missed any events.</Text>
            </View>
          ) : (
            <View style={styles.eventsList}>
              {missedEvents.slice(0, 5).map((event) => {
                const penalty = penaltyMap[event.id];
                console.log(`🔍 Event ID: ${event.id}, Penalty:`, penalty);
                const isPending = penalty?.status === 'pending';
                const isCompleted = penalty?.status === 'paid' || penalty?.status === 'completed';

                return (
                  <View key={event.id} style={styles.eventItem}>
                    <View style={styles.eventIcon}>
                      <Icon name="calendar-alert" size={20} color="#DC2626" />
                    </View>
                    <View style={styles.eventDetails}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.eventTitle}>{event.title}</Text>
                        {penalty && (
                          <View style={[
                            styles.penaltyStatusBadge,
                            { backgroundColor: isPending ? '#f59e0b20' : '#10b98120' }
                          ]}>
                            <Text style={[
                              styles.penaltyStatusText,
                              { color: isPending ? '#f59e0b' : '#10b981' }
                            ]}>
                              {isPending ? 'PENDING' : 'COMPLETED'}
                            </Text>
                          </View>
                        )}
                      </View>
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
                );
              })}
              {missedEvents.length > 5 && (
                <Text style={styles.moreEventsText}>
                  +{missedEvents.length - 5} more missed events
                </Text>
              )}
            </View>
          )
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
            onPress={() => setShowPenaltiesModal(true)}
          >
            <View style={styles.menuIconContainer}>
              <Icon name="alert-outline" size={20} color="#EF4444" />
              {penalties.filter(p => p.status === 'pending').length > 0 && (
                <View style={styles.menuBadge}>
                  <Text style={styles.menuBadgeText}>
                    {penalties.filter(p => p.status === 'pending').length}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.menuText}>My Penalties</Text>
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

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowSettingsModal(true)}
          >
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
      {renderPenaltiesModal()}
      {renderAboutModal()}
      {renderSettingsModal()}

    </ScrollView>
  );
}


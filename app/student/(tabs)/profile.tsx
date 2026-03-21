import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import React, { useCallback, useEffect, useState } from 'react';
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
import { useAuth } from '../../../context/AuthContext';
//import { usePushNotifications } from '../../../hooks/usePushNotifications';
import { auth, db } from '../../../lib/firebaseConfig';
import type { AttendanceRecord, MissedEvent } from '../../../lib/types';
import { profileStyles as styles } from '../../../styles/student/profileStyles';



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
  //const { expoPushToken } = usePushNotifications();

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

      // Fetch ALL events (no status filter)
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

        // Convert date from Firestore Timestamp or string
        const eventDate = typeof eventData.date === 'object' && (eventData.date as any)?.toDate
          ? (eventData.date as any).toDate()
          : new Date((eventData.date as string) || '');

        const now = new Date();

        // Only consider past events
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

  const fetchPenalties = useCallback(async () => {
    if (!auth.currentUser?.uid) return;
    try {
      setPenaltyLoading(true);
      const q = query(
        collection(db, 'penalties'),
        where('studentId', '==', auth.currentUser.uid),
        where('status', 'in', ['pending', 'completed'])
      );
      const snapshot = await getDocs(q);
      console.log('📝 Penalties snapshot size:', snapshot.size);

      // Build map for badges (includes both pending and completed)
      const map: Record<string, { status: string; id: string }> = {};
      const pendingPenalties: any[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        console.log('📝 Penalty doc:', doc.id, data);
        if (data.eventId) {
          console.log('✅ Mapping eventId:', data.eventId, '→ status:', data.status);
          map[data.eventId] = { status: data.status, id: doc.id };
        } else {
          console.warn('⚠️ Penalty doc missing eventId:', doc.id);
        }

        if (data.status === 'pending') {
          pendingPenalties.push({ id: doc.id, ...data });
        }
      });

      console.log('🗺️ Final penaltyMap:', map);
      setPenaltyMap(map);
      setPenalties(pendingPenalties); 
    } catch (error) {
      console.error(error);
    } finally {
      setPenaltyLoading(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      fetchPenalties();
    }, [fetchPenalties])
  );

  useEffect(() => {
    fetchEvents();
    fetchProfileImage();
    fetchPenalties();
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

  const renderPenaltiesModal = () => {
    const pendingCount = penalties.filter(p => p.status === 'pending').length;
    const paidCount = penalties.filter(p => p.status === 'paid').length;

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'paid': return '#10b981';
        case 'pending': return '#f59e0b';
        default: return '#6b7280';
      }
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
                {penalties.map((penalty) => {
                  const isPaid = penalty.status === 'paid';
                  // Use fallback for missing eventTitle
                  const eventTitle = penalty.eventTitle || penalty.eventName || 'Unknown Event';
                  // Use createdAt if paidAt not available
                  const date = penalty.paidAt ? new Date(penalty.paidAt) : new Date(penalty.createdAt);

                  return (
                    <View
                      key={penalty.id}
                      style={[
                        styles.penaltyCard,
                        isPaid && { borderLeftColor: '#10b981', borderLeftWidth: 4 }
                      ]}
                    >
                      <View style={styles.penaltyHeader}>
                        <Text style={styles.penaltyEventTitle}>
                          {penalty.eventTitle || penalty.eventName || 'Unknown Event'}
                        </Text>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(penalty.status) + '20' }
                        ]}>
                          <Text style={[
                            styles.statusText,
                            { color: getStatusColor(penalty.status) }
                          ]}>
                            {isPaid ? 'PAID' : 'PENDING'}
                          </Text>
                        </View>
                      </View>

                      {/* Show event date if available */}
                      {penalty.eventDate && (
                        <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                          Event: {new Date(penalty.eventDate).toLocaleDateString()}
                        </Text>
                      )}

                      {isPaid && penalty.paidAt && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 }}>
                          <Icon name="check-circle" size={16} color="#10b981" />
                          <Text style={{ fontSize: 13, color: '#10b981', fontWeight: '500' }}>
                            Paid on {new Date(penalty.paidAt).toLocaleDateString()} at{' '}
                            {new Date(penalty.paidAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Text>
                        </View>
                      )}

                      {!isPaid && (
                        <View style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginTop: 8,
                          gap: 6,
                          backgroundColor: '#f59e0b15',
                          padding: 8,
                          borderRadius: 6,
                        }}>
                          <Icon name="clock-alert" size={16} color="#f59e0b" />
                          <Text style={{ fontSize: 13, color: '#f59e0b', fontWeight: '500' }}>
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
            <Text style={styles.penaltyBadgeText}>
              {penalties.filter(p => p.status === 'pending').length} Pending Penalty{penalties.filter(p => p.status === 'pending').length > 1 ? 'ies' : 'y'}
            </Text>
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
      {/* Penalties Modal */}
      {renderPenaltiesModal()}
      {/* About Modal */}
      {renderAboutModal()}

    </ScrollView>
  );
}


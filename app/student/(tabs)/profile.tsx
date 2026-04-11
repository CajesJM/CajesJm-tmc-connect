import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions
} from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../../context/AuthContext';
import { useNotifications } from '../../../context/NotificationContext';
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

// Monthly attendance data interface
interface MonthlyAttendanceData {
  month: string;
  attended: number;
  missed: number;
  total: number;
}

// Separate component for animated bar chart to fix hook rules
const BarChartSection = ({ monthlyAttendanceData, maxValue, colors, isDark, chartAnim }: any) => {
  return (
    <Animated.View style={[
      {
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 20,
        opacity: chartAnim,
        transform: [{ translateY: chartAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
      }
    ]}>
      <Text style={[{ color: colors.text, fontSize: 18, fontWeight: '600', marginBottom: 4, textAlign: 'center' }]}>
        Monthly Attendance Trends
      </Text>
      <Text style={[{ color: colors.sidebar.text.secondary, fontSize: 12, textAlign: 'center', marginBottom: 16 }]}>
        Events Attended vs Missed
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 10 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 200, marginVertical: 10 }}>
          {monthlyAttendanceData.map((data: any, index: number) => (
            <BarChartItem
              key={index}
              data={data}
              index={index}
              maxValue={maxValue}
              colors={colors}
              isDark={isDark}
            />
          ))}
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#10B981' }} />
          <Text style={{ color: colors.text, fontSize: 12, fontWeight: '500' }}>Attended</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#EF4444' }} />
          <Text style={{ color: colors.text, fontSize: 12, fontWeight: '500' }}>Missed</Text>
        </View>
      </View>
    </Animated.View>
  );
};

// Individual bar chart item with its own animation
const BarChartItem = ({ data, index, maxValue, colors, isDark }: any) => {
  const maxHeight = 140;
  const attendedHeight = (data.attended / maxValue) * maxHeight;
  const missedHeight = (data.missed / maxValue) * maxHeight;
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: 1,
      duration: 800,
      delay: index * 100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={{ alignItems: 'center', width: 70, marginHorizontal: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: maxHeight, marginBottom: 8 }}>
        {/* Attended Bar with Animation */}
        <Animated.View style={{
          width: 28,
          backgroundColor: '#10B981',
          borderRadius: 6,
          height: Math.max(attendedHeight, 4),
          opacity: barAnim,
          transform: [{ scaleY: barAnim }],
        }}>
          {data.attended > 0 && (
            <Text style={{
              position: 'absolute',
              top: -18,
              left: 0,
              right: 0,
              textAlign: 'center',
              fontSize: 11,
              fontWeight: 'bold',
              color: '#10B981',
            }}>
              {data.attended}
            </Text>
          )}
        </Animated.View>

        {/* Missed Bar with Animation */}
        <Animated.View style={{
          width: 28,
          backgroundColor: '#EF4444',
          borderRadius: 6,
          height: Math.max(missedHeight, 4),
          opacity: barAnim,
          transform: [{ scaleY: barAnim }],
        }}>
          {data.missed > 0 && (
            <Text style={{
              position: 'absolute',
              top: -18,
              left: 0,
              right: 0,
              textAlign: 'center',
              fontSize: 11,
              fontWeight: 'bold',
              color: '#EF4444',
            }}>
              {data.missed}
            </Text>
          )}
        </Animated.View>
      </View>

      <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>
        {data.month}
      </Text>
      {data.total > 0 && (
        <View style={{
          marginTop: 4,
          backgroundColor: isDark ? '#334155' : '#e2e8f0',
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 10,
        }}>
          <Text style={{ fontSize: 9, color: colors.sidebar.text.secondary }}>
            {data.total}
          </Text>
        </View>
      )}
    </View>
  );
};

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
  const { clearUnread } = useNotifications();
  const isFocused = useRef(true);
  const initialLoadDone = useRef(false);
  const lastPenaltyTimestamp = useRef<string | null>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const { theme, setTheme, colors, isDark, toggleTheme } = useTheme();

  // New state for charts
  const [showAttendanceReportModal, setShowAttendanceReportModal] = useState(false);
  const [monthlyAttendanceData, setMonthlyAttendanceData] = useState<MonthlyAttendanceData[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [attendedCount, setAttendedCount] = useState(0);
  const [missedCount, setMissedCount] = useState(0);

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
      name: 'Cristine Joy Yap',
      profilePhoto: '',
      department: 'Bachelor of Science Information Technology',
      institution: ''
    },
    version: '1.0.1',
    description: 'TMC Connect - A comprehensive solution for managing campus events, attendance tracking, and student engagement.'
  });

  const renderHelpModal = () => {
    const faqs = [
      {
        id: '1',
        question: 'How do I scan my attendance?',
        answer: 'Go to the Events section, find the current event, and tap the "Scan QR Code" button. Point your camera at the QR code displayed at the event venue to mark your attendance.',
        icon: 'qrcode-scan'
      },
      {
        id: '2',
        question: 'What happens if I miss an event?',
        answer: 'When you miss an event, it will appear in your "Missed" tab. The admin may issue penalties for unexcused absences. You can view your penalties in the "My Penalties" section.',
        icon: 'calendar-remove'
      },
      {
        id: '3',
        question: 'How do I view my attendance history?',
        answer: 'Go to your Profile and check the "Attended" tab to see all events you\'ve successfully attended. You can also generate an Attendance Report for detailed monthly statistics.',
        icon: 'chart-line'
      },
      {
        id: '4',
        question: 'Can I change my profile picture?',
        answer: 'Yes! Tap on your profile picture in the Profile section, then choose to either take a new photo or select one from your gallery.',
        icon: 'camera'
      },
      {
        id: '5',
        question: 'How do I receive notifications?',
        answer: 'Make sure you have notifications enabled in your device settings. You\'ll receive alerts for new events, announcements, attendance reminders, and penalty updates.',
        icon: 'bell'
      },
      {
        id: '6',
        question: 'What are the penalties for missed events?',
        answer: 'Penalties vary depending on the event importance and frequency of absences. Check your "My Penalties" section for specific details about any pending penalties.',
        icon: 'alert-circle'
      },
      {
        id: '7',
        question: 'How do I update my course information?',
        answer: 'Course information can only be updated by administrators. Contact your department or admin if you need to make changes to your course details.',
        icon: 'school'
      },
      {
        id: '8',
        question: 'Is my data secure?',
        answer: 'Yes, we take data security seriously. All your personal information and attendance records are securely stored and only accessible to authorized personnel.',
        icon: 'shield-account'
      }
    ];

    const supportChannels = [
      {
        id: '1',
        title: 'Email Support',
        description: 'Get help via email',
        contact: 'support@tmcconnect.com',
        icon: 'email',
        color: '#3B82F6'
      },
      {
        id: '2',
        title: 'Live Chat',
        description: 'Chat with our support team',
        contact: 'Available 9 AM - 5 PM',
        icon: 'chat',
        color: '#10B981'
      },
      {
        id: '3',
        title: 'Help Center',
        description: 'Browse our knowledge base',
        contact: 'Documentation & Guides',
        icon: 'help-circle',
        color: '#F59E0B'
      },
      {
        id: '4',
        title: 'Report an Issue',
        description: 'Submit a bug report',
        contact: 'We\'ll respond within 24h',
        icon: 'bug',
        color: '#EF4444'
      }
    ];

    return (
      <Modal
        visible={showHelpModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowHelpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.aboutModal, { maxHeight: '90%', padding: 0 }]}>
            <View style={[styles.modalHeader, { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }]}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Help & Support</Text>
                <Text style={[styles.modalSubtitle, { color: colors.sidebar.text.secondary }]}>
                  How can we help you today?
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowHelpModal(false)}>
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ paddingHorizontal: 20, paddingBottom: 20 }}
            >
              {/* Quick Search/Support Banner */}
              <View style={[styles.supportBanner, {
                backgroundColor: isDark ? '#1e293b' : '#f0f9ff',
                borderRadius: 16,
                padding: 20,
                marginBottom: 24,
                marginTop: 8,
                alignItems: 'center'
              }]}>
                <Icon name="headset" size={48} color={colors.accent.primary} />
                <Text style={[styles.supportBannerTitle, { color: colors.text, fontSize: 18, fontWeight: 'bold', marginTop: 12 }]}>
                  Need Immediate Help?
                </Text>
                <Text style={[styles.supportBannerText, { color: colors.sidebar.text.secondary, textAlign: 'center', marginTop: 8 }]}>
                  Our support team is ready to assist you with any questions or concerns.
                </Text>
                <TouchableOpacity
                  style={[styles.contactSupportButton, {
                    backgroundColor: colors.accent.primary,
                    marginTop: 16,
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 25,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8
                  }]}
                  onPress={() => {
                    Alert.alert(
                      'Contact Support',
                      'Choose your preferred contact method:',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Email', onPress: () => Alert.alert('Email Support', 'Send an email to support@tmcconnect.com') },
                        { text: 'Chat', onPress: () => Alert.alert('Live Chat', 'Our live chat support is currently offline. Please try again during business hours.') }
                      ]
                    );
                  }}
                >
                  <Icon name="headset" size={20} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Contact Support</Text>
                </TouchableOpacity>
              </View>

              {/* Support Channels */}
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 18, fontWeight: '600', marginBottom: 12 }]}>
                Support Channels
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 }}>
                {supportChannels.map((channel) => (
                  <TouchableOpacity
                    key={channel.id}
                    style={[styles.supportCard, {
                      width: '48%',
                      backgroundColor: colors.card,
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: colors.border
                    }]}
                    onPress={() => {
                      Alert.alert(
                        channel.title,
                        channel.contact,
                        [
                          { text: 'OK' },
                          ...(channel.id === '1' ? [{ text: 'Send Email', onPress: () => Alert.alert('Email', `Opening email app to ${channel.contact}`) }] : [])
                        ]
                      );
                    }}
                  >
                    <View style={[styles.supportIconContainer, {
                      backgroundColor: `${channel.color}20`,
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: 12
                    }]}>
                      <Icon name={channel.icon} size={24} color={channel.color} />
                    </View>
                    <Text style={[styles.supportTitle, { color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 4 }]}>
                      {channel.title}
                    </Text>
                    <Text style={[styles.supportDescription, { color: colors.sidebar.text.secondary, fontSize: 12 }]}>
                      {channel.contact}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* FAQ Section */}
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 18, fontWeight: '600', marginBottom: 12 }]}>
                Frequently Asked Questions
              </Text>
              <View style={{ marginBottom: 24 }}>
                {faqs.map((faq, index) => {
                  const [expanded, setExpanded] = useState(false);
                  return (
                    <View
                      key={faq.id}
                      style={[styles.faqItem, {
                        backgroundColor: colors.card,
                        borderRadius: 12,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: colors.border,
                        overflow: 'hidden'
                      }]}
                    >
                      <TouchableOpacity
                        style={[styles.faqQuestion, {
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: 16
                        }]}
                        onPress={() => setExpanded(!expanded)}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
                          <View style={[styles.faqIconContainer, {
                            backgroundColor: `${colors.accent.primary}20`,
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            justifyContent: 'center',
                            alignItems: 'center'
                          }]}>
                            <Icon name={faq.icon} size={16} color={colors.accent.primary} />
                          </View>
                          <Text style={[styles.faqQuestionText, {
                            color: colors.text,
                            fontSize: 14,
                            fontWeight: '600',
                            flex: 1
                          }]}>
                            {faq.question}
                          </Text>
                        </View>
                        <Icon
                          name={expanded ? 'chevron-up' : 'chevron-down'}
                          size={20}
                          color={colors.sidebar.text.secondary}
                        />
                      </TouchableOpacity>

                      {expanded && (
                        <View style={[styles.faqAnswer, {
                          paddingHorizontal: 16,
                          paddingBottom: 16,
                          paddingTop: 0,
                          borderTopWidth: 1,
                          borderTopColor: colors.border
                        }]}>
                          <Text style={[styles.faqAnswerText, {
                            color: colors.sidebar.text.secondary,
                            fontSize: 13,
                            lineHeight: 20
                          }]}>
                            {faq.answer}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Report a Problem Section */}
              <View style={[styles.reportProblemCard, {
                backgroundColor: isDark ? '#1e293b' : '#fef2f2',
                borderRadius: 16,
                padding: 20,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: isDark ? '#ef444430' : '#ef444420'
              }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 }}>
                  <Icon name="bug" size={24} color="#EF4444" />
                  <Text style={[styles.reportTitle, { color: colors.text, fontSize: 16, fontWeight: '600' }]}>
                    Found a Bug?
                  </Text>
                </View>
                <Text style={[styles.reportDescription, { color: colors.sidebar.text.secondary, fontSize: 13, lineHeight: 18, marginBottom: 16 }]}>
                  Help us improve TMC Connect by reporting any issues you encounter. Our team will investigate and fix it as soon as possible.
                </Text>
                <TouchableOpacity
                  style={[styles.reportButton, {
                    backgroundColor: '#EF4444',
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 25,
                    alignSelf: 'flex-start',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8
                  }]}
                  onPress={() => {
                    Alert.alert(
                      'Report an Issue',
                      'Please describe the issue you\'re experiencing:',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Submit',
                          onPress: () => Alert.alert('Thank You!', 'Your report has been submitted. We\'ll look into it promptly.')
                        }
                      ]
                    );
                  }}
                >
                  <Icon name="email" size={18} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>Report Issue</Text>
                </TouchableOpacity>
              </View>

              {/* Version Info */}
              <View style={[styles.versionInfo, {
                alignItems: 'center',
                paddingVertical: 20,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                marginTop: 8
              }]}>
                <Text style={[styles.versionText, { color: colors.sidebar.text.muted, fontSize: 12 }]}>
                  TMC Connect v1.0.1
                </Text>
                <Text style={[styles.copyrightText, { color: colors.sidebar.text.muted, fontSize: 11, marginTop: 4 }]}>
                  © 2024 TMC Connect. All rights reserved.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };


  const calculateMonthlyAttendance = useCallback(async () => {
    try {
      setChartLoading(true);
      const studentID = (userData as any)?.studentID;

      console.log('Calculating monthly attendance for student:', studentID);

      if (!studentID) {
        console.log('No student ID found');
        setChartLoading(false);
        return;
      }

      const eventsRef = collection(db, 'events');
      const querySnapshot = await getDocs(eventsRef);

      // Get last 6 months
      const now = new Date();
      const months: { name: string; startDate: Date; endDate: Date; fullName: string }[] = [];

      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleString('default', { month: 'short' });
        const fullMonthName = date.toLocaleString('default', { month: 'long' });
        const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
        const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        months.push({ name: monthName, startDate, endDate, fullName: fullMonthName });
      }

      const monthlyData: MonthlyAttendanceData[] = months.map(month => ({
        month: month.name,
        attended: 0,
        missed: 0,
        total: 0
      }));

      let totalAttended = 0;
      let totalMissed = 0;

      console.log('Total events to process:', querySnapshot.docs.length);

      // Process each event
      querySnapshot.docs.forEach(docSnapshot => {
        const eventData = docSnapshot.data();

        // Check if event is approved
        const hasStatus = 'status' in eventData;
        const isApproved = hasStatus && eventData.status === 'approved';
        const isAdminEvent = !hasStatus;

        if (!isApproved && !isAdminEvent) return;

        // Get event date
        let eventDate: Date;
        if (typeof eventData.date === 'object' && (eventData.date as any)?.toDate) {
          eventDate = (eventData.date as any).toDate();
        } else if (typeof eventData.date === 'string') {
          eventDate = new Date(eventData.date);
        } else {
          return;
        }

        if (eventDate > now) return;

        const attendees = eventData.attendees || [];
        const studentAttendance = attendees.find((attendee: AttendanceRecord) =>
          attendee.studentID === studentID.toString()
        );
        const eventMonthIndex = months.findIndex(month =>
          eventDate >= month.startDate && eventDate <= month.endDate
        );

        if (eventMonthIndex !== -1) {
          if (studentAttendance) {
            monthlyData[eventMonthIndex].attended++;
            totalAttended++;
          } else {
            monthlyData[eventMonthIndex].missed++;
            totalMissed++;
          }
          monthlyData[eventMonthIndex].total++;
        }
      });

      console.log('Monthly attendance data calculated:', monthlyData);
      console.log('Totals - Attended:', totalAttended, 'Missed:', totalMissed);

      setMonthlyAttendanceData(monthlyData);
      setAttendedCount(totalAttended);
      setMissedCount(totalMissed);
    } catch (error) {
      console.error('Error calculating monthly attendance:', error);
    } finally {
      setChartLoading(false);
    }
  }, [userData]);

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

      // Calculate chart data after fetching events
      await calculateMonthlyAttendance();
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCourseModal = () => (
    <Modal
      visible={showCourseModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowCourseModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.aboutModal, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>My Course</Text>
            <TouchableOpacity onPress={() => setShowCourseModal(false)}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.courseDisplayContainer}>
            <Icon name="school" size={48} color={colors.accent.primary} />
            <Text style={[styles.courseDisplayText, { color: colors.text }]}>
              {userCourse}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );

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
    const loadData = async () => {
      await fetchEvents();
      await calculateMonthlyAttendance();
      fetchProfileImage();
    };

    loadData();
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
    const confirmLogout = () => {
      logout();
      router.replace('/login');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) {
        confirmLogout();
      }
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', style: 'destructive', onPress: confirmLogout }
        ]
      );
    }
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

                        {penalty.deadline && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 }}>
                            <Icon name="clock-outline" size={14} color={severityColor} />
                            <Text style={{ fontSize: 12, color: severityColor, fontWeight: '500' }}>
                              Deadline: {formatDate(penalty.deadline)}
                            </Text>
                          </View>
                        )}

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

  // Attendance Report Modal with Enhanced Interactive Charts
  const renderAttendanceReportModal = () => {
    const totalEvents = attendedCount + missedCount;
    const attendedPercentage = totalEvents > 0 ? Math.round((attendedCount / totalEvents) * 100) : 0;
    const missedPercentage = totalEvents > 0 ? Math.round((missedCount / totalEvents) * 100) : 0;

    // Animation values for stats
    const statAnim1 = useRef(new Animated.Value(0)).current;
    const statAnim2 = useRef(new Animated.Value(0)).current;
    const chartAnim = useRef(new Animated.Value(0)).current;
    const [selectedSlice, setSelectedSlice] = useState<number | null>(null);

    // Animate stats on mount
    useEffect(() => {
      if (showAttendanceReportModal) {
        Animated.stagger(200, [
          Animated.timing(statAnim1, {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(statAnim2, {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(chartAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      }
    }, [showAttendanceReportModal]);

    const pieData = [
      {
        value: attendedCount,
        color: '#10B981',
        gradientColor: '#059669',
        text: `${attendedPercentage}%`,
        label: 'Attended',
        icon: 'check-circle',
        description: 'Events you successfully attended',
      },
      {
        value: missedCount,
        color: '#EF4444',
        gradientColor: '#dc2626',
        text: `${missedPercentage}%`,
        label: 'Missed',
        icon: 'calendar-remove',
        description: 'Events you missed',
      },
    ];

    const maxValue = Math.max(
      ...monthlyAttendanceData.flatMap(d => [d.attended, d.missed]),
      1
    );

    return (
      <Modal
        visible={showAttendanceReportModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAttendanceReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.aboutModal, { maxHeight: '90%', padding: 0 }]}>
            <View style={[styles.modalHeader, { paddingHorizontal: 20, paddingTop: 20 }]}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Attendance Report</Text>
                <Text style={[styles.modalSubtitle, { color: colors.sidebar.text.secondary }]}>
                  Last 6 months overview
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowAttendanceReportModal(false)}>
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
              {chartLoading ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={colors.accent.primary} />
                  <Text style={{ marginTop: 12, color: colors.sidebar.text.secondary }}>Loading attendance data...</Text>
                </View>
              ) : (
                <>
                  {/* Animated Summary Stats */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, marginBottom: 24, gap: 12 }}>
                    <Animated.View style={[
                      styles.summaryCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: '#10B981',
                        borderWidth: 1,
                        borderRadius: 16,
                        padding: 16,
                        flex: 1,
                        alignItems: 'center',
                        opacity: statAnim1,
                        transform: [{ translateY: statAnim1.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                      }
                    ]}>
                      <Animated.View style={{ transform: [{ scale: statAnim1.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }] }}>
                        <Icon name="check-circle" size={28} color="#10B981" />
                      </Animated.View>
                      <Text style={[styles.summaryNumber, { color: '#10B981', fontSize: 32, fontWeight: 'bold', marginTop: 8 }]}>
                        {attendedCount}
                      </Text>
                      <Text style={[styles.summaryLabel, { color: colors.sidebar.text.secondary, fontSize: 12 }]}>Events Attended</Text>
                    </Animated.View>

                    <Animated.View style={[
                      styles.summaryCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: '#EF4444',
                        borderWidth: 1,
                        borderRadius: 16,
                        padding: 16,
                        flex: 1,
                        alignItems: 'center',
                        opacity: statAnim2,
                        transform: [{ translateY: statAnim2.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                      }
                    ]}>
                      <Animated.View style={{ transform: [{ scale: statAnim2.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }] }}>
                        <Icon name="calendar-remove" size={28} color="#EF4444" />
                      </Animated.View>
                      <Text style={[styles.summaryNumber, { color: '#EF4444', fontSize: 32, fontWeight: 'bold', marginTop: 8 }]}>
                        {missedCount}
                      </Text>
                      <Text style={[styles.summaryLabel, { color: colors.sidebar.text.secondary, fontSize: 12 }]}>Events Missed</Text>
                    </Animated.View>
                  </View>

                  {/* Interactive Donut Chart */}
                  <Animated.View style={[
                    styles.chartContainer,
                    {
                      backgroundColor: colors.card,
                      borderRadius: 20,
                      padding: 20,
                      marginBottom: 20,
                      opacity: chartAnim,
                      transform: [{ scale: chartAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
                    }
                  ]}>
                    <Text style={[styles.chartTitle, { color: colors.text, fontSize: 18, fontWeight: '600', marginBottom: 8, textAlign: 'center' }]}>
                      Overall Attendance Distribution
                    </Text>
                    <Text style={[styles.chartSubtitle, { color: colors.sidebar.text.secondary, fontSize: 12, textAlign: 'center', marginBottom: 16 }]}>
                      Tap segments for details
                    </Text>

                    <View style={{ alignItems: 'center', justifyContent: 'center', height: 220 }}>
                      <PieChart
                        data={pieData.map((item, index) => ({
                          ...item,
                          onPress: () => setSelectedSlice(selectedSlice === index ? null : index),
                          strokeWidth: selectedSlice === index ? 4 : 2,
                          strokeColor: selectedSlice === index ? '#ffffff' : 'transparent',
                        }))}
                        donut
                        showText
                        textColor={isDark ? '#ffffff' : '#1e293b'}
                        fontWeight="bold"
                        innerRadius={60}
                        innerCircleColor={isDark ? '#1e293b' : '#ffffff'}
                        radius={isMobile ? 90 : 110}
                        focusOnPress
                        centerLabelComponent={() => (
                          <View style={{ alignItems: 'center' }}>
                            {selectedSlice !== null ? (
                              <>
                                <Text style={{ fontSize: 28, fontWeight: 'bold', color: pieData[selectedSlice].color }}>
                                  {pieData[selectedSlice].value}
                                </Text>
                                <Text style={{ fontSize: 12, color: colors.sidebar.text.secondary }}>
                                  {pieData[selectedSlice].label}
                                </Text>
                              </>
                            ) : (
                              <>
                                <Text style={[styles.centerLabelValue, { color: colors.text, fontSize: 28, fontWeight: 'bold' }]}>
                                  {totalEvents}
                                </Text>
                                <Text style={[styles.centerLabelText, { color: colors.sidebar.text.secondary, fontSize: 11 }]}>
                                  Total Events
                                </Text>
                              </>
                            )}
                          </View>
                        )}
                      />
                    </View>

                    {/* Interactive Legend */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 16 }}>
                      {pieData.map((item, index) => (
                        <TouchableOpacity
                          key={index}
                          onPress={() => setSelectedSlice(selectedSlice === index ? null : index)}
                          style={[
                            styles.pieLegendItem,
                            selectedSlice === index && {
                              backgroundColor: isDark ? `${item.color}30` : `${item.color}15`,
                              borderColor: item.color,
                            }
                          ]}
                        >
                          <View style={[styles.pieLegendDot, { backgroundColor: item.color }]} />
                          <View>
                            <Text style={[styles.pieLegendText, { color: colors.text, fontWeight: '600' }]}>
                              {item.label}
                            </Text>
                            <Text style={[styles.pieLegendSubtext, { color: colors.sidebar.text.secondary }]}>
                              {item.value} ({item.text})
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Selected Slice Details */}
                    {selectedSlice !== null && (
                      <Animated.View
                        style={[
                          styles.sliceDetailsContainer,
                          {
                            backgroundColor: isDark ? `${pieData[selectedSlice].color}20` : `${pieData[selectedSlice].color}10`,
                            opacity: chartAnim,
                            transform: [{ translateY: chartAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
                          }
                        ]}
                      >
                        <Icon name={pieData[selectedSlice].icon as any} size={20} color={pieData[selectedSlice].color} />
                        <Text style={[styles.sliceDetailsText, { color: pieData[selectedSlice].color }]}>
                          {pieData[selectedSlice].description}
                        </Text>
                      </Animated.View>
                    )}
                  </Animated.View>

                  {/* Animated Bar Chart - Using the component */}
                  {monthlyAttendanceData.length > 0 && (
                    <BarChartSection
                      monthlyAttendanceData={monthlyAttendanceData}
                      maxValue={maxValue}
                      colors={colors}
                      isDark={isDark}
                      chartAnim={chartAnim}
                    />
                  )}

                  {/* Performance Insight Card */}
                  {totalEvents > 0 && (
                    <Animated.View style={[
                      styles.chartContainer,
                      {
                        backgroundColor: colors.card,
                        borderRadius: 20,
                        padding: 20,
                        marginTop: 20,
                        marginBottom: 20,
                        opacity: chartAnim,
                        transform: [{ translateY: chartAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
                      }
                    ]}>
                      <Text style={[styles.chartTitle, { color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 12, textAlign: 'center' }]}>
                        Performance Insight
                      </Text>

                      {/* Progress Bar */}
                      <View style={{ width: '100%', backgroundColor: isDark ? '#334155' : '#e2e8f0', borderRadius: 10, height: 12, overflow: 'hidden', marginBottom: 12 }}>
                        <Animated.View style={{
                          width: `${attendedPercentage}%`,
                          backgroundColor: attendedPercentage >= 80 ? '#10B981' : attendedPercentage >= 60 ? '#F59E0B' : '#EF4444',
                          height: '100%',
                          borderRadius: 10,
                          opacity: chartAnim,
                          transform: [{ scaleX: chartAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) }],
                        }} />
                      </View>

                      {/* Rating Scale */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                        <Text style={{ fontSize: 10, color: colors.sidebar.text.secondary }}>0%</Text>
                        <Text style={{ fontSize: 10, color: colors.sidebar.text.secondary }}>50%</Text>
                        <Text style={{ fontSize: 10, color: colors.sidebar.text.secondary }}>100%</Text>
                      </View>

                      {/* Status Badge */}
                      <View style={{
                        backgroundColor: attendedPercentage >= 80 ? '#10B98120' : attendedPercentage >= 60 ? '#F59E0B20' : '#EF444420',
                        padding: 12,
                        borderRadius: 12,
                        alignItems: 'center',
                      }}>
                        <Text style={{
                          fontSize: 14,
                          fontWeight: '600',
                          color: attendedPercentage >= 80 ? '#10B981' : attendedPercentage >= 60 ? '#F59E0B' : '#EF4444',
                        }}>
                          {attendedPercentage >= 80 ? '🎉 Excellent' : attendedPercentage >= 60 ? '👍 Good' : '⚠️ Needs Improvement'}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.sidebar.text.secondary, marginTop: 4, textAlign: 'center' }}>
                          {attendedPercentage >= 80 ? 'Keep up the great work!' :
                            attendedPercentage >= 60 ? 'You\'re doing well, aim higher!' :
                              'Attend more events to improve your record'}
                        </Text>
                      </View>
                    </Animated.View>
                  )}
                </>
              )}
            </ScrollView>
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
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowCourseModal(true)}
          >
            <Icon name="book-open-variant" size={20} color="#3B82F6" />
            <Text style={styles.menuText}>My Courses</Text>
            <Icon name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowAttendanceReportModal(true)}
          >
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

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowHelpModal(true)}
          >
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
      {renderCourseModal()}
      {renderHelpModal()}
      {renderAttendanceReportModal()}
    </ScrollView>
  );
}
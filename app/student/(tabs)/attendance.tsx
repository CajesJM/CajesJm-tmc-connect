import { Feather } from '@expo/vector-icons';
import { Camera, CameraView } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { arrayUnion, doc, DocumentData, getDoc, updateDoc } from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  Easing,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { ErrorService } from '../../../lib/errorService';
import { auth, db } from '../../../lib/firebaseConfig';
import { locationService } from '../../../lib/locationService';
import type { AttendanceRecord, EventData, EventLocation, QRCodeData, UserLocation, ValidationResult } from '../../../lib/types';
import { attendanceStyles as styles } from '../../../styles/student/attendanceStyles';

const convertToEventData = (docData: DocumentData, id: string): EventData => ({
  id,
  title: docData.title || '',
  description: docData.description,
  date: docData.date,
  location: docData.location,
  coordinates: docData.coordinates,
  qrExpiration: docData.qrExpiration,
  attendanceDeadline: docData.attendanceDeadline,
  attendees: docData.attendees,
  createdBy: docData.createdBy,
  createdAt: docData.createdAt,
  updatedAt: docData.updatedAt,
});

export default function StudentAttendance() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [locationEnabled, setLocationEnabled] = useState<boolean>(true);
  const [scanned, setScanned] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [currentStudent, setCurrentStudent] = useState<any>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [scanAttempts, setScanAttempts] = useState(0);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionType, setPermissionType] = useState<'camera' | 'location' | null>(null);

  // Animation values
  const [pulseAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(0));

  const formattedStudentInfo = useMemo(() => {
    if (!currentStudent) return null;
    return {
      name: currentStudent.name,
      studentID: currentStudent.studentID,
      course: currentStudent.course,
      yearLevel: currentStudent.yearLevel,
      block: currentStudent.block || 'Not assigned',
      gender: currentStudent.gender
    };
  }, [currentStudent]);

  // Check permissions on mount and when app returns to foreground
  useEffect(() => {
    checkAllPermissions();
    
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        checkAllPermissions();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const checkAllPermissions = async () => {
    await checkCameraPermission();
    await checkLocationPermission();
  };

  // Camera permission check
  const checkCameraPermission = async () => {
    try {
      const { status } = await Camera.getCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      return status === 'granted';
    } catch (error) {
      console.error('Error checking camera permission:', error);
      setHasPermission(false);
      return false;
    }
  };

  // Location permission and service check
  const checkLocationPermission = async () => {
    try {
      // Check if location services are enabled
      const enabled = await Location.hasServicesEnabledAsync();
      setLocationEnabled(enabled);

      // Check permission status
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      return { enabled, granted: status === 'granted' };
    } catch (error) {
      console.error('Error checking location permission:', error);
      setLocationPermission(false);
      return { enabled: false, granted: false };
    }
  };

  // Request camera permission with fallback
  const requestCameraAccess = async (): Promise<boolean> => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      
      if (status === 'granted') {
        setHasPermission(true);
        return true;
      } else {
        setHasPermission(false);
        setPermissionType('camera');
        setShowPermissionModal(true);
        return false;
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setHasPermission(false);
      return false;
    }
  };

  // Request location permission with fallback
  const requestLocationAccess = async (): Promise<boolean> => {
    try {
      // First check if services are enabled
      const enabled = await Location.hasServicesEnabledAsync();
      setLocationEnabled(enabled);

      if (!enabled) {
        setPermissionType('location');
        setShowPermissionModal(true);
        return false;
      }

      // Then request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        setLocationPermission(true);
        return true;
      } else {
        setLocationPermission(false);
        setPermissionType('location');
        setShowPermissionModal(true);
        return false;
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setLocationPermission(false);
      return false;
    }
  };

  // Open device settings
  const openSettings = () => {
    setShowPermissionModal(false);
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  // Pulse animation for scanner
  useEffect(() => {
    if (showScanner && !scanned) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [showScanner, scanned]);

  // Slide animation for result modal
  useEffect(() => {
    if (showResult) {
      Animated.spring(slideAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [showResult]);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            setCurrentStudent({ id: user.uid, ...userDoc.data() });
          }
        }
      } catch (error) {
        console.error('Error fetching student data:', error);
      }
    };
    fetchStudentData();
  }, []);

  const isValidDate = useCallback((dateString: any): boolean => {
    if (!dateString) return false;
    try {
      const date = new Date(dateString);
      return !isNaN(date.getTime());
    } catch (error) {
      return false;
    }
  }, []);

  const formatDate = useCallback((dateString: string) => {
    if (!dateString || !isValidDate(dateString)) return 'Date not available';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date not available';
    }
  }, [isValidDate]);

  const validateQRCode = useCallback(async (qrData: QRCodeData, userLocation?: UserLocation): Promise<ValidationResult> => {
    const now = new Date();
    try {
      const eventRef = doc(db, 'events', qrData.eventId);
      const eventDoc = await getDoc(eventRef);

      if (!eventDoc.exists()) {
        return {
          valid: false,
          error: 'EVENT_NOT_FOUND',
          message: 'Event not found. This QR code may be invalid.'
        };
      }

      const eventData = convertToEventData(eventDoc.data(), eventDoc.id);

      if (eventData.coordinates && userLocation) {
        const eventLocation: EventLocation = eventData.coordinates;
        const locationCheck = locationService.isWithinEventRadius(userLocation, eventLocation);

        if (!locationCheck.within) {
          return {
            valid: false,
            error: 'LOCATION_MISMATCH',
            message: `You must be within ${eventLocation.radius}m of the event location. Current distance: ${locationCheck.distance.toFixed(0)}m`,
            distance: locationCheck.distance,
            allowedRadius: eventLocation.radius,
            event: eventData
          };
        }
        if (!locationService.isLocationAccurate(userLocation)) {
          return {
            valid: false,
            error: 'LOCATION_INACCURATE',
            message: 'Your location accuracy is too low. Please move to an open area and try again.',
            accuracy: userLocation.accuracy,
            event: eventData
          };
        }
      }

      if (eventData.qrExpiration && isValidDate(eventData.qrExpiration)) {
        const manualExpiration = new Date(eventData.qrExpiration);
        if (now > manualExpiration) {
          return {
            valid: false,
            error: 'QR_CODE_EXPIRED',
            message: `This QR code expired on ${formatDate(eventData.qrExpiration)}.`,
            expirationTime: manualExpiration,
            event: eventData
          };
        }
      }

      if (qrData.expiresAt && isValidDate(qrData.expiresAt)) {
        const expirationTime = new Date(qrData.expiresAt);
        if (now > expirationTime) {
          return {
            valid: false,
            error: 'QR_CODE_EXPIRED',
            message: `This QR code expired at ${formatDate(qrData.expiresAt)}.`,
            expirationTime: expirationTime,
            event: eventData
          };
        }
      }

      if (eventData.attendanceDeadline && isValidDate(eventData.attendanceDeadline)) {
        const deadline = new Date(eventData.attendanceDeadline);
        if (now > deadline) {
          return {
            valid: false,
            error: 'ATTENDANCE_DEADLINE_PASSED',
            message: `The attendance deadline for this event passed on ${formatDate(eventData.attendanceDeadline)}.`,
            event: eventData
          };
        }
      }

      if (eventData.date && isValidDate(eventData.date)) {
        const eventTime = new Date(eventData.date);
        if (now < eventTime) {
          const timeUntilEvent = Math.ceil((eventTime.getTime() - now.getTime()) / (1000 * 60));
          return {
            valid: false,
            error: 'EVENT_NOT_STARTED',
            message: `This event hasn't started yet. It begins in ${timeUntilEvent} minutes.`,
            event: eventData
          };
        }
      }

      const attendees = eventData.attendees || [];
      const alreadyAttended = attendees.some((attendee: any) =>
        attendee.studentID === currentStudent?.studentID
      );

      if (alreadyAttended) {
        return {
          valid: false,
          error: 'ALREADY_ATTENDED',
          message: 'You have already marked your attendance for this event.',
          event: eventData
        };
      }

      const distance = eventData.coordinates && userLocation
        ? locationService.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          eventData.coordinates.latitude,
          eventData.coordinates.longitude
        )
        : undefined;

      return {
        valid: true,
        event: eventData,
        qrData: qrData,
        locationVerified: !!(eventData.coordinates && userLocation),
        distance: distance
      };

    } catch (error) {
      console.error('Validation error:', error);
      return {
        valid: false,
        error: 'VALIDATION_ERROR',
        message: 'Error validating QR code. Please try again.'
      };
    }
  }, [currentStudent?.studentID, isValidDate, formatDate]);

  const resetScanner = useCallback(() => {
    setScanned(false);
    setScanResult(null);
    setShowResult(false);
    setCameraReady(false);
    setScanAttempts(0);
  }, []);

  const handleBarCodeScanned = useCallback(async ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    setIsGettingLocation(true);

    try {
      let qrData: QRCodeData;
      try {
        qrData = JSON.parse(data);
      } catch (parseError) {
        const errorInfo = ErrorService.handleError('QR_PARSE_ERROR');
        Alert.alert(errorInfo.title, errorInfo.message);
        setShowScanner(false);
        setIsGettingLocation(false);
        return;
      }

      if (qrData.type !== 'attendance' || !qrData.eventId) {
        Alert.alert('Invalid QR Code', 'This is not a valid attendance QR code.');
        setShowScanner(false);
        setIsGettingLocation(false);
        return;
      }

      if (!currentStudent) {
        const errorInfo = ErrorService.handleError('STUDENT_DATA_MISSING');
        Alert.alert(errorInfo.title, errorInfo.message);
        setShowScanner(false);
        setIsGettingLocation(false);
        return;
      }

      let userLocation: UserLocation | undefined;
      
      // Check location permission first
      const locationStatus = await checkLocationPermission();
      
      if (!locationStatus.enabled) {
        setShowScanner(false);
        setIsGettingLocation(false);
        setPermissionType('location');
        setShowPermissionModal(true);
        return;
      }

      if (!locationStatus.granted) {
        const granted = await requestLocationAccess();
        if (!granted) {
          setShowScanner(false);
          setIsGettingLocation(false);
          return;
        }
      }

      try {
        const locationResult = await locationService.getCurrentLocation();
        if (locationResult.success && locationResult.location) {
          userLocation = locationResult.location;
        }
      } catch (locationError) {
        console.warn('Location error:', locationError);
      }

      const validation = await validateQRCode(qrData, userLocation);
      ErrorService.logScanAttempt(validation, currentStudent.studentID);

      if (!validation.valid) {
        setScanResult({
          success: false,
          message: validation.message,
          error: validation.error,
          event: validation.event,
          expirationTime: validation.expirationTime,
          distance: validation.distance,
          allowedRadius: validation.allowedRadius,
          accuracy: validation.accuracy
        });
        setShowResult(true);
        setShowScanner(false);
        setIsGettingLocation(false);
        return;
      }

      const attendanceData: AttendanceRecord = {
        studentID: currentStudent.studentID,
        studentName: currentStudent.name,
        course: currentStudent.course,
        yearLevel: currentStudent.yearLevel,
        block: currentStudent.block || 'Not assigned',
        gender: currentStudent.gender,
        timestamp: new Date().toISOString(),
        scannedAt: new Date().toISOString(),
        qrGeneratedAt: qrData.timestamp,
        qrExpiredAt: qrData.expiresAt,
        usesManualExpiration: qrData.usesManualExpiration || false,
        location: userLocation ? {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          accuracy: userLocation.accuracy,
          timestamp: userLocation.timestamp,
          distance: validation.distance,
          isWithinRadius: validation.distance !== undefined && validation.distance <= (validation.event?.coordinates?.radius || 100)
        } : undefined
      };

      const eventRef = doc(db, 'events', qrData.eventId);
      await updateDoc(eventRef, {
        attendees: arrayUnion(attendanceData)
      });

      setScanResult({
        success: true,
        message: 'Attendance marked successfully!',
        event: validation.event,
        studentData: attendanceData,
        qrData: qrData,
        locationVerified: validation.locationVerified,
        distance: validation.distance
      });
      setShowResult(true);
      setShowScanner(false);

    } catch (error) {
      console.error('Error processing QR code:', error);
      const errorInfo = ErrorService.handleError('VALIDATION_ERROR');
      Alert.alert(errorInfo.title, errorInfo.message);
      setShowScanner(false);
    } finally {
      setIsGettingLocation(false);
    }
  }, [scanned, currentStudent, validateQRCode]);

  const openScanner = useCallback(async () => {
    // Check camera permission first
    const hasCamera = await checkCameraPermission();
    
    if (!hasCamera) {
      const granted = await requestCameraAccess();
      if (!granted) return;
    }

    // Check location before opening scanner
    const locationStatus = await checkLocationPermission();
    
    if (!locationStatus.enabled || !locationStatus.granted) {
      Alert.alert(
        'Location Required',
        'Location access is needed to verify your attendance at the event venue. Please enable location services.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Enable Location', 
            onPress: () => {
              setPermissionType('location');
              setShowPermissionModal(true);
            }
          }
        ]
      );
      return;
    }

    resetScanner();
    setShowScanner(true);
  }, [requestCameraAccess, checkLocationPermission, resetScanner]);

  const formatTimeRemaining = useCallback((expirationTime: string) => {
    if (!expirationTime || !isValidDate(expirationTime)) return 'Unknown';
    const now = new Date();
    const expiration = new Date(expirationTime);
    const diffMs = expiration.getTime() - now.getTime();
    if (diffMs <= 0) return 'Expired';
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h`;
  }, [isValidDate]);

  const renderPermissionModal = () => (
  <Modal
    visible={showPermissionModal}
    transparent
    animationType="fade"
    onRequestClose={() => setShowPermissionModal(false)}
  >
    <View style={styles.permissionOverlay}>
      <View style={styles.permissionModal}>
        <View style={styles.permissionModalIcon}>
          <Feather 
            name={permissionType === 'camera' ? 'camera' : 'map-pin'} 
            size={48} 
            color="#ef4444" 
          />
        </View>
        
        <Text style={styles.permissionModalTitle}>
          {permissionType === 'camera' ? 'Camera Access Required' : 'Location Access Required'}
        </Text>
        
        <Text style={styles.permissionModalText}>
          {permissionType === 'camera' 
            ? 'Camera access is required to scan QR codes for attendance. Please enable it in your device settings.'
            : 'Location access is required to verify you are at the event venue. Please enable location services in your device settings.'
          }
        </Text>

        <View style={styles.permissionModalButtons}>
          <TouchableOpacity 
            style={styles.permissionModalCancel}
            onPress={() => setShowPermissionModal(false)}
          >
            <Text style={styles.permissionModalCancelText}>Not Now</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.permissionModalEnable}
            onPress={openSettings}
          >
            <Feather name="settings" size={18} color="#fff" />
            <Text style={styles.permissionModalEnableText}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);
  // Loading State
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#14203d', '#06080b']} style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#0ea5e9" />
            <Text style={styles.loadingText}>Initializing Scanner...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Permission Modal */}
      {renderPermissionModal()}

      {/* Main Content */}
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <LinearGradient colors={['#14203d', '#06080b']} style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerIcon}>
              <Feather name="check-square" size={28} color="#0ea5e9" />
            </View>
            <View>
              <Text style={styles.greeting}>Attendance</Text>
              <Text style={styles.headerTitle}>Scan & Verify</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>
            Quick QR code scanning for event attendance
          </Text>
        </LinearGradient>

        {/* Permission Status Cards */}
        {(!hasPermission || !locationPermission || !locationEnabled) && (
          <View style={styles.permissionAlertCard}>
            <View style={styles.permissionAlertHeader}>
              <Feather name="alert-circle" size={20} color="#f59e0b" />
              <Text style={styles.permissionAlertTitle}>Permissions Required</Text>
            </View>
            
            {!hasPermission && (
              <TouchableOpacity 
                style={styles.permissionAlertItem}
                onPress={() => {
                  setPermissionType('camera');
                  setShowPermissionModal(true);
                }}
              >
                <View style={[styles.permissionAlertIcon, { backgroundColor: '#fee2e2' }]}>
                  <Feather name="camera" size={16} color="#ef4444" />
                </View>
                <View style={styles.permissionAlertContent}>
                  <Text style={styles.permissionAlertItemTitle}>Camera Access</Text>
                  <Text style={styles.permissionAlertItemDesc}>Needed to scan QR codes</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}

            {(!locationPermission || !locationEnabled) && (
              <TouchableOpacity 
                style={styles.permissionAlertItem}
                onPress={() => {
                  setPermissionType('location');
                  setShowPermissionModal(true);
                }}
              >
                <View style={[styles.permissionAlertIcon, { backgroundColor: '#fef3c7' }]}>
                  <Feather name="map-pin" size={16} color="#f59e0b" />
                </View>
                <View style={styles.permissionAlertContent}>
                  <Text style={styles.permissionAlertItemTitle}>Location Access</Text>
                  <Text style={styles.permissionAlertItemDesc}>Needed to verify event venue</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Quick Scan Card */}
        <View style={styles.scanCard}>
          <LinearGradient 
            colors={hasPermission && locationPermission && locationEnabled 
              ? ['#0ea5e9', '#0284c7'] 
              : ['#9ca3af', '#6b7280']
            } 
            style={styles.scanGradient}
          >
            <View style={styles.scanIconContainer}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Feather name="maximize" size={48} color="#fff" />
              </Animated.View>
            </View>
            <Text style={styles.scanCardTitle}>
              {hasPermission && locationPermission && locationEnabled 
                ? 'Ready to Scan' 
                : 'Setup Required'
              }
            </Text>
            <Text style={styles.scanCardSubtitle}>
              {hasPermission && locationPermission && locationEnabled
                ? 'Position QR code within the frame to mark attendance'
                : 'Please enable camera and location permissions to continue'
              }
            </Text>
            <TouchableOpacity 
              style={[
                styles.scanButton,
                (!hasPermission || !locationPermission || !locationEnabled) && styles.scanButtonDisabled
              ]} 
              onPress={openScanner}
              disabled={!hasPermission || !locationPermission || !locationEnabled}
            >
              <Feather name="camera" size={20} color={hasPermission && locationPermission && locationEnabled ? "#0ea5e9" : "#9ca3af"} />
              <Text style={[
                styles.scanButtonText,
                (!hasPermission || !locationPermission || !locationEnabled) && styles.scanButtonTextDisabled
              ]}>
                {hasPermission && locationPermission && locationEnabled ? 'Open Scanner' : 'Permissions Required'}
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Student Info Card */}
        {formattedStudentInfo && (
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Feather name="user" size={20} color="#0ea5e9" />
              <Text style={styles.infoTitle}>Student Information</Text>
            </View>
            
            <View style={styles.infoGrid}>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {formattedStudentInfo.name}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Student ID</Text>
                  <Text style={styles.infoValue}>{formattedStudentInfo.studentID}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Course</Text>
                  <Text style={styles.infoValue}>{formattedStudentInfo.course}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Year</Text>
                  <Text style={styles.infoValue}>Year {formattedStudentInfo.yearLevel}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Block</Text>
                  <Text style={styles.infoValue}>{formattedStudentInfo.block}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Gender</Text>
                  <Text style={styles.infoValue}>{formattedStudentInfo.gender}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* How It Works */}
        <View style={styles.guideCard}>
          <Text style={styles.guideTitle}>How It Works</Text>
          
          {[
            { icon: 'camera', color: '#0ea5e9', title: 'Open Scanner', desc: 'Tap the button to activate camera' },
            { icon: 'maximize', color: '#8b5cf6', title: 'Scan QR Code', desc: 'Align the code within the frame' },
            { icon: 'map-pin', color: '#10b981', title: 'Verify Location', desc: 'System checks your proximity' },
            { icon: 'check-circle', color: '#f59e0b', title: 'Confirm', desc: 'Attendance recorded instantly' }
          ].map((step, index) => (
            <View key={index} style={styles.guideStep}>
              <View style={[styles.stepNumber, { backgroundColor: step.color + '20' }]}>
                <Feather name={step.icon as any} size={16} color={step.color} />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Tips Card */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Feather name="info" size={18} color="#f59e0b" />
            <Text style={styles.tipsTitle}>Pro Tips</Text>
          </View>
          <View style={styles.tipItem}>
            <Feather name="sun" size={14} color="#64748b" />
            <Text style={styles.tipText}>Ensure good lighting for better scanning</Text>
          </View>
          <View style={styles.tipItem}>
            <Feather name="wifi" size={14} color="#64748b" />
            <Text style={styles.tipText}>Stable internet connection required</Text>
          </View>
          <View style={styles.tipItem}>
            <Feather name="navigation" size={14} color="#64748b" />
            <Text style={styles.tipText}>Enable location services for verification</Text>
          </View>
        </View>
      </ScrollView>

      {/* Scanner Modal */}
      <Modal visible={showScanner} animationType="slide" onRequestClose={() => setShowScanner(false)}>
        <View style={styles.scannerContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          
          {(!cameraReady || isGettingLocation) && (
            <View style={styles.scannerLoading}>
              <ActivityIndicator size="large" color="#0ea5e9" />
              <Text style={styles.scannerLoadingText}>
                {isGettingLocation ? 'Verifying location...' : 'Starting camera...'}
              </Text>
            </View>
          )}

          <CameraView
            style={styles.camera}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onCameraReady={() => setCameraReady(true)}
          />

          {/* Scanner Overlay */}
          <View style={styles.scannerOverlay}>
            <Animated.View style={[styles.scannerFrame, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />
            </Animated.View>
            
            <Text style={styles.scannerInstruction}>
              {isGettingLocation ? 'Checking location...' : 'Align QR code within frame'}
            </Text>

            {isGettingLocation && (
              <View style={styles.locationBadge}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.locationBadgeText}>Verifying proximity...</Text>
              </View>
            )}
          </View>

          {/* Scanner Header */}
          <View style={styles.scannerHeader}>
            <TouchableOpacity style={styles.closeScannerBtn} onPress={() => setShowScanner(false)}>
              <Feather name="x" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.scannerHeaderTitle}>Scan QR Code</Text>
            <View style={{ width: 40 }} />
          </View>
        </View>
      </Modal>

      {/* Result Modal */}
      <Modal visible={showResult} transparent animationType="none" onRequestClose={resetScanner}>
        <View style={styles.resultOverlay}>
          <Animated.View 
            style={[
              styles.resultCard,
              { transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] }) }] }
            ]}
          >
            {scanResult?.success ? (
              <>
                <View style={styles.resultIconContainer}>
                  <LinearGradient colors={['#10b981', '#059669']} style={styles.resultIconGradient}>
                    <Feather name="check" size={40} color="#fff" />
                  </LinearGradient>
                </View>
                
                <Text style={styles.resultTitle}>Attendance Confirmed!</Text>
                <Text style={styles.resultMessage}>{scanResult.message}</Text>

                {scanResult.locationVerified && (
                  <View style={styles.verifiedBadge}>
                    <Feather name="map-pin" size={14} color="#10b981" />
                    <Text style={styles.verifiedText}>
                      Location Verified • {scanResult.distance?.toFixed(0)}m away
                    </Text>
                  </View>
                )}

                <View style={styles.eventDetailsCard}>
                  <Text style={styles.eventName}>{scanResult.event?.title}</Text>
                  <View style={styles.eventMeta}>
                    <Feather name="calendar" size={14} color="#64748b" />
                    <Text style={styles.eventMetaText}>
                      {formatDate(scanResult.event?.date)}
                    </Text>
                  </View>
                  <View style={styles.eventMeta}>
                    <Feather name="map-pin" size={14} color="#64748b" />
                    <Text style={styles.eventMetaText}>{scanResult.event?.location}</Text>
                  </View>
                </View>

                <View style={styles.studentDetails}>
                  <Text style={styles.detailsTitle}>Recorded Details</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Student ID</Text>
                    <Text style={styles.detailValue}>{scanResult.studentData.studentID}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Name</Text>
                    <Text style={styles.detailValue}>{scanResult.studentData.studentName}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Course</Text>
                    <Text style={styles.detailValue}>{scanResult.studentData.course}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Time</Text>
                    <Text style={styles.detailValue}>
                      {new Date(scanResult.studentData.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.doneButton} onPress={resetScanner}>
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.resultIconContainer}>
                  <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.resultIconGradient}>
                    <Feather name="x" size={40} color="#fff" />
                  </LinearGradient>
                </View>

                <Text style={styles.resultTitleError}>Scan Failed</Text>
                <Text style={styles.resultMessageError}>{scanResult?.message}</Text>

                {scanResult?.distance && (
                  <View style={styles.distanceWarning}>
                    <Feather name="alert-triangle" size={16} color="#f59e0b" />
                    <Text style={styles.distanceText}>
                      You're {scanResult.distance.toFixed(0)}m away (max {scanResult.allowedRadius}m)
                    </Text>
                  </View>
                )}

                {scanResult?.event && (
                  <View style={styles.eventDetailsCard}>
                    <Text style={styles.eventName}>{scanResult.event.title}</Text>
                    <View style={styles.eventMeta}>
                      <Feather name="calendar" size={14} color="#64748b" />
                      <Text style={styles.eventMetaText}>{formatDate(scanResult.event.date)}</Text>
                    </View>
                  </View>
                )}

                <View style={styles.errorActions}>
                  <TouchableOpacity style={styles.retryButton} onPress={() => { resetScanner(); openScanner(); }}>
                    <Feather name="refresh-cw" size={18} color="#fff" />
                    <Text style={styles.retryButtonText}>Try Again</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelResultButton} onPress={resetScanner}>
                    <Text style={styles.cancelResultText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
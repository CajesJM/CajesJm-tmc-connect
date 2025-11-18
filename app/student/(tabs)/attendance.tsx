import { Camera, CameraView } from 'expo-camera';
import { arrayUnion, doc, DocumentData, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth, db } from '../../../lib/firebaseConfig';
import { locationService } from '../../../lib/locationService';
import type { AttendanceRecord, EventData, EventLocation, QRCodeData, UserLocation, ValidationResult } from '../../../lib/types';
import { attendanceStyles as studentAttendanceStyles } from '../../styles/studentAttendanceStyles';


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
  const [scanned, setScanned] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [currentStudent, setCurrentStudent] = useState<any>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists()) {
            setCurrentStudent({
              id: user.uid,
              ...userDoc.data()
            });
          }
        }
      } catch (error) {
        console.error('Error fetching student data:', error);
      }
    };

    fetchStudentData();
  }, []);

  const requestCameraPermission = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setHasPermission(false);
      return false;
    }
  };

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const isValidDate = (dateString: any): boolean => {
    if (!dateString) return false;
    try {
      const date = new Date(dateString);
      return !isNaN(date.getTime());
    } catch (error) {
      return false;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString || !isValidDate(dateString)) {
      return 'Date not available';
    }

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
  };

  const validateQRCode = async (qrData: QRCodeData, userLocation?: UserLocation): Promise<ValidationResult> => {
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
            message: 'Your location accuracy is too low. Please move to an open area and try again or try to turn off and on your device location services.',
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
            message: `This QR code expired on ${formatDate(eventData.qrExpiration)}. Please ask your instructor for a new one.`,
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
            message: `This QR code expired at ${formatDate(qrData.expiresAt)}. Please ask your instructor for a new one.`,
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
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;

    setScanned(true);
    setIsGettingLocation(true);

    try {
      const qrData: QRCodeData = JSON.parse(data);

      if (qrData.type !== 'attendance' || !qrData.eventId) {
        Alert.alert('Invalid QR Code', 'This is not a valid attendance QR code.');
        setShowScanner(false);
        setIsGettingLocation(false);
        return;
      }

      if (!currentStudent) {
        Alert.alert('Error', 'Student data not found. Please make sure you are logged in.');
        setShowScanner(false);
        setIsGettingLocation(false);
        return;
      }

      let userLocation: UserLocation | undefined;
      try {
        const hasLocationPermission = await locationService.requestLocationPermission();
        if (hasLocationPermission) {
          const locationResult = await locationService.getCurrentLocation();
          if (locationResult.success && locationResult.location) {
            userLocation = locationResult.location;
            console.log('User location obtained:', userLocation);
          } else {
            console.warn('Location not available:', locationResult.error);
            Alert.alert(
              'Location Unavailable',
              'Attendance will be recorded without location verification. Some events may require location verification.',
              [{ text: 'Continue' }]
            );
          }
        } else {
          console.warn('Location permission denied');
          Alert.alert(
            'Location Permission Denied',
            'Attendance will be recorded without location verification. Some events may require location verification.',
            [{ text: 'Continue' }]
          );
        }
      } catch (locationError) {
        console.warn('Location error:', locationError);
        Alert.alert(
          'Location Error',
          'Unable to verify location. Attendance will be recorded without location verification.',
          [{ text: 'Continue' }]
        );
      }

      const validation = await validateQRCode(qrData, userLocation);

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
      Alert.alert('Error', 'Failed to process QR code. Please try again.');
      setShowScanner(false);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setScanResult(null);
    setShowResult(false);
    setCameraReady(false);
  };

  const openScanner = async () => {
    try {
      const { status } = await Camera.getCameraPermissionsAsync();
      if (status !== 'granted') {
        const granted = await requestCameraPermission();
        if (!granted) {
          Alert.alert(
            'Camera Access Required',
            'Camera permission is needed to scan QR codes. Please enable it in your device settings.',
            [{ text: 'OK' }]
          );
          return;
        }
      }
      resetScanner();
      setShowScanner(true);
    } catch (error) {
      console.error('Error opening scanner:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  };

  const formatTimeRemaining = (expirationTime: string) => {
    if (!expirationTime || !isValidDate(expirationTime)) return 'Unknown';

    const now = new Date();
    const expiration = new Date(expirationTime);
    const diffMs = expiration.getTime() - now.getTime();

    if (diffMs <= 0) return 'Expired';

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} minutes`;

    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  };

  if (hasPermission === null) {
    return (
      <View style={studentAttendanceStyles.container}>
        <View style={studentAttendanceStyles.header}>
          <View style={studentAttendanceStyles.headerIcon}>
            <Text style={{ color: '#FFFFFF', fontSize: 32 }}>📱</Text>
          </View>
          <Text style={studentAttendanceStyles.headerTitle}>Attendance Scanner</Text>
          <Text style={studentAttendanceStyles.headerSubtitle}>Setting up your scanner...</Text>
          <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 20 }} />
        </View>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <ScrollView
        style={studentAttendanceStyles.container}
        contentContainerStyle={studentAttendanceStyles.permissionContainer}
      >
        <View style={studentAttendanceStyles.permissionIcon}>
          <Text style={{ color: '#DC2626', fontSize: 48 }}>📷</Text>
        </View>
        <Text style={studentAttendanceStyles.permissionTitle}>Camera Access Required</Text>
        <Text style={studentAttendanceStyles.permissionText}>
          To scan QR codes and mark your attendance, please enable camera access for this app.
        </Text>

        <TouchableOpacity
          style={studentAttendanceStyles.permissionButton}
          onPress={openScanner}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 24 }}>📷</Text>
          <Text style={studentAttendanceStyles.permissionButtonText}>Enable Camera Access</Text>
        </TouchableOpacity>

        {currentStudent && (
          <View style={studentAttendanceStyles.studentInfoCard}>
            <Text style={studentAttendanceStyles.studentInfoTitle}>Your Profile</Text>
            <View style={studentAttendanceStyles.infoGrid}>
              <View style={studentAttendanceStyles.infoItem}>
                <Text style={studentAttendanceStyles.infoLabel}>Name</Text>
                <Text style={studentAttendanceStyles.infoValue}>{currentStudent.name}</Text>
              </View>
              <View style={studentAttendanceStyles.infoItem}>
                <Text style={studentAttendanceStyles.infoLabel}>Student ID</Text>
                <Text style={studentAttendanceStyles.infoValue}>{currentStudent.studentID}</Text>
              </View>
              <View style={studentAttendanceStyles.infoItem}>
                <Text style={studentAttendanceStyles.infoLabel}>Course</Text>
                <Text style={studentAttendanceStyles.infoValue}>{currentStudent.course}</Text>
              </View>
              <View style={studentAttendanceStyles.infoItem}>
                <Text style={studentAttendanceStyles.infoLabel}>Year Level</Text>
                <Text style={studentAttendanceStyles.infoValue}>Year {currentStudent.yearLevel}</Text>
              </View>
              <View style={studentAttendanceStyles.infoItem}>
                <Text style={studentAttendanceStyles.infoLabel}>Block</Text>
                <Text style={studentAttendanceStyles.infoValue}>{currentStudent.block || 'Not assigned'}</Text>
              </View>
              <View style={studentAttendanceStyles.infoItem}>
                <Text style={studentAttendanceStyles.infoLabel}>Gender</Text>
                <Text style={studentAttendanceStyles.infoValue}>{currentStudent.gender}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={studentAttendanceStyles.container} showsVerticalScrollIndicator={false}>
      <View style={studentAttendanceStyles.header}>
        <View style={studentAttendanceStyles.headerIcon}>
          <Text style={{ color: '#FFFFFF', fontSize: 32 }}>📱</Text>
        </View>
        <Text style={studentAttendanceStyles.headerTitle}>Attendance Scanner</Text>
        <Text style={studentAttendanceStyles.headerSubtitle}>
          Scan event QR codes to mark your attendance automatically
        </Text>
      </View>
      <View style={studentAttendanceStyles.mainCard}>
        <Text style={studentAttendanceStyles.cardTitle}>Quick Attendance</Text>
        <Text style={studentAttendanceStyles.instruction}>
          Simply scan the QR code displayed during your event. Your attendance will be recorded instantly with all your details.
        </Text>

        <TouchableOpacity style={studentAttendanceStyles.actionButton} onPress={openScanner}>
          <Text style={{ color: '#FFFFFF', fontSize: 24 }}>📷</Text>
          <Text style={studentAttendanceStyles.actionButtonText}>Scan QR Code</Text>
        </TouchableOpacity>
      </View>

      {currentStudent && (
        <View style={studentAttendanceStyles.studentInfoCard}>
          <Text style={studentAttendanceStyles.studentInfoTitle}>👤 Student Profile</Text>
          <View style={studentAttendanceStyles.infoGrid}>
            <View style={studentAttendanceStyles.infoItem}>
              <Text style={studentAttendanceStyles.infoLabel}>Full Name</Text>
              <Text style={studentAttendanceStyles.infoValue}>{currentStudent.name}</Text>
            </View>
            <View style={studentAttendanceStyles.infoItem}>
              <Text style={studentAttendanceStyles.infoLabel}>Student ID</Text>
              <Text style={studentAttendanceStyles.infoValue}>{currentStudent.studentID}</Text>
            </View>
            <View style={studentAttendanceStyles.infoItem}>
              <Text style={studentAttendanceStyles.infoLabel}>Course Program</Text>
              <Text style={studentAttendanceStyles.infoValue}>{currentStudent.course}</Text>
            </View>
            <View style={studentAttendanceStyles.infoItem}>
              <Text style={studentAttendanceStyles.infoLabel}>Academic Year</Text>
              <Text style={studentAttendanceStyles.infoValue}>Year {currentStudent.yearLevel}</Text>
            </View>
            <View style={studentAttendanceStyles.infoItem}>
              <Text style={studentAttendanceStyles.infoLabel}>Class Block</Text>
              <Text style={studentAttendanceStyles.infoValue}>Block {currentStudent.block || 'N/A'}</Text>
            </View>
            <View style={studentAttendanceStyles.infoItem}>
              <Text style={studentAttendanceStyles.infoLabel}>Gender</Text>
              <Text style={studentAttendanceStyles.infoValue}>{currentStudent.gender}</Text>
            </View>
          </View>
        </View>
      )}

      <View style={studentAttendanceStyles.guideSection}>
        <Text style={studentAttendanceStyles.guideTitle}>How It Works</Text>

        <View style={studentAttendanceStyles.guideItem}>
          <View style={studentAttendanceStyles.guideNumber}>
            <Text style={studentAttendanceStyles.guideNumberText}>1</Text>
          </View>
          <View style={studentAttendanceStyles.guideContent}>
            <Text style={studentAttendanceStyles.guideStep}>Tap Scan Button</Text>
            <Text style={studentAttendanceStyles.guideDescription}>
              Press the Scan QR Code button to open the camera scanner
            </Text>
          </View>
        </View>

        <View style={studentAttendanceStyles.guideItem}>
          <View style={studentAttendanceStyles.guideNumber}>
            <Text style={studentAttendanceStyles.guideNumberText}>2</Text>
          </View>
          <View style={studentAttendanceStyles.guideContent}>
            <Text style={studentAttendanceStyles.guideStep}>Align QR Code</Text>
            <Text style={studentAttendanceStyles.guideDescription}>
              Point your camera at the event QR code within the frame
            </Text>
          </View>
        </View>

        <View style={studentAttendanceStyles.guideItem}>
          <View style={studentAttendanceStyles.guideNumber}>
            <Text style={studentAttendanceStyles.guideNumberText}>3</Text>
          </View>
          <View style={studentAttendanceStyles.guideContent}>
            <Text style={studentAttendanceStyles.guideStep}>Location Verification</Text>
            <Text style={studentAttendanceStyles.guideDescription}>
              Your location will be verified to ensure you're at the event venue
            </Text>
          </View>
        </View>

        <View style={studentAttendanceStyles.guideItem}>
          <View style={studentAttendanceStyles.guideNumber}>
            <Text style={studentAttendanceStyles.guideNumberText}>4</Text>
          </View>
          <View style={studentAttendanceStyles.guideContent}>
            <Text style={studentAttendanceStyles.guideStep}>Confirmation</Text>
            <Text style={studentAttendanceStyles.guideDescription}>
              View the confirmation screen with your recorded information
            </Text>
          </View>
        </View>
      </View>

      <Modal visible={showScanner} animationType="slide" onRequestClose={() => setShowScanner(false)}>
        <View style={studentAttendanceStyles.scannerContainer}>
          {(!cameraReady || isGettingLocation) && (
            <View style={studentAttendanceStyles.cameraLoading}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={studentAttendanceStyles.cameraLoadingText}>
                {isGettingLocation ? 'Verifying your location...' : 'Loading camera...'}
              </Text>
            </View>
          )}

          <CameraView
            style={studentAttendanceStyles.camera}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onCameraReady={() => setCameraReady(true)}
          />

          <View style={studentAttendanceStyles.scannerOverlay}>
            <View style={studentAttendanceStyles.scannerFrame} />
            <Text style={studentAttendanceStyles.scannerText}>
              {isGettingLocation ? 'Verifying location...' : 'Align QR code within the frame'}
            </Text>

            {isGettingLocation && (
              <View style={studentAttendanceStyles.locationStatus}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={studentAttendanceStyles.locationStatusText}>
                  Checking your proximity to event...
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={studentAttendanceStyles.closeButton} onPress={() => setShowScanner(false)}>
            <Text style={{ color: '#FFFFFF', fontSize: 20 }}>✕</Text>
            <Text style={studentAttendanceStyles.closeButtonText}>Close Scanner</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      <Modal visible={showResult} transparent animationType="fade" onRequestClose={resetScanner}>
        <View style={studentAttendanceStyles.resultOverlay}>
          <View style={studentAttendanceStyles.resultContent}>
            {scanResult?.success ? (
              <>
                <Text style={studentAttendanceStyles.successTitle}>
                  {scanResult.locationVerified ? (
                    <>
                      <Icon name="map-marker" size={16} color="#1e6dffff" /> Attendance Confirmed!
                    </>
                  ) : (
                    <>
                      <Icon name="map-marker" size={16} color="#1e6dffff" />Attendance Confirmed!
                    </>
                  )}
                </Text>
                <Text style={studentAttendanceStyles.resultText}>{scanResult.message}</Text>

                {scanResult.locationVerified && (
                  <View style={studentAttendanceStyles.locationVerification}>
                    <Text style={studentAttendanceStyles.locationVerifiedText}>
                      <Icon name="check-circle" size={16} color="#10B981" /> Location Verified
                    </Text>
                    <Text style={studentAttendanceStyles.locationDetails}>
                      You were {scanResult.distance?.toFixed(0)}m from the event venue
                    </Text>
                  </View>
                )}

                <View style={studentAttendanceStyles.eventInfo}>
                  <Text style={studentAttendanceStyles.eventName}>{scanResult.event?.title}</Text>
                  <Text style={studentAttendanceStyles.eventDetails}><Icon name="map-marker" size={16} color="#1e6dffff" />{scanResult.event?.location}</Text>

                  {scanResult.event?.date && isValidDate(scanResult.event.date) && (
                    <Text style={studentAttendanceStyles.eventDetails}>
                      <Icon name="calendar" size={16} color="#000" /> {formatDate(scanResult.event.date)}
                    </Text>
                  )}

                  {scanResult.qrData?.usesManualExpiration && scanResult.event?.qrExpiration && isValidDate(scanResult.event.qrExpiration) ? (
                    <Text style={studentAttendanceStyles.eventDetails}>
                      <Icon name="alarm" size={16} color="#666" /> Manually Controlled • Expires: {formatDate(scanResult.event.qrExpiration)}
                    </Text>
                  ) : scanResult.qrData?.expiresAt && isValidDate(scanResult.qrData.expiresAt) ? (
                    <Text style={studentAttendanceStyles.eventDetails}>
                      <Icon name="alarm" size={16} color="#666" /> QR Valid: {formatTimeRemaining(scanResult.qrData.expiresAt)} remaining
                    </Text>
                  ) : null}
                </View>

                <View style={studentAttendanceStyles.attendanceDetails}>
                  <Text style={studentAttendanceStyles.detailsTitle}>Your Recorded Details</Text>
                  <Text style={studentAttendanceStyles.detailItem}>🆔 Student ID: {scanResult.studentData.studentID}</Text>
                  <Text style={studentAttendanceStyles.detailItem}>👤 Name: {scanResult.studentData.studentName}</Text>
                  <Text style={studentAttendanceStyles.detailItem}>🎓 Course: {scanResult.studentData.course}</Text>
                  <Text style={studentAttendanceStyles.detailItem}>📚 Year Level: {scanResult.studentData.yearLevel}</Text>
                  <Text style={studentAttendanceStyles.detailItem}>🧩 Block: {scanResult.studentData.block}</Text>
                  <Text style={studentAttendanceStyles.detailItem}>👥 Gender: {scanResult.studentData.gender}</Text>
                  <Text style={studentAttendanceStyles.detailItem}>
                    <Icon name="alarm" size={16} color="#666" /> Time: {new Date(scanResult.studentData.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
              </>
            ) : (
              <>
                {scanResult?.error === 'QR_CODE_EXPIRED' ? (
                  <>
                    <Text style={studentAttendanceStyles.errorTitle}><Icon name="alarm" size={16} color="#666" /> QR Code Expired</Text>
                    <Text style={studentAttendanceStyles.resultText}>{scanResult.message}</Text>
                    {scanResult.expirationTime && (
                      <Text style={studentAttendanceStyles.resultText}>
                        Expired: {formatDate(scanResult.expirationTime.toISOString())}
                      </Text>
                    )}
                  </>
                ) : scanResult?.error === 'ATTENDANCE_DEADLINE_PASSED' ? (
                  <>
                    <Text style={studentAttendanceStyles.errorTitle}><Icon name="calendar" size={16} color="#000000ff" /> Deadline Passed</Text>
                    <Text style={studentAttendanceStyles.resultText}>{scanResult.message}</Text>
                  </>
                ) : scanResult?.error === 'EVENT_NOT_STARTED' ? (
                  <>
                    <Text style={studentAttendanceStyles.errorTitle}><Icon name="timer-sand" size={16} color="#000000ff" /> Event Not Started</Text>
                    <Text style={studentAttendanceStyles.resultText}>{scanResult.message}</Text>
                  </>
                ) : scanResult?.error === 'LOCATION_MISMATCH' ? (
                  <>
                    <Text style={studentAttendanceStyles.errorTitle}><Icon name="map-marker" size={16} color="#1e6dffff" /> Too Far From Event</Text>
                    <Text style={studentAttendanceStyles.resultText}>{scanResult.message}</Text>
                    <Text style={studentAttendanceStyles.resultText}>
                      Please go to the event location and try again.
                    </Text>
                  </>
                ) : scanResult?.error === 'LOCATION_INACCURATE' ? (
                  <>
                    <Text style={studentAttendanceStyles.errorTitle}><Icon name="map-marker" size={16} color="#1e6dffff" /> Location Unclear</Text>
                    <Text style={studentAttendanceStyles.resultText}>{scanResult.message}</Text>
                    <Text style={studentAttendanceStyles.resultText}>
                      Accuracy: {scanResult.accuracy?.toFixed(0)}m
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={studentAttendanceStyles.errorTitle}>Attendance Failed</Text>
                    <Text style={studentAttendanceStyles.resultText}>{scanResult?.message}</Text>
                  </>
                )}

                {scanResult?.event && (
                  <View style={studentAttendanceStyles.eventInfo}>
                    <Text style={studentAttendanceStyles.eventName}>{scanResult.event.title}</Text>
                    <Text style={studentAttendanceStyles.eventDetails}><Icon name="map-marker" size={16} color="#1e6dffff" /> {scanResult.event.location}</Text>

                    {scanResult.event.date && isValidDate(scanResult.event.date) && (
                      <Text style={studentAttendanceStyles.eventDetails}>
                        <Icon name="calendar" size={16} color="#000000ff" /> {formatDate(scanResult.event.date)}
                      </Text>
                    )}
                  </View>
                )}
              </>
            )}

            <TouchableOpacity style={studentAttendanceStyles.okButton} onPress={resetScanner}>
              <Text style={studentAttendanceStyles.okButtonText}>
                {scanResult?.success ? 'Great!' : 'Try Again'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
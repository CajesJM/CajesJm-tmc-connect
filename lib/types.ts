// lib/types.ts
export type Announcement = {
  id: string;
  title: string;
  body: string;
  location?: string;
  startsAt?: string;
  endsAt?: string;
  createdBy?: string;
  createdAt: string;
};

// Location Types
export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface EventLocation {
  latitude: number;
  longitude: number;
  radius: number; // in meters
  address?: string;
}

// Attendance Types
export interface AttendanceRecord {
  studentID: string;
  studentName: string;
  course: string;
  yearLevel: string;
  block: string;
  gender: string;
  timestamp: string;
  scannedAt: string;
  qrGeneratedAt?: string;
  qrExpiredAt?: string;
  usesManualExpiration?: boolean;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
    distance?: number;
    isWithinRadius?: boolean;
  };
}

// Event Types - Make all properties optional except id
export interface EventData {
  id: string;
  title?: string;
  description?: string;
  date?: string;
  location?: string;
  coordinates?: EventLocation;
  qrExpiration?: string;
  attendanceDeadline?: string;
  attendees?: AttendanceRecord[];
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// QR Code Types
export interface QRCodeData {
  type: 'attendance';
  eventId: string;
  eventTitle: string;
  timestamp: string;
  expiresAt: string;
  usesManualExpiration: boolean;
  eventLocation?: EventLocation;
}

// Validation Result Types - Make event partial
export interface ValidationResult {
  valid: boolean;
  error?: 
    | 'EVENT_NOT_FOUND'
    | 'QR_CODE_EXPIRED'
    | 'ATTENDANCE_DEADLINE_PASSED'
    | 'EVENT_NOT_STARTED'
    | 'ALREADY_ATTENDED'
    | 'LOCATION_MISMATCH'
    | 'LOCATION_INACCURATE'
    | 'VALIDATION_ERROR';
  message?: string;
  event?: Partial<EventData>; // Use Partial to make all properties optional
  expirationTime?: Date;
  distance?: number; // Make this optional
  allowedRadius?: number;
  accuracy?: number;
  locationVerified?: boolean;
  qrData?: QRCodeData;
}

// Student Types
export interface Student {
  id: string;
  studentID: string;
  name: string;
  email: string;
  course: string;
  yearLevel: string;
  block: string;
  gender: string;
  createdAt?: string;
}

// User Data Type for Auth Context
export interface UserData {
  id: string;
  studentID?: string;
  name?: string;
  email?: string;
  course?: string;
  yearLevel?: string;
  block?: string;
  gender?: string;
  profilePhoto?: string;
  createdAt?: string;
}

// Missed Event Type for Profile
export interface MissedEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  attendanceDeadline?: string;
}

// Attendee Type
export interface Attendee {
  studentID: string;
}
export interface ApprovalRequest {
  id: string;
  type: 'announcement' | 'event' | 'attendance' | 'user';
  title: string;
  description: string;
  submittedBy: string;
  submittedByEmail: string;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  data: any; 
  reviewedBy?: string;
  reviewedAt?: Date;
  rejectionReason?: string;
}

export interface AnnouncementData {
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  targetAudience?: string[];
  attachments?: any[];
}

export interface EventData {
  title: string;
  description: string;
  date: Date;
  time: string;
  location: string;
  capacity?: number;
  image?: string;
}

export interface UserData {
  name: string;
  email: string;
  role: 'user' | 'admin' | 'event_coordinator';
  department?: string;
}

export interface AttendanceData {
  eventId: string;
  eventName: string;
  attendees: any[];
  date: Date;
}
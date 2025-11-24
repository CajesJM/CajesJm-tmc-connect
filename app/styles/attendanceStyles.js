import { Dimensions, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375;
const isLargeDevice = width > 414;

export const attendanceStyles = StyleSheet.create({
  header: {
  backgroundColor: '#4F46E5',
  padding: 20,
  borderBottomLeftRadius: 20,
  borderBottomRightRadius: 20,
  alignItems: 'center',
  marginBottom: 16,
},
headerIcon: {
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 8,
},
headerTitle: {
  fontSize: 20,
  fontWeight: '800',
  color: '#FFFFFF',
  marginBottom: 4,
  textAlign: 'center',
},
headerSubtitle: {
  fontSize: 12,
  color: 'rgba(255, 255, 255, 0.8)',
  textAlign: 'center',
  lineHeight: 16,
},

// Main Card
mainCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  padding: 20,
  marginHorizontal: 16,
  marginBottom: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 4,
  borderWidth: 1,
  borderColor: '#E5E7EB',
},

// Filter Section
filterSection: {
  marginBottom: 12,
},
filterChips: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 4,
},
filterChip: {
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 8,
  backgroundColor: '#F9FAFB',
  borderWidth: 1,
  borderColor: '#E5E7EB',
},
filterChipActive: {
  backgroundColor: '#4F46E5',
  borderColor: '#4F46E5',
},
filterChipText: {
  fontSize: 12,
  fontWeight: '600',
  color: '#6B7280',
},
filterChipTextActive: {
  color: '#FFFFFF',
},

// Modal Header
modalHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16,
},
closeButton: {
  padding: 4,
},

// Empty State
emptyState: {
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 40,
},

// Update existing styles to be more compact:
qrContainer: {
  alignItems: 'center',
  marginTop: 12,
  backgroundColor: '#F8FAFF',
  borderRadius: 12,
  padding: 16,
  borderWidth: 1,
  borderColor: '#E0E7FF',
},
eventName: {
  fontSize: 16,
  fontWeight: '700',
  color: '#1E40AF',
  marginBottom: 4,
  textAlign: 'center',
},
eventDate: {
  fontSize: 12,
  color: '#64748B',
  marginBottom: 4,
},
eventLocation: {
  fontSize: 13,
  color: '#4F46E5',
  marginBottom: 8,
  textAlign: 'center',
},

// Make buttons more compact
buttonContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 16,
  gap: 8,
},
button: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 10,
  paddingVertical: 12,
  paddingHorizontal: 16,
  gap: 6,
},
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    padding: isSmallDevice ? 16 : 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: isSmallDevice ? 22 : 24,
    fontWeight: 'bold',
    marginBottom: isSmallDevice ? 16 : 20,
    color: '#1E293B',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: isSmallDevice ? 16 : 20,
    borderRadius: 12,
    marginBottom: isSmallDevice ? 16 : 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  cardTitle: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: '700',
    marginBottom: isSmallDevice ? 16 : 20,
    color: '#1E293B',
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: isSmallDevice ? 16 : 20,
  },
  label: {
    fontSize: isSmallDevice ? 14 : 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  input: {
    backgroundColor: '#F9FAFB',
    padding: isSmallDevice ? 10 : 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  inputText: {
    fontSize: isSmallDevice ? 14 : 16,
    color: '#111827',
    fontWeight: '500',
  },
  placeholderText: {
    color: '#9CA3AF',
    fontSize: isSmallDevice ? 14 : 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: isSmallDevice ? 16 : 20,
    padding: isSmallDevice ? 12 : 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    width: '100%',
  },
  eventName: {
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: '700',
    marginBottom: 6,
    color: '#111827',
    textAlign: 'center',
  },
  eventDate: {
    fontSize: isSmallDevice ? 12 : 14,
    color: '#6B7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  eventLocation: {
    fontSize: isSmallDevice ? 12 : 14,
    color: '#6B7280',
    marginBottom: isSmallDevice ? 12 : 16,
    textAlign: 'center',
  },
  eventId: {
    fontSize: isSmallDevice ? 10 : 12,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  codeHint: {
    fontSize: isSmallDevice ? 12 : 14,
    color: '#6B7280',
    marginTop: isSmallDevice ? 12 : 16,
    marginBottom: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  placeholderQR: {
    width: isSmallDevice ? 180 : 200,
    height: isSmallDevice ? 180 : 200,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: isSmallDevice ? 16 : 20,
    borderWidth: 2.5,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    padding: isSmallDevice ? 16 : 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: isSmallDevice ? 8 : 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  button: {
    paddingVertical: isSmallDevice ? 10 : 12,
    paddingHorizontal: isSmallDevice ? 16 : 20,
    borderRadius: 10,
    minWidth: isSmallDevice ? 100 : 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  refreshButton: {
    backgroundColor: '#059669',
  },
  clearButton: {
    backgroundColor: '#DC2626',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: isSmallDevice ? 14 : 16,
  },
  // Attendance Records
  attendanceContainer: {
    width: '100%',
    marginTop: isSmallDevice ? 16 : 20,
  },
  attendanceHeader: {
    marginBottom: isSmallDevice ? 12 : 16,
  },
  attendanceTitle: {
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: '700',
    marginBottom: isSmallDevice ? 12 : 16,
    color: '#111827',
    textAlign: 'center',
  },
  filterContainer: {
    marginBottom: isSmallDevice ? 8 : 12,
  },
  filterContainerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  filterLabel: {
    fontSize: isSmallDevice ? 12 : 14,
    fontWeight: '600',
    color: '#374151',
    marginRight: isSmallDevice ? 8 : 12,
    minWidth: isSmallDevice ? 60 : 70,
  },
  filterButton: {
    paddingHorizontal: isSmallDevice ? 12 : 16,
    paddingVertical: isSmallDevice ? 6 : 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: isSmallDevice ? 6 : 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterButtonText: {
    fontSize: isSmallDevice ? 12 : 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  blocksContainer: {
    width: '100%',
  },
  blockSection: {
    marginBottom: isSmallDevice ? 20 : 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: isSmallDevice ? 12 : 16,
    borderLeftWidth: 5,
    borderLeftColor: '#2563EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: isSmallDevice ? 12 : 16,
    paddingBottom: isSmallDevice ? 8 : 12,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  blockTitle: {
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: '700',
    color: '#111827',
  },
  blockCount: {
    fontSize: isSmallDevice ? 12 : 14,
    color: '#6B7280',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: isSmallDevice ? 6 : 8,
    paddingVertical: isSmallDevice ? 2 : 4,
    borderRadius: 12,
    fontWeight: '600',
  },
  studentsList: {
    gap: isSmallDevice ? 8 : 12,
  },
  attendanceItem: {
    backgroundColor: '#FFFFFF',
    padding: isSmallDevice ? 10 : 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: isSmallDevice ? 4 : 6,
  },
  studentName: {
    fontSize: isSmallDevice ? 14 : 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  studentId: {
    fontSize: isSmallDevice ? 10 : 12,
    color: '#6B7280',
    fontWeight: '600',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: isSmallDevice ? 4 : 6,
    paddingVertical: isSmallDevice ? 1 : 2,
    borderRadius: 6,
  },
  studentDetails: {
    fontSize: isSmallDevice ? 12 : 14,
    color: '#6B7280',
    marginBottom: isSmallDevice ? 1 : 2,
    fontWeight: '500',
  },
  timestamp: {
    fontSize: isSmallDevice ? 10 : 12,
    color: '#9CA3AF',
    marginTop: isSmallDevice ? 2 : 4,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  noRecords: {
    alignItems: 'center',
    padding: isSmallDevice ? 32 : 40,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginTop: isSmallDevice ? 16 : 20,
  },
  noRecordsText: {
    fontSize: isSmallDevice ? 14 : 16,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  noAttendance: {
    alignItems: 'center',
    padding: isSmallDevice ? 16 : 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginTop: isSmallDevice ? 16 : 20,
  },
  noAttendanceText: {
    fontSize: isSmallDevice ? 14 : 16,
    color: '#6B7280',
    marginBottom: isSmallDevice ? 4 : 6,
    fontWeight: '600',
    textAlign: 'center',
  },
  noAttendanceSubtext: {
    fontSize: isSmallDevice ? 12 : 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '500',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: isSmallDevice ? 16 : 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    padding: isSmallDevice ? 20 : 24,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: '700',
    marginBottom: isSmallDevice ? 12 : 16,
    color: '#111827',
    textAlign: 'center',
  },
  loadingText: {
    textAlign: 'center',
    color: '#6B7280',
    marginVertical: isSmallDevice ? 16 : 24,
    fontSize: isSmallDevice ? 14 : 16,
    fontWeight: '500',
  },
  noEventsText: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginVertical: isSmallDevice ? 16 : 24,
    fontStyle: 'italic',
    fontSize: isSmallDevice ? 14 : 16,
    fontWeight: '500',
  },
  eventsList: {
    maxHeight: 300,
    marginBottom: isSmallDevice ? 12 : 16,
  },
  eventItem: {
    backgroundColor: '#F8FAFC',
    padding: isSmallDevice ? 12 : 16,
    borderRadius: 10,
    marginBottom: isSmallDevice ? 6 : 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  eventItemName: {
    fontSize: isSmallDevice ? 14 : 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: isSmallDevice ? 3 : 4,
  },
  eventItemDate: {
    fontSize: isSmallDevice ? 12 : 14,
    color: '#6B7280',
    marginBottom: isSmallDevice ? 3 : 4,
    fontWeight: '500',
  },
  eventItemLocation: {
    fontSize: isSmallDevice ? 12 : 14,
    color: '#6B7280',
    marginBottom: isSmallDevice ? 3 : 4,
    fontWeight: '500',
  },
  eventItemDescription: {
    fontSize: isSmallDevice ? 10 : 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  modalButton: {
    paddingVertical: isSmallDevice ? 10 : 12,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  modalButtonText: {
    fontSize: isSmallDevice ? 14 : 16,
    fontWeight: '600',
    color: '#374151',
  },
  // Validity Settings
  validitySettings: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  validityDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  validityOptions: {
    marginBottom: 16,
  },
  validityOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  validityOptionActive: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },
  validityOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  validityOptionTextActive: {
    color: '#FFFFFF',
  },
  customValidity: {
    marginTop: 8,
  },
  validityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginHorizontal: 8,
    position: 'relative',
  },
  sliderProgress: {
    height: 4,
    backgroundColor: '#1E88E5',
    borderRadius: 2,
    position: 'absolute',
  },
  sliderThumb: {
    width: 20,
    height: 20,
    backgroundColor: '#1E88E5',
    borderRadius: 10,
    position: 'absolute',
    top: -8,
  },
  sliderMin: {
    fontSize: 12,
    color: '#64748B',
  },
  sliderMax: {
    fontSize: 12,
    color: '#64748B',
  },

  // Expiration Info
  expiryInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  expiryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  expiryTime: {
    fontSize: 13,
    color: '#B45309',
    fontWeight: '600',
    marginBottom: 2,
  },
  expiryRemaining: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '500',
    marginBottom: 4,
  },
  expiryNote: {
    fontSize: 11,
    color: '#92400E',
    fontStyle: 'italic',
  },

  // Event Deadline Badge
  eventDeadlineBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginVertical: 4,
  },
  eventDeadlineText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
  },

  // QR Info in attendance records
  qrInfo: {
    fontSize: 11,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 2,
  },

  // Regenerate Button
  regenerateButton: {
    backgroundColor: '#10B981',
  },
  // QR Status Styles
  qrStatus: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  qrStatusActive: {
    backgroundColor: '#F0F9FF',
  },
  qrStatusExpired: {
    backgroundColor: '#FEF2F2',
  },
  qrStatusTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  qrStatusText: {
    fontSize: 14,
    marginBottom: 4,
  },
  qrStatusNote: {
    fontSize: 12,
    opacity: 0.8,
    fontStyle: 'italic',
  },

  // Expired QR Placeholder
  expiredQRPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginVertical: 16,
  },
  expiredQRText: {
    fontSize: 48,
    marginBottom: 8,
  },
  expiredQRTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 4,
  },
  expiredQRDescription: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },

  // Regenerate Button
  regenerateButton: {
    backgroundColor: '#10B981',
  },
  // Expiration Management Styles
  expirationManagement: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  managementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  managementButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  managementButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  setExpirationButton: {
    backgroundColor: '#3B82F6',
  },
  clearExpirationButton: {
    backgroundColor: '#EF4444',
  },
  managementButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  managementNote: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },

  // Event Expiration Badge
  eventExpirationBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginVertical: 4,
    alignSelf: 'flex-start',
  },
  eventExpirationText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
  },

  // Expiration Modal Styles
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
    textAlign: 'center',
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  quickOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  quickOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
  },
  quickOptionText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  inputHint: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  customInputContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  customInput: {
    fontSize: 14,
    color: '#1E293B',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    backgroundColor: '#10B981',
    flex: 1,
  },
  // Location Verification Styles
locationVerificationBadge: {
  backgroundColor: '#10B98120',
  padding: 12,
  borderRadius: 8,
  marginVertical: 0,
  flexDirection: 'row', 
  alignItems: 'center', 
},
locationVerificationText: {
  color: '#10B981',
  fontWeight: 'bold',
  fontSize: 14,
  marginLeft: 4, 
},
locationDetails: {
  color: '#065F46',
  fontSize: 12,
  marginTop: 4,
},
locationHint: {
  color: '#6366F1',
  fontSize: 12,
  textAlign: 'center',
  marginTop: 8,
  fontStyle: 'italic',
},
locationBadge: {
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 12,
  marginLeft: 8,
},
locationValid: {
  backgroundColor: '#10B98120',
  borderColor: '#10B981',
  borderWidth: 1,
  
},
locationInvalid: {
  backgroundColor: '#EF444420',
  borderColor: '#EF4444',
  borderWidth: 1,
},
locationBadgeText: {
  fontSize: 10,
  fontWeight: 'bold',
},
locationValidText: {
  color: '#10B981',
},
locationInvalidText: {
  color: '#EF4444',
},
locationDetailsContainer: {
  marginTop: 4,
  padding: 6,
  backgroundColor: '#F8FAFC',
  borderRadius: 6,
},
locationDetailsText: {
  fontSize: 12,
  color: '#64748B',
},
eventLocationBadge: {
  backgroundColor: '#10B98120',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 12,
  alignSelf: 'flex-start',
  marginTop: 4,
},
eventLocationBadgeText: {
  color: '#10B981',
  fontSize: 12,
  fontWeight: '600',
},
});


export const DEFAULT_BLOCKS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
export const DEFAULT_YEAR_LEVELS = ['1', '2', '3', '4'];
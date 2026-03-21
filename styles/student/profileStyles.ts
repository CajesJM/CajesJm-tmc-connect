import { Dimensions, Platform, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

export const profileStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingHorizontal: 16,
  },

  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '600',
    color: '#ffffff',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3b82f6',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  id: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  course: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 2,
  },
  yearLevel: {
    fontSize: 14,
    color: '#64748b',
  },

  // Section Containers
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginRight: 8,
  },
  eventsCount: {
    fontSize: 14,
    color: '#64748b',
  },

  // Missed Events
  loading: {
    marginVertical: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  eventsList: {
    gap: 12,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  eventIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  eventDate: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  deadlineText: {
    fontSize: 11,
    color: '#dc2626',
    fontWeight: '500',
  },
  moreEventsText: {
    fontSize: 13,
    color: '#3b82f6',
    marginTop: 8,
    textAlign: 'center',
  },

  // Quick Actions Menu
  menu: {
    marginTop: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
    marginLeft: 12,
  },

  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 150,
    borderWidth: 1,
    borderColor: '#fee2e2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#dc2626',
    marginLeft: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },

  aboutModal: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '100%',
    maxHeight: height * 0.8,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  aboutContent: {
    gap: 20,
  },
  aboutSection: {
    marginBottom: 16,
  },
  aboutDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  organizationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  membersList: {
    gap: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  memberAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  memberRole: {
    fontSize: 12,
    color: '#3b82f6',
    marginTop: 2,
  },
  memberEmail: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  submittedToCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  submittedToInfo: {
    flex: 1,
  },
  submittedToName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  submittedToDepartment: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  submittedToInstitution: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  versionSection: {
    alignItems: 'center',
    marginTop: 8,
  },
  versionText: {
    fontSize: 12,
    color: '#94a3b8',
  },

  // Image Options Modal
  imageOptions: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    marginBottom: 8,
  },
  optionText: {
    fontSize: 15,
    color: '#1e293b',
  },
  removeButton: {
    backgroundColor: '#fee2e2',
    marginTop: 4,
  },
  removeText: {
    color: '#dc2626',
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  tabContainer: {
  flexDirection: 'row',
  marginBottom: 16,
  backgroundColor: '#F3F4F6',
  borderRadius: 12,
  padding: 4,
},
tab: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 10,
  paddingHorizontal: 12,
  borderRadius: 8,
  gap: 6,
},
activeTab: {
  backgroundColor: '#FFFFFF',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
  elevation: 2,
},
tabText: {
  fontSize: 14,
  fontWeight: '600',
  color: '#6B7280',
},
activeTabText: {
  color: '#111827',
},
badge: {
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 12,
  marginLeft: 4,
},
badgeText: {
  fontSize: 12,
  fontWeight: '700',
},
attendedEventItem: {
  borderLeftWidth: 3,
  borderLeftColor: '#10B981',
},
scannedAtText: {
  fontSize: 12,
  color: '#10B981',
  marginTop: 4,
  fontWeight: '500',
},
emptyStateSubtext: {
  fontSize: 14,
  color: '#9CA3AF',
  marginTop: 8,
  textAlign: 'center',
},
  // Penalty Badge on Profile Card
  penaltyBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  penaltyBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Menu Badge
  menuIconContainer: {
    position: 'relative',
  },
  menuBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Modal Subtitle
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },

  // Penalty Card Styles
  penaltyCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  penaltyCardOverdue: {
    borderLeftColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  penaltyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  penaltyEventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  penaltyType: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  penaltySection: {
    marginBottom: 12,
  },
  penaltyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  penaltyConsequences: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  deadlineTextOverdue: {
    color: '#DC2626',
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusCompleted: {
    backgroundColor: '#D1FAE5',
  },
  statusExcused: {
    backgroundColor: '#E0E7FF',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  penaltyActions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  penaltyActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
  },
  completeBtn: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  completeBtnText: {
    color: '#10B981',
    fontWeight: '600',
    fontSize: 13,
  },
  excuseBtn: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  excuseBtnText: {
    color: '#F59E0B',
    fontWeight: '600',
    fontSize: 13,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 16,
    marginBottom: 8,
  },
  penaltyStatusBadge: {
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 12,
  marginLeft: 8,
},
penaltyStatusText: {
  fontSize: 10,
  fontWeight: '600',
},
});
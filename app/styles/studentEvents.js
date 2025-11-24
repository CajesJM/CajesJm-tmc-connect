import { Dimensions, StyleSheet } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const COLORS = {
  primary: '#4F46E5',
  primaryLight: '#6366F1',
  secondary: '#6B7280',
  background: '#F0F4F8',
  cardBg: '#FFFFFF',
  textDark: '#111827',
  textMedium: '#374151',
  textLight: '#6B7280',
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#DC2626',
  info: '#3B82F6',
  shadow: '#000000',
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header Styles
  header: {
    backgroundColor: COLORS.primary,
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

  // Stats Container
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Filter Section
  filterSection: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChips: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMedium,
    marginLeft: 4,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },

  // Results Info
  resultsInfo: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  resultsText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '500',
  },

  // List Content
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  // Event Card
  eventCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  pastEventCard: {
    opacity: 0.8,
  },
  eventImageContainer: {
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: 140,
  },
  eventBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  todayBadge: {
    backgroundColor: '#DC2626',
  },
  tomorrowBadge: {
    backgroundColor: '#F59E0B',
  },
  upcomingBadge: {
    backgroundColor: '#10B981',
  },
  pastBadge: {
    backgroundColor: '#6B7280',
  },
  eventBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  eventContent: {
    padding: 16,
  },
  eventHeader: {
    marginBottom: 8,
  },
  eventMeta: {
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 2,
  },
  eventDate: {
    fontSize: 11,
    color: COLORS.textMedium,
    fontWeight: '500',
  },
  pastEventDate: {
    color: COLORS.textLight,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 6,
    lineHeight: 20,
  },
  eventDescription: {
    fontSize: 13,
    color: COLORS.textMedium,
    lineHeight: 18,
    marginBottom: 8,
  },
  locationDescription: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 8,
  },

  // Coordinates Section
  coordinatesSection: {
    marginBottom: 8,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verificationBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#065F46',
    marginLeft: 4,
  },
  mapButton: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  mapButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapButtonText: {
    flex: 1,
    marginLeft: 8,
  },
  mapButtonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 2,
  },
  mapButtonSubtitle: {
    fontSize: 11,
    color: COLORS.textLight,
  },

  // Event Stats
  eventStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  eventStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventOrganizer: {
    fontSize: 11,
    color: COLORS.textLight,
    marginLeft: 4,
  },
  attendeeCount: {
    fontSize: 11,
    color: COLORS.textLight,
    marginLeft: 4,
  },

  // Past Event Badge
  pastEventBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pastEventText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textLight,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  eventInfo: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  eventInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  eventInfoLocation: {
    fontSize: 14,
    color: COLORS.textMedium,
    marginBottom: 8,
  },
  coordinatesInfo: {
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  coordinatesText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0369A1',
    marginBottom: 4,
  },
  coordinatesHint: {
    fontSize: 12,
    color: '#6B7280',
  },
  mapOptionButton: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mapOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapOptionText: {
    flex: 1,
    marginLeft: 12,
  },
  mapOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 2,
  },
  mapOptionSubtitle: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  mapInstructions: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  instructionText: {
    fontSize: 13,
    color: COLORS.textMedium,
    marginLeft: 8,
    flex: 1,
  },
  instructionBold: {
    fontWeight: '600',
    color: COLORS.textDark,
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textLight,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyStateTitle: {
    fontSize: 18,
    color: COLORS.textDark,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
});
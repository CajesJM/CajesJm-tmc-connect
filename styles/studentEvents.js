import { Dimensions, StyleSheet } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const isSmallScreen = screenWidth < 375;

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
    padding: isSmallScreen ? 12 : 16,
    borderBottomLeftRadius: isSmallScreen ? 12 : 16,
    borderBottomRightRadius: isSmallScreen ? 12 : 16,
    alignItems: 'center',
    marginBottom: isSmallScreen ? 12 : 16,
  },
  headerIcon: {
    width: isSmallScreen ? 36 : 40,
    height: isSmallScreen ? 36 : 40,
    borderRadius: isSmallScreen ? 18 : 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: isSmallScreen ? 4 : 6,
  },
  headerTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: isSmallScreen ? 2 : 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: isSmallScreen ? 10 : 11,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: isSmallScreen ? 14 : 16,
  },

  // Stats Container
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: isSmallScreen ? 12 : 16,
    marginBottom: isSmallScreen ? 12 : 16,
    gap: isSmallScreen ? 6 : 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: isSmallScreen ? 8 : 12,
    padding: isSmallScreen ? 8 : 12,
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
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: isSmallScreen ? 9 : 10,
    fontWeight: '600',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Filter Section
  filterSection: {
    backgroundColor: COLORS.cardBg,
    borderRadius: isSmallScreen ? 8 : 12,
    padding: isSmallScreen ? 12 : 16,
    marginHorizontal: isSmallScreen ? 12 : 16,
    marginBottom: isSmallScreen ? 8 : 12,
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
    gap: isSmallScreen ? 6 : 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isSmallScreen ? 10 : 12,
    paddingVertical: isSmallScreen ? 6 : 8,
    borderRadius: isSmallScreen ? 6 : 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: isSmallScreen ? 11 : 12,
    fontWeight: '600',
    color: COLORS.textMedium,
    marginLeft: 4,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },

  // Results Info
  resultsInfo: {
    paddingHorizontal: isSmallScreen ? 12 : 16,
    marginBottom: isSmallScreen ? 6 : 8,
  },
  resultsText: {
    fontSize: isSmallScreen ? 11 : 12,
    color: COLORS.textLight,
    fontWeight: '500',
  },

  // List Content
  listContent: {
    paddingHorizontal: isSmallScreen ? 12 : 16,
    paddingBottom: isSmallScreen ? 16 : 20,
  },

  // Event Card
  eventCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: isSmallScreen ? 8 : 12,
    marginBottom: isSmallScreen ? 8 : 12,
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
    height: isSmallScreen ? 120 : 140,
  },
  eventBadge: {
    position: 'absolute',
    top: isSmallScreen ? 8 : 12,
    right: isSmallScreen ? 8 : 12,
    paddingHorizontal: isSmallScreen ? 6 : 8,
    paddingVertical: isSmallScreen ? 3 : 4,
    borderRadius: isSmallScreen ? 4 : 6,
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
    fontSize: isSmallScreen ? 9 : 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  eventContent: {
    padding: isSmallScreen ? 12 : 16,
  },
  eventHeader: {
    marginBottom: isSmallScreen ? 6 : 8,
  },
  eventMeta: {
    marginBottom: isSmallScreen ? 3 : 4,
  },
  eventLocation: {
    fontSize: isSmallScreen ? 11 : 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 2,
  },
  eventDate: {
    fontSize: isSmallScreen ? 10 : 11,
    color: COLORS.textMedium,
    fontWeight: '500',
  },
  pastEventDate: {
    color: COLORS.textLight,
  },
  eventTitle: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: isSmallScreen ? 4 : 6,
    lineHeight: isSmallScreen ? 18 : 20,
  },
  eventDescription: {
    fontSize: isSmallScreen ? 12 : 13,
    color: COLORS.textMedium,
    lineHeight: isSmallScreen ? 16 : 18,
    marginBottom: isSmallScreen ? 6 : 8,
  },
  locationDescription: {
    fontSize: isSmallScreen ? 11 : 12,
    color: COLORS.textLight,
    marginBottom: isSmallScreen ? 6 : 8,
  },

  // Coordinates Section
  coordinatesSection: {
    marginBottom: isSmallScreen ? 6 : 8,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: isSmallScreen ? 6 : 8,
    paddingVertical: isSmallScreen ? 3 : 4,
    borderRadius: isSmallScreen ? 4 : 6,
    alignSelf: 'flex-start',
    marginBottom: isSmallScreen ? 6 : 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verificationBadgeText: {
    fontSize: isSmallScreen ? 9 : 10,
    fontWeight: '600',
    color: '#065F46',
    marginLeft: 4,
  },
  mapButton: {
    backgroundColor: '#F8FAFC',
    borderRadius: isSmallScreen ? 6 : 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: isSmallScreen ? 10 : 12,
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
    fontSize: isSmallScreen ? 13 : 14,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 2,
  },
  mapButtonSubtitle: {
    fontSize: isSmallScreen ? 10 : 11,
    color: COLORS.textLight,
  },

  // Event Stats
  eventStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: isSmallScreen ? 6 : 8,
  },
  eventStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventOrganizer: {
    fontSize: isSmallScreen ? 10 : 11,
    color: COLORS.textLight,
    marginLeft: 4,
  },
  attendeeCount: {
    fontSize: isSmallScreen ? 10 : 11,
    color: COLORS.textLight,
    marginLeft: 4,
  },

  // Past Event Badge
  pastEventBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: isSmallScreen ? 6 : 8,
    paddingVertical: isSmallScreen ? 3 : 4,
    borderRadius: isSmallScreen ? 4 : 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pastEventText: {
    fontSize: isSmallScreen ? 9 : 10,
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
    padding: isSmallScreen ? 12 : 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
  },
  modalTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: isSmallScreen ? 12 : 16,
  },
  eventInfo: {
    backgroundColor: COLORS.cardBg,
    borderRadius: isSmallScreen ? 8 : 12,
    padding: isSmallScreen ? 12 : 16,
    marginBottom: isSmallScreen ? 12 : 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  eventInfoTitle: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  eventInfoLocation: {
    fontSize: isSmallScreen ? 13 : 14,
    color: COLORS.textMedium,
    marginBottom: isSmallScreen ? 6 : 8,
  },
  coordinatesInfo: {
    backgroundColor: '#F0F9FF',
    padding: isSmallScreen ? 10 : 12,
    borderRadius: isSmallScreen ? 6 : 8,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  coordinatesText: {
    fontSize: isSmallScreen ? 12 : 13,
    fontWeight: '600',
    color: '#0369A1',
    marginBottom: 4,
  },
  coordinatesHint: {
    fontSize: isSmallScreen ? 11 : 12,
    color: '#6B7280',
  },
  mapOptionButton: {
    backgroundColor: COLORS.cardBg,
    borderRadius: isSmallScreen ? 8 : 12,
    padding: isSmallScreen ? 12 : 16,
    marginBottom: isSmallScreen ? 12 : 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mapOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapOptionText: {
    flex: 1,
    marginLeft: isSmallScreen ? 10 : 12,
  },
  mapOptionTitle: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 2,
  },
  mapOptionSubtitle: {
    fontSize: isSmallScreen ? 12 : 13,
    color: COLORS.textLight,
  },
  mapInstructions: {
    backgroundColor: '#F9FAFB',
    borderRadius: isSmallScreen ? 8 : 12,
    padding: isSmallScreen ? 12 : 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  instructionsTitle: {
    fontSize: isSmallScreen ? 13 : 14,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: isSmallScreen ? 6 : 8,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: isSmallScreen ? 4 : 6,
  },
  instructionText: {
    fontSize: isSmallScreen ? 12 : 13,
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
    fontSize: isSmallScreen ? 13 : 14,
    fontWeight: '500',
    color: COLORS.textLight,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isSmallScreen ? 40 : 60,
    paddingHorizontal: isSmallScreen ? 16 : 20,
  },
  emptyStateIcon: {
    marginBottom: isSmallScreen ? 12 : 16,
    opacity: 0.5,
  },
  emptyStateTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    color: COLORS.textDark,
    fontWeight: '700',
    marginBottom: isSmallScreen ? 6 : 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: isSmallScreen ? 13 : 14,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: isSmallScreen ? 18 : 20,
  },
});
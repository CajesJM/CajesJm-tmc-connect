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

export const StudentAnnouncementStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

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
  filterTitle: {
    fontSize: isSmallScreen ? 12 : 13,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: isSmallScreen ? 6 : 8,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: isSmallScreen ? 4 : 6,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isSmallScreen ? 10 : 12,
    paddingVertical: isSmallScreen ? 5 : 6,
    borderRadius: isSmallScreen ? 6 : 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 4,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterIcon: {
    marginRight: 4,
  },
  filterChipText: {
    fontSize: isSmallScreen ? 11 : 12,
    fontWeight: '600',
    color: COLORS.textMedium,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },

  resultsInfo: {
    paddingHorizontal: isSmallScreen ? 12 : 16,
    marginBottom: isSmallScreen ? 6 : 8,
  },
  resultsText: {
    fontSize: isSmallScreen ? 11 : 12,
    color: COLORS.textLight,
    fontWeight: '500',
  },

  listContent: {
    paddingHorizontal: isSmallScreen ? 12 : 16,
    paddingBottom: isSmallScreen ? 16 : 20,
  },

  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: isSmallScreen ? 8 : 12,
    padding: isSmallScreen ? 12 : 16,
    marginBottom: isSmallScreen ? 8 : 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  urgentCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
    backgroundColor: '#FEF2F2',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: isSmallScreen ? 4 : 6,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: isSmallScreen ? 6 : 8,
  },
  urgentIcon: {
    marginRight: 6,
    marginTop: 1,
  },
  cardTitle: {
    fontSize: isSmallScreen ? 13 : 14,
    fontWeight: '700',
    color: COLORS.textDark,
    flex: 1,
    lineHeight: isSmallScreen ? 16 : 18,
  },
  urgentTitle: {
    color: COLORS.error,
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  cardMessage: {
    fontSize: isSmallScreen ? 12 : 13,
    color: COLORS.textMedium,
    lineHeight: isSmallScreen ? 16 : 18,
    marginBottom: isSmallScreen ? 6 : 8,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: isSmallScreen ? 10 : 11,
    fontWeight: '500',
    color: COLORS.textLight,
    marginLeft: 4,
  },

  newBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: isSmallScreen ? 5 : 6,
    paddingVertical: isSmallScreen ? 1 : 2,
    borderRadius: isSmallScreen ? 3 : 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  newBadgeText: {
    color: '#065F46',
    fontSize: isSmallScreen ? 8 : 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 8,
    fontSize: isSmallScreen ? 13 : 14,
    fontWeight: '500',
    color: COLORS.textLight,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isSmallScreen ? 30 : 40,
    paddingHorizontal: isSmallScreen ? 16 : 20,
  },
  emptyStateIcon: {
    marginBottom: isSmallScreen ? 8 : 12,
    opacity: 0.5,
  },
  emptyStateText: {
    fontSize: isSmallScreen ? 14 : 16,
    color: COLORS.textDark,
    fontWeight: '700',
    marginBottom: isSmallScreen ? 4 : 6,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: isSmallScreen ? 12 : 13,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: isSmallScreen ? 16 : 18,
  },
});
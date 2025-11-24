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
  filterTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
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
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMedium,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },

  resultsInfo: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  resultsText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '500',
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  urgentCard: {
    borderLeftColor: COLORS.error,
    backgroundColor: '#FEF2F2',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: 8,
  },
  urgentIcon: {
    marginRight: 6,
    marginTop: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    flex: 1,
    lineHeight: 18,
  },
  urgentTitle: {
    color: COLORS.error,
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  cardMessage: {
    fontSize: 13,
    color: COLORS.textMedium,
    lineHeight: 18,
    marginBottom: 8,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textLight,
    marginLeft: 4,
  },

  newBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  newBadgeText: {
    color: '#065F46',
    fontSize: 9,
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
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textLight,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    marginBottom: 12,
    opacity: 0.5,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.textDark,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
});
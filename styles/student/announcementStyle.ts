import { Dimensions, Platform, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

export const studentAnnouncementStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },

  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingHorizontal: 16,
    paddingBottom: 5,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 2,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  role: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileFallback: {
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: -20,
  },
  dateText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },

  statsContainer: {
    marginTop: 5,
    marginHorizontal: 16,
    marginBottom: 5,
  },
  statsScroll: {
    gap: 10,
    paddingVertical: 4,
    paddingRight: 16,
  },
  statCard: {
    width: width * 0.22,
    minWidth: 80,
    maxWidth: 100,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },

  // Search
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 10,
    color: '#1e293b',
    paddingVertical: 4,
  },
  searchClear: {
    padding: 1,
  },

  // Filters
  filterSection: {
    marginBottom: 5,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  filterChipText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },

  // List
  listContainer: {
    padding: 16,
    paddingTop: 0,
    gap: 5,
    paddingBottom: 20,
  },

  // Cards
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPriorityBar: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    padding: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    flexShrink: 1,
    marginRight: 8,
  },
  cardTime: {
    fontSize: 11,
    color: '#94a3b8',
  },
  priorityDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardMessage: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginTop: 4,
  },

  // Badges
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },

  // Results Info
  resultsInfo: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  resultsText: {
    fontSize: 12,
    color: '#64748b',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },

  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    marginTop: 8,
  },

  // Pagination
  paginationWrapper: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 100, 
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    gap: 4,
  },
  paginationButtonDisabled: {
    backgroundColor: '#f1f5f9',
    opacity: 0.5,
  },
  paginationText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0f172a',
  },
  paginationTextDisabled: {
    color: '#cbd5e1',
  },
  paginationPageInfo: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },

  // Detail Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  detailModalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
    minHeight: height * 0.5,
  },
  detailModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailPriorityIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
  },
  detailModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  detailModalClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailModalContent: {
    padding: 20,
  },
  detailBadges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  detailBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  detailBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
    lineHeight: 26,
  },
  detailMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailMetaText: {
    fontSize: 13,
    color: '#64748b',
  },
  detailMessageContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  detailMessage: {
    fontSize: 15,
    color: '#1e293b',
    lineHeight: 24,
  },
});
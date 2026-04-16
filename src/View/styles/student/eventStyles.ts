import { StyleSheet } from 'react-native'
import { ThemeColors } from '../../../Controller/context/ThemeContext'

export const createEventStyles = (
  colors: ThemeColors,
  isDark: boolean,
  isMobile: boolean,
  isTablet: boolean,
  isDesktop: boolean
) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingTop: isMobile ? 40 : 48,
      paddingBottom: isMobile ? 20 : 24,
      paddingHorizontal: isMobile ? 16 : 24,
      borderBottomLeftRadius: isMobile ? 24 : 32,
      borderBottomRightRadius: isMobile ? 24 : 32,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: isMobile ? 16 : 20,
    },
    greeting: {
      fontSize: isMobile ? 12 : 14,
      color: colors.sidebar.text.muted,
      marginBottom: 2,
    },
    userName: {
      fontSize: isMobile ? 20 : 24,
      fontWeight: '700',
      color: '#ffffff', // keep white on gradient
      marginBottom: 2,
    },
    role: {
      fontSize: isMobile ? 12 : 14,
      color: colors.sidebar.text.muted,
      fontWeight: '500',
    },
    profileButton: {
      width: isMobile ? 44 : 48,
      height: isMobile ? 44 : 48,
      borderRadius: isMobile ? 22 : 24,
      borderWidth: 2,
      borderColor: '#ffffff',
      overflow: 'hidden',
    },
    profileImage: {
      width: '100%',
      height: '100%',
    },
    profileFallback: {
      backgroundColor: colors.accent.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    profileInitials: {
      color: '#ffffff',
      fontSize: isMobile ? 16 : 18,
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
      gap: 4,
      paddingHorizontal: isMobile ? 8 : 10,
      paddingVertical: isMobile ? 4 : 6,
      marginTop: -20,
      marginLeft: -6,
    },
    dateText: {
      fontSize: isMobile ? 10 : 12,
      color: '#ffffff',
      fontWeight: '500',
    },

    // Stats section
    statsContainer: {
      marginTop: -20,
      marginHorizontal: isMobile ? 16 : 24,
      marginBottom: isMobile ? 16 : 20,
    },
    statsScroll: {
      gap: isMobile ? 8 : 12,
      paddingVertical: 4,
      paddingRight: isMobile ? 8 : 12,
    },
    statCard: {
      width: isMobile ? 90 : 100,
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: isMobile ? 12 : 14,
      borderLeftWidth: 3,
      borderLeftColor: colors.accent.primary,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 8,
      elevation: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statIcon: {
      width: isMobile ? 28 : 32,
      height: isMobile ? 28 : 32,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    statNumber: {
      fontSize: isMobile ? 16 : 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: isMobile ? 10 : 12,
      color: colors.sidebar.text.secondary,
      fontWeight: '500',
    },

    // Search
    searchSection: {
      paddingHorizontal: isMobile ? 16 : 24,
      marginBottom: isMobile ? 12 : 16,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: isMobile ? 6 : 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      marginLeft: 10,
      fontSize: isMobile ? 12 : 14,
      color: colors.text,
      paddingVertical: isMobile ? 6 : 8,
    },
    searchClear: {
      padding: 4,
    },

    // Filters
    filterSection: {
      marginBottom: isMobile ? 12 : 16,
    },
    filterScroll: {
      paddingHorizontal: isMobile ? 16 : 24,
      gap: 8,
    },
    filterChip: {
      paddingHorizontal: isMobile ? 12 : 16,
      paddingVertical: isMobile ? 6 : 8,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterChipActive: {
      backgroundColor: colors.accent.primary,
      borderColor: colors.accent.primary,
    },
    filterChipText: {
      fontSize: isMobile ? 11 : 13,
      color: colors.sidebar.text.secondary,
      fontWeight: '500',
    },
    filterChipTextActive: {
      color: '#ffffff',
      fontWeight: '600',
    },

    // List
    listContainer: {
      padding: isMobile ? 16 : 24,
      paddingTop: 0,
      gap: isMobile ? 8 : 12,
      paddingBottom: 20,
    },
    resultsInfo: {
      paddingHorizontal: isMobile ? 16 : 24,
      marginBottom: 8,
    },
    resultsText: {
      fontSize: isMobile ? 11 : 13,
      color: colors.sidebar.text.secondary,
    },

    // Event Card
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      flexDirection: 'row',
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 8,
      elevation: 2,
      marginBottom: 4,
    },
    cardPast: {
      opacity: 0.7,
    },
    cardLeft: {
      width: isMobile ? 80 : 100,
      height: isMobile ? 80 : 100,
    },
    cardImage: {
      width: '100%',
      height: '100%',
    },
    cardContent: {
      flex: 1,
      padding: isMobile ? 12 : 16,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    cardTitle: {
      fontSize: isMobile ? 14 : 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
      marginRight: 8,
    },
    cardBadges: {
      flexDirection: 'row',
      gap: 4,
    },
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
    cardInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 4,
    },
    cardInfoText: {
      fontSize: isMobile ? 10 : 12,
      color: colors.sidebar.text.secondary,
      flex: 1,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    cardDescription: {
      fontSize: isMobile ? 11 : 13,
      color: colors.sidebar.text.secondary,
      lineHeight: 16,
      flex: 1,
      marginRight: 8,
    },
    cardMapButton: {
      width: isMobile ? 28 : 32,
      height: isMobile ? 28 : 32,
      borderRadius: 8,
      backgroundColor: isDark ? colors.border : '#f1f5f9',
      justifyContent: 'center',
      alignItems: 'center',
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
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    emptyStateTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.sidebar.text.secondary,
      marginBottom: 8,
    },
    emptyStateText: {
      fontSize: 14,
      color: colors.sidebar.text.muted,
      textAlign: 'center',
    },

    // Modal Overlay
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '90%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    modalIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: `${colors.accent.primary}15`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    modalSubtitle: {
      fontSize: 13,
      color: colors.sidebar.text.secondary,
    },
    modalClose: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      padding: 20,
    },

    // Detail Modal
    detailModalContainer: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '85%',
    },
    detailModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
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
      color: colors.text,
    },
    detailModalClose: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    detailModalContent: {
      padding: 20,
    },
    detailImage: {
      width: '100%',
      height: isMobile ? 150 : 180,
      borderRadius: 16,
      marginBottom: 16,
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
      fontSize: isMobile ? 18 : 22,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
      lineHeight: 26,
    },
    detailMeta: {
      marginBottom: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 8,
    },
    detailMetaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    detailMetaText: {
      fontSize: 13,
      color: colors.sidebar.text.secondary,
      flex: 1,
    },
    detailSection: {
      marginBottom: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    detailSectionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    detailSectionText: {
      fontSize: 14,
      color: colors.sidebar.text.secondary,
      lineHeight: 20,
    },
    detailActions: {
      gap: 10,
      marginBottom: 20,
    },
    detailCloseButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.border,
      paddingVertical: 14,
      borderRadius: 12,
    },
    detailCloseButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.sidebar.text.secondary,
    },

    // Range UI
    rangeTrack: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      marginBottom: 4,
    },
    rangeFill: {
      height: '100%',
      backgroundColor: colors.accent.primary,
      borderRadius: 4,
    },
    rangeTrackText: {
      fontSize: 11,
      color: colors.sidebar.text.muted,
      textAlign: 'right',
    },
    detailActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: isDark ? colors.card : '#f8fafc',
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    detailActionButtonText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.text,
    },
    rangeStatusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    rangeStatusText: {
      color: '#ffffff',
      fontSize: 11,
      fontWeight: '600',
    },

    // Map Options Modal
    eventInfo: {
      marginBottom: 20,
    },
    eventInfoTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    eventInfoLocation: {
      fontSize: 14,
      color: colors.sidebar.text.secondary,
      marginBottom: 4,
    },
    coordinatesInfo: {
      backgroundColor: colors.border,
      padding: 12,
      borderRadius: 8,
      marginTop: 8,
    },
    coordinatesText: {
      fontSize: 13,
      color: colors.text,
      fontWeight: '500',
    },
    coordinatesHint: {
      fontSize: 11,
      color: colors.sidebar.text.muted,
      marginTop: 4,
    },
    mapOptionButton: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
    },
    mapOptionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    mapOptionText: {
      flex: 1,
    },
    mapOptionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    mapOptionSubtitle: {
      fontSize: 12,
      color: colors.sidebar.text.secondary,
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
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.05,
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
      backgroundColor: colors.border,
      gap: 4,
    },
    paginationButtonDisabled: {
      opacity: 0.5,
    },
    paginationText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.text,
    },
    paginationTextDisabled: {
      color: colors.sidebar.text.muted,
    },
    paginationPageInfo: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },

    // Misc
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: colors.sidebar.text.secondary,
    },
    attendanceBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: 4,
      gap: 4,
    },
    attendedBadge: {
      backgroundColor: '#10b981',
    },
    missedBadge: {
      backgroundColor: '#ef4444',
    },
    attendanceBadgeText: {
      color: '#fff',
      fontSize: 9,
      fontWeight: '700',
    },
    cardImageContainer: {
      position: 'relative',
    },
    cardNumberContainer: {
      position: 'absolute',
      top: isMobile ? 6 : 8,
      left: isMobile ? 6 : 8,
      zIndex: 10,
    },
    cardNumberBadge: {
      width: isMobile ? 24 : 28,
      height: isMobile ? 24 : 28,
      borderRadius: isMobile ? 12 : 14,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    cardNumberText: {
      fontSize: isMobile ? 10 : 12,
      fontWeight: 'bold',
      color: '#fff',
    },
  })
}

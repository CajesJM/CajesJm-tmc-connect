import { Dimensions, Platform, StyleSheet } from 'react-native'
import { ThemeColors } from '../../../Controller/context/ThemeContext'

const { width, height } = Dimensions.get('window')

export const createAssistantAnnouncementStyles = (
  colors: ThemeColors,
  isDark: boolean,
  isMobile: boolean,
  isTablet: boolean,
  isDesktop: boolean
) => {
  const cardWidth = isMobile ? width - 32 : isTablet ? width - 64 : width - 96
  const statCardWidth = isMobile ? width * 0.22 : isTablet ? 100 : 110
  const headerPaddingTop = Platform.OS === 'ios' ? 50 : 40

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingTop: headerPaddingTop,
      paddingHorizontal: isMobile ? 16 : 24,
      paddingBottom: isMobile ? 20 : 24,
      borderBottomLeftRadius: isMobile ? 24 : 32,
      borderBottomRightRadius: isMobile ? 24 : 32,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    greeting: {
      fontSize: isMobile ? 12 : 13,
      color: colors.sidebar.text.muted,
      marginBottom: 2,
    },
    userName: {
      fontSize: isMobile ? 20 : 22,
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: 2,
    },
    role: {
      fontSize: isMobile ? 11 : 12,
      color: colors.sidebar.text.muted,
      fontWeight: '500',
    },
    profileButton: {
      width: isMobile ? 44 : 48,
      height: isMobile ? 44 : 48,
      borderRadius: isMobile ? 22 : 24,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.2)',
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
      backgroundColor: 'rgba(255,255,255,0.1)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
      marginTop: -20,
    },
    dateText: {
      fontSize: isMobile ? 10 : 12,
      color: '#e2e8f0',
      fontWeight: '500',
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.accent.primary,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      marginTop: -20,
    },
    addButtonText: {
      color: '#ffffff',
      fontSize: isMobile ? 12 : 13,
      fontWeight: '600',
    },

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
      width: statCardWidth,
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
      fontSize: isMobile ? 15 : 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: isMobile ? 10 : 11,
      color: colors.sidebar.text.secondary,
      fontWeight: '500',
    },

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

    listContainer: {
      padding: isMobile ? 16 : 24,
      paddingTop: 0,
      gap: isMobile ? 8 : 12,
      paddingBottom: 20,
    },

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
    },
    cardPriorityBar: {
      width: 4,
    },
    cardContent: {
      flex: 1,
      padding: isMobile ? 12 : 16,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    cardHeaderRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    cardTitle: {
      fontSize: isMobile ? 14 : 16,
      fontWeight: '600',
      color: colors.text,
      flexShrink: 1,
      marginRight: 8,
    },
    cardTime: {
      fontSize: isMobile ? 10 : 12,
      color: colors.sidebar.text.muted,
    },
    priorityDotSmall: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    cardActionsRow: {
      flexDirection: 'row',
      gap: 4,
    },
    cardActionButtonSmall: {
      width: 24,
      height: 24,
      borderRadius: 6,
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardActionButtonDangerSmall: {
      backgroundColor: isDark ? '#4a0e0e' : '#fef2f2',
    },
    cardMessage: {
      fontSize: isMobile ? 12 : 14,
      color: colors.sidebar.text.secondary,
      lineHeight: 18,
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

    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: height * 0.9,
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

    formGroup: {
      marginBottom: 20,
    },
    formLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    priorityContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    priorityButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.border,
      borderWidth: 1,
      borderColor: colors.border,
    },
    priorityButtonActive: {
      borderWidth: 2,
    },
    priorityDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    priorityButtonText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.sidebar.text.secondary,
    },
    priorityButtonTextActive: {
      color: colors.text,
      fontWeight: '600',
    },
    formInput: {
      backgroundColor: colors.border,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
      color: colors.text,
    },
    formTextArea: {
      height: 120,
      textAlignVertical: 'top',
    },
    characterCount: {
      fontSize: 11,
      color: colors.sidebar.text.muted,
      textAlign: 'right',
      marginTop: 4,
    },
    formActions: {
      gap: 12,
      marginTop: 8,
      marginBottom: 20,
    },
    submitButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.accent.primary,
      paddingVertical: 14,
      borderRadius: 12,
    },
    submitButtonDisabled: {
      backgroundColor: colors.sidebar.text.muted,
      opacity: 0.5,
    },
    submitButtonText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '600',
    },
    cancelButton: {
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: colors.border,
    },
    cancelButtonText: {
      color: colors.sidebar.text.secondary,
      fontSize: 15,
      fontWeight: '600',
    },

    detailModalContainer: {
      backgroundColor: colors.card,
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
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
      marginBottom: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    detailMetaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexShrink: 1,
    },
    detailMetaText: {
      fontSize: 13,
      color: colors.sidebar.text.secondary,
      flexShrink: 1,
    },
    detailMessageContainer: {
      backgroundColor: colors.border,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    detailMessage: {
      fontSize: isMobile ? 14 : 16,
      color: colors.text,
      lineHeight: 24,
    },
    detailActions: {
      gap: 10,
    },
    detailEditButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: `${colors.accent.primary}15`,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    detailEditButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.accent.primary,
    },
    detailDeleteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: `${colors.error || '#ef4444'}15`,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    detailDeleteButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.error || '#ef4444',
    },

    paginationWrapper: {
      paddingVertical: 16,
      paddingHorizontal: isMobile ? 16 : 24,
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
    cardAbsoluteBar: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: isMobile ? 30 : 60,
      borderTopLeftRadius: 16,
      borderBottomLeftRadius: 16,
    },
    resultsInfo: {
      paddingHorizontal: isMobile ? 16 : 24,
      marginBottom: 8,
    },
    resultsText: {
      fontSize: isMobile ? 11 : 13,
      color: colors.sidebar.text.secondary,
    },
    cardNumber: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardNumberText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },
    cardNumberContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardNumberBadge: {
      width: isMobile ? 24 : 28,
      height: isMobile ? 24 : 28,
      borderRadius: isMobile ? 12 : 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
  })
}

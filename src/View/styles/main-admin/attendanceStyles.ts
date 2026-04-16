import { StyleSheet } from 'react-native'
import { ThemeColors } from '../../../Controller/context/ThemeContext'

export const createAttendanceStyles = (
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
    mainScrollView: {
      flex: 1,
    },
    mainScrollContent: {
      flexGrow: 1,
    },
    mainContent: {
      flex: 1,
      flexDirection: isMobile ? 'column' : 'row',
      padding: isMobile ? 15 : 20,
      gap: 20,
    },

    headerGradient: {
      paddingTop: isMobile ? 15 : 20,
      paddingBottom: isMobile ? 8 : 12,
      paddingHorizontal: isMobile ? 16 : 24,
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: isMobile ? 12 : 16,
    },
    greetingText: {
      fontSize: isMobile ? 11 : 13,
      fontWeight: '500',
      letterSpacing: 0.3,
      color: colors.sidebar.text.muted,
      opacity: 0.75,
      marginBottom: 2,
    },
    userName: {
      fontSize: isMobile ? 20 : 26,
      fontWeight: '800',
      letterSpacing: -0.8,
      color: '#ffffff',
      marginBottom: 2,
    },
    roleText: {
      fontSize: isMobile ? 10 : 12,
      fontWeight: '500',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: colors.sidebar.text.muted,
      opacity: 0.6,
      marginLeft: -4,
    },
    profileButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 2.5,
      borderColor: 'rgba(255,255,255,0.7)',
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
    },
    profileImage: {
      width: '100%',
      height: '100%',
    },
    profileFallback: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    profileInitials: {
      color: '#ffffff',
      fontSize: isMobile ? 16 : 18,
      fontWeight: '600',
    },
    dateSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 0,
    },
    dateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: isMobile ? 6 : 8,
      paddingVertical: isMobile ? 4 : 6,
      marginLeft: 0,
      marginTop: 0,
    },
    dateText: {
      fontSize: isMobile ? 10 : 12,
      fontWeight: '500',
      letterSpacing: 0.2,
      color: '#ffffff',
      marginLeft: -8,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 12,
    },
    headerAction: {
      width: isMobile ? 36 : 40,
      height: isMobile ? 36 : 40,
      borderRadius: isMobile ? 18 : 20,
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Grid Layouts
    leftGrid: {
      flex: isMobile ? undefined : 3,
      width: isMobile ? '100%' : undefined,
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 8,
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: isMobile ? 15 : 0,
    },
    rightGrid: {
      flex: isMobile ? undefined : 3,
      width: isMobile ? '100%' : undefined,
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 8,
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },

    // Headers
    leftHeader: {
      marginBottom: isMobile ? 12 : 16,
      paddingHorizontal: 4,
    },
    leftTitle: {
      fontSize: isMobile ? 16 : 18,
      fontWeight: '700',
      color: colors.text,
    },
    rightHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: isMobile ? 15 : 20,
    },
    rightTitle: {
      fontSize: isMobile ? 16 : 18,
      fontWeight: '700',
      color: colors.text,
    },
    recordCount: {
      fontSize: isMobile ? 11 : 12,
      color: colors.sidebar.text.secondary,
      backgroundColor: isDark ? colors.border : '#f1f5f9',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: 4,
    },
    refreshButton: {
      width: isMobile ? 36 : 40,
      height: isMobile ? 36 : 40,
      borderRadius: isMobile ? 18 : 20,
      backgroundColor: isDark ? colors.border : '#f1f5f9',
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Sections
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: isMobile ? 12 : 14,
      fontWeight: '600',
      color: colors.sidebar.text.secondary,
      marginBottom: isMobile ? 6 : 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },

    // Event Selector
    eventSelector: {
      backgroundColor: isDark ? colors.card : '#f8fafc',
      borderRadius: 16,
      padding: isMobile ? 12 : 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    eventSelectorText: {
      flex: 1,
      fontSize: isMobile ? 14 : 16,
      color: colors.text,
      fontWeight: '500',
    },
    eventSelectorPlaceholder: {
      flex: 1,
      fontSize: isMobile ? 14 : 16,
      color: colors.sidebar.text.muted,
    },
    eventSelectorIcon: {
      marginLeft: 8,
      color: colors.sidebar.text.secondary,
    },

    // QR Container
    qrContainer: {
      alignItems: 'center',
      padding: isMobile ? 16 : 20,
      backgroundColor: isDark ? colors.card : '#f8fafc',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 16,
      marginBottom: 16,
    },
    eventInfo: {
      width: '100%',
      marginBottom: 20,
      alignItems: 'center',
    },
    eventName: {
      fontSize: isMobile ? 18 : 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    eventDetailText: {
      fontSize: isMobile ? 13 : 14,
      color: colors.sidebar.text.secondary,
      marginLeft: 6,
    },

    // Status Badges (keep semantic colors)
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginTop: 12,
    },
    statusBadgeActive: {
      backgroundColor: '#dcfce7',
      borderWidth: 1,
      borderColor: '#86efac',
    },
    statusBadgeExpired: {
      backgroundColor: '#fee2e2',
      borderWidth: 1,
      borderColor: '#fca5a5',
    },
    statusBadgeText: {
      fontSize: isMobile ? 11 : 12,
      fontWeight: '600',
      marginLeft: 6,
    },
    statusBadgeTextActive: {
      color: '#16a34a',
    },
    statusBadgeTextExpired: {
      color: '#dc2626',
    },

    // Location Verification Badge
    locationVerificationBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#dcfce7',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      marginTop: 8,
    },
    locationVerificationText: {
      fontSize: isMobile ? 10 : 11,
      color: '#16a34a',
      marginLeft: 4,
      fontWeight: '500',
    },

    // QR Code
    qrCodeContainer: {
      marginVertical: 20,
      padding: 10,
      backgroundColor: colors.card,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },

    qrHint: {
      fontSize: isMobile ? 11 : 12,
      color: colors.sidebar.text.muted,
      textAlign: 'center',
      marginTop: 4,
    },
    // Expired State
    expiredText: {
      fontSize: isMobile ? 14 : 16,
      fontWeight: '600',
      color: '#dc2626',
      textAlign: 'center',
    },
    expiredSubtext: {
      fontSize: isMobile ? 13 : 14,
      color: colors.sidebar.text.muted,
      textAlign: 'center',
      marginTop: 4,
    },
    downloadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.accent.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 30,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    downloadButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#ffffff',
    },
    // Action Buttons
    actionButtons: {
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? 8 : 12,
    },
    actionButton: {
      flex: isMobile ? undefined : 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: isMobile ? 12 : 14,
      borderRadius: 16,
    },
    actionButtonPrimary: {
      backgroundColor: colors.accent.primary,
    },
    actionButtonDanger: {
      backgroundColor: '#ef4444',
    },
    actionButtonSecondary: {
      backgroundColor: isDark ? colors.border : '#f1f5f9',
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionButtonText: {
      fontSize: isMobile ? 13 : 14,
      fontWeight: '600',
    },
    actionButtonTextPrimary: {
      color: '#ffffff',
    },
    actionButtonTextSecondary: {
      color: colors.sidebar.text.secondary,
    },

    // Filters
    filtersContainer: {
      marginBottom: 20,
    },
    filterLabel: {
      fontSize: isMobile ? 11 : 12,
      fontWeight: '600',
      color: colors.sidebar.text.secondary,
      marginBottom: isMobile ? 6 : 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    filterRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
    },
    filterChip: {
      paddingHorizontal: isMobile ? 12 : 16,
      paddingVertical: isMobile ? 6 : 8,
      borderRadius: 20,
      backgroundColor: isDark ? colors.border : '#f1f5f9',
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterChipActive: {
      backgroundColor: colors.accent.primary,
      borderColor: colors.accent.primary,
    },
    filterChipText: {
      fontSize: isMobile ? 11 : 12,
      fontWeight: '600',
      color: colors.sidebar.text.secondary,
    },
    filterChipTextActive: {
      color: '#ffffff',
    },

    // Attendance List
    attendanceListContainer: {
      flex: 1,
      minHeight: 200,
    },
    attendanceListContent: {
      paddingBottom: 8,
    },
    blockSection: {
      marginBottom: 16,
    },
    blockHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    blockTitle: {
      fontSize: isMobile ? 14 : 16,
      fontWeight: '600',
      color: colors.text,
    },
    blockCount: {
      fontSize: isMobile ? 11 : 12,
      color: colors.sidebar.text.secondary,
      backgroundColor: isDark ? colors.border : '#f1f5f9',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    attendanceItem: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: isMobile ? 10 : 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    studentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    studentInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    studentName: {
      fontSize: isMobile ? 13 : 14,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    studentId: {
      fontSize: isMobile ? 11 : 12,
      color: colors.sidebar.text.muted,
    },
    studentDetails: {
      fontSize: isMobile ? 11 : 12,
      color: colors.sidebar.text.secondary,
      marginBottom: 4,
    },
    timestamp: {
      fontSize: isMobile ? 10 : 11,
      color: colors.sidebar.text.muted,
    },

    // Location Badges (semantic)
    locationBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginLeft: 8,
    },
    locationBadgeValid: {
      backgroundColor: '#dcfce7',
    },
    locationBadgeInvalid: {
      backgroundColor: '#fee2e2',
    },
    locationBadgeText: {
      fontSize: 10,
      fontWeight: '600',
      marginLeft: 4,
    },
    locationBadgeTextValid: {
      color: '#16a34a',
    },
    locationBadgeTextInvalid: {
      color: '#dc2626',
    },

    // Event Item (in modal)
    eventItem: {
      padding: isMobile ? 12 : 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    eventItemContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    eventItemName: {
      fontSize: isMobile ? 14 : 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    eventItemBadges: {
      flexDirection: 'row',
      gap: 6,
    },
    eventItemDate: {
      fontSize: isMobile ? 12 : 13,
      color: colors.sidebar.text.secondary,
      marginBottom: 4,
    },
    eventItemFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    eventItemLocation: {
      fontSize: isMobile ? 11 : 12,
      color: colors.sidebar.text.secondary,
      flex: 1,
    },
    eventItemExpBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fffbeb',
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 12,
    },
    eventItemExpBadgeExpired: {
      backgroundColor: '#fee2e2',
    },
    eventItemExpText: {
      fontSize: 10,
      fontWeight: '500',
      color: '#d97706',
      marginLeft: 4,
    },
    eventItemExpTextExpired: {
      color: '#dc2626',
    },
    eventItemActiveBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#dcfce7',
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 12,
    },
    eventItemActiveText: {
      fontSize: 10,
      fontWeight: '500',
      color: '#16a34a',
      marginLeft: 4,
    },
    eventItemLocBadge: {
      backgroundColor: '#dcfce7',
      padding: 4,
      borderRadius: 12,
      marginLeft: 8,
    },
    eventItemStatusBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginRight: 6,
    },
    eventItemStatusText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#ffffff',
    },

    // Empty State
    emptyState: {
      alignItems: 'center',
      paddingVertical: isMobile ? 30 : 48,
    },
    emptyStateIcon: {
      width: isMobile ? 60 : 80,
      height: isMobile ? 60 : 80,
      borderRadius: isMobile ? 30 : 40,
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    emptyStateTitle: {
      fontSize: isMobile ? 14 : 16,
      fontWeight: '600',
      color: colors.sidebar.text.secondary,
      marginBottom: isMobile ? 6 : 8,
      textAlign: 'center',
    },
    emptyStateText: {
      fontSize: isMobile ? 12 : 14,
      color: colors.sidebar.text.muted,
      textAlign: 'center',
      maxWidth: 300,
    },

    // Loading
    loadingContainer: {
      padding: 24,
      alignItems: 'center',
    },
    loadingText: {
      fontSize: isMobile ? 12 : 14,
      color: colors.sidebar.text.secondary,
      marginTop: 8,
    },

    modernModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modernModalContainer: {
      width: '100%',
      maxWidth: 500,
      maxHeight: '80%',
      backgroundColor: colors.card,
      borderRadius: 24,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 10,
    },
    expirationModalContainer: {
      width: isMobile ? '95%' : '150%',
      maxWidth: isMobile ? 450 : 800,
      maxHeight: isMobile ? '90%' : '85%',
      backgroundColor: colors.card,
      borderRadius: 24,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 10,
    },
    expirationModalContent: {
      padding: isMobile ? 18 : 24,
      maxHeight: isMobile ? 450 : 500,
    },
    modernModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: isMobile ? 15 : 20,
      paddingVertical: isMobile ? 12 : 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modernModalHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: isMobile ? 8 : 12,
    },
    modernModalIconContainer: {
      width: isMobile ? 32 : 40,
      height: isMobile ? 32 : 40,
      borderRadius: 12,
      backgroundColor: `${colors.accent.primary}15`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modernModalTitleContainer: {
      gap: 2,
    },
    modernModalTitle: {
      fontSize: isMobile ? 16 : 18,
      fontWeight: '700',
      color: colors.text,
    },
    modernModalSubtitle: {
      fontSize: isMobile ? 10 : 12,
      color: colors.sidebar.text.secondary,
    },
    modernModalCloseButton: {
      width: isMobile ? 32 : 36,
      height: isMobile ? 32 : 36,
      borderRadius: isMobile ? 16 : 18,
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modernModalContent: {
      padding: isMobile ? 15 : 20,
      maxHeight: isMobile ? 350 : 600,
    },

    // Modern Form Elements
    modernFormLabel: {
      fontSize: isMobile ? 13 : 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: isMobile ? 6 : 8,
      marginLeft: 4,
    },
    modernFormInput: {
      backgroundColor: isDark ? colors.card : '#f8fafc',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: isMobile ? 12 : 14,
      fontSize: isMobile ? 13 : 14,
      color: colors.text,
      marginBottom: 12,
    },
    modernFormActions: {
      flexDirection: 'row',
      gap: isMobile ? 8 : 12,
      marginTop: isMobile ? 20 : 24,
    },
    modernSubmitButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.accent.primary,
      paddingVertical: isMobile ? 12 : 14,
      borderRadius: 16,
    },
    modernSubmitButtonDisabled: {
      backgroundColor: colors.sidebar.text.muted,
    },
    modernSubmitButtonText: {
      color: '#ffffff',
      fontSize: isMobile ? 14 : 16,
      fontWeight: '600',
    },
    modernCancelButton: {
      flex: 1,
      backgroundColor: colors.border,
      paddingVertical: isMobile ? 12 : 14,
      borderRadius: 16,
      alignItems: 'center',
    },
    modernCancelButtonText: {
      color: colors.sidebar.text.secondary,
      fontSize: isMobile ? 14 : 16,
      fontWeight: '600',
    },

    // Expiration Options
    expirationOptions: {
      marginBottom: 20,
    },
    expirationOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: isMobile ? 12 : 16,
      backgroundColor: isDark ? colors.border : '#f1f5f9',
      borderRadius: 12,
      marginBottom: 8,
    },
    expirationOptionActive: {
      backgroundColor: colors.accent.primary,
      borderColor: colors.accent.primary,
    },
    expirationOptionText: {
      fontSize: isMobile ? 13 : 14,
      fontWeight: '600',
      color: colors.text,
    },
    expirationOptionTextActive: {
      color: '#ffffff',
    },

    // Expiration Badge
    expirationBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fffbeb',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginTop: 8,
    },
    expirationBadgeText: {
      fontSize: isMobile ? 10 : 11,
      color: '#d97706',
      marginLeft: 4,
    },

    // Pagination
    paginationContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: isMobile ? 12 : 16,
      paddingTop: 16,
      marginTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    paginationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: isMobile ? 8 : 12,
      paddingVertical: isMobile ? 6 : 8,
      borderRadius: 20,
      backgroundColor: isDark ? colors.card : '#f8fafc',
      borderWidth: 1,
      borderColor: colors.border,
      gap: 4,
    },
    paginationButtonDisabled: {
      opacity: 0.5,
    },
    paginationButtonText: {
      fontSize: isMobile ? 11 : 12,
      fontWeight: '600',
      color: colors.accent.primary,
    },
    paginationButtonTextDisabled: {
      color: colors.sidebar.text.muted,
    },
    pageInfo: {
      alignItems: 'center',
    },
    pageInfoText: {
      fontSize: isMobile ? 12 : 14,
      fontWeight: '600',
      color: colors.text,
    },

    // Event Status Breakdown
    eventStatusBreakdown: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 8,
      gap: 6,
    },
    eventStatusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    eventStatusBadgeText: {
      fontSize: isMobile ? 10 : 11,
      fontWeight: '600',
    },

    // Modern Location Button (for expiration)
    modernLocationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? colors.card : '#f8fafc',
      borderRadius: 16,
      padding: isMobile ? 12 : 16,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
      marginBottom: 16,
    },
    modernLocationButtonText: {
      flex: 1,
    },
    modernLocationButtonTitle: {
      fontSize: isMobile ? 13 : 14,
      fontWeight: '600',
      color: colors.text,
    },
    modernLocationButtonSubtitle: {
      fontSize: isMobile ? 11 : 12,
      color: colors.sidebar.text.muted,
      marginTop: 2,
    },

    // Mode Toggle
    modeToggleContainer: {
      flexDirection: 'row',
      backgroundColor: isDark ? colors.border : '#f1f5f9',
      borderRadius: 30,
      padding: 4,
      marginBottom: 16,
    },
    modeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: isMobile ? 6 : 8,
      borderRadius: 30,
    },
    modeButtonActive: {
      backgroundColor: colors.accent.primary,
    },
    modeButtonText: {
      fontSize: isMobile ? 12 : 14,
      fontWeight: '600',
      color: colors.sidebar.text.secondary,
    },
    modeButtonTextActive: {
      color: '#ffffff',
    },

    // Receipt Container
    receiptContainer: {
      padding: isMobile ? 12 : 16,
      backgroundColor: isDark ? colors.card : '#f8fafc',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    receiptHeader: {
      marginBottom: 16,
    },
    receiptTitle: {
      fontSize: isMobile ? 16 : 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    receiptDate: {
      fontSize: isMobile ? 13 : 14,
      color: colors.sidebar.text.secondary,
    },
    receiptStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 16,
    },
    receiptStatItem: {
      alignItems: 'center',
    },
    receiptStatLabel: {
      fontSize: isMobile ? 11 : 12,
      color: colors.sidebar.text.secondary,
      marginBottom: 4,
    },
    receiptStatValue: {
      fontSize: isMobile ? 20 : 24,
      fontWeight: '700',
      color: colors.accent.primary,
    },
    generateReceiptButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.accent.primary,
      paddingVertical: isMobile ? 12 : 14,
      borderRadius: 12,
    },
    generateReceiptText: {
      color: '#ffffff',
      fontSize: isMobile ? 14 : 16,
      fontWeight: '600',
    },

    // Missing student items
    missingStudentItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    missingListContent: {
      paddingBottom: 8,
    },
    studentBlock: {
      fontSize: isMobile ? 11 : 12,
      color: colors.accent.primary,
      fontWeight: '500',
      marginRight: 10,
    },

    // No event message
    noEventMessage: {
      alignItems: 'center',
      padding: 24,
    },
    noEventText: {
      fontSize: isMobile ? 13 : 14,
      color: colors.sidebar.text.muted,
      textAlign: 'center',
      marginTop: 8,
    },

    // Search
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? colors.card : '#f1f5f9',
      borderRadius: 12,
      paddingHorizontal: isMobile ? 8 : 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      paddingVertical: isMobile ? 8 : 12,
      paddingHorizontal: 8,
      fontSize: isMobile ? 13 : 14,
      color: colors.text,
    },
    searchClearButton: {
      padding: 4,
    },

    qrFrame: {
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 12,
      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
      borderRadius: 24,
      padding: 16,
    },
    qrCodeWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    qrLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      gap: 6,
    },
    qrLabelText: {
      fontSize: 12,
      color: colors.sidebar.text.secondary,
    },
    expiredOverlay: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    eventDetailsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 4,
    },
    bullet: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.sidebar.text.muted,
      marginHorizontal: 4,
    },
    qrStatus: {
      alignItems: 'center',
      marginTop: 0,
      marginBottom: 8,
    },
    downloadButtonContainer: {
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 8,
    },
    expirationHint: {
      fontSize: 12,
      color: colors.sidebar.text.secondary,
      textAlign: 'center',
      marginTop: 4,
      marginBottom: 8,
    },
    instructionBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
      borderRadius: 12,
      padding: 12,
      marginTop: 8,
    },
    instructionText: {
      flex: 1,
      fontSize: 12,
      lineHeight: 16,
      color: colors.sidebar.text.secondary,
    },

    // Attendance meta
    attendanceMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    attendanceTimeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 6,
      gap: 6,
    },
    attendanceTimeText: {
      fontSize: isMobile ? 11 : 12,
      color: colors.sidebar.text.secondary,
      fontWeight: '500',
    },
    paidButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#16a34a',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },

    paidButtonDisabled: {
      backgroundColor: '#6b7280',
      opacity: 0.6,
    },
    penaltySentBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    awaitingPenaltyBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      opacity: 0.7,
    },
    // Glassmorphism Modal
    glassModalOverlay: {
      flex: 1,
      backgroundColor: isDark
        ? 'rgba(15, 23, 42, 0.75)'
        : 'rgba(15, 23, 42, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: isMobile ? 16 : 24,
    },
    glassModalContent: {
      width: '100%',
      maxWidth: 520,
      backgroundColor: isDark
        ? 'rgba(255, 255, 255, 0.09)'
        : 'rgba(255, 255, 255, 0.85)',
      borderWidth: 1,
      borderColor: isDark
        ? 'rgba(255, 255, 255, 0.18)'
        : 'rgba(255, 255, 255, 0.6)',
      borderRadius: 28,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: isDark ? 0.4 : 0.15,
      shadowRadius: 30,
      elevation: 20,
    },
    glassModalContentMobile: {
      maxWidth: '100%',
      borderRadius: 24,
    },
    glassModalTitleMobile: {
      fontSize: 17,
    },
    glassModalClose: {
      padding: 4,
    },
    glassModalBody: {
      padding: isMobile ? 20 : 28,
    },
    glassDetailTitle: {
      fontSize: isDesktop ? 26 : isTablet ? 24 : 22,
      fontWeight: '700',
      lineHeight: 30,
      marginBottom: 16,
      marginTop: 8,
    },
    glassDetailTitleMobile: {
      fontSize: 20,
      lineHeight: 26,
    },

    glassModalOverlayTouch: {
      flex: 1,
    },
    glassModalCentered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    glassModalContainer: {
      width: '100%',
      maxWidth: 500,
      maxHeight: '85%',
      borderRadius: 28,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 15,
    },
    glassModalGradientHeader: {
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      overflow: 'hidden',
    },
    glassModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    glassModalHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    glassModalIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(59,130,246,0.15)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    glassModalIconContainerMobile: {
      width: 32,
      height: 32,
    },
    glassModalTitle: {
      fontSize: 20,
      fontWeight: '700',
      letterSpacing: -0.5,
      color: colors.text,
    },
    glassModalSubtitle: {
      fontSize: 13,
      marginTop: 2,
      color: colors.sidebar.text.secondary,
    },
    glassModalCloseButton: {
      padding: 4,
    },
    glassModalScrollContent: {
      paddingBottom: 20,
    },
    glassModalFormSection: {
      marginHorizontal: 16,
      marginVertical: 12,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
      overflow: 'hidden',
      backgroundColor: 'transparent',
    },
    glassFormGroup: {
      marginHorizontal: 16,
      marginTop: 16,
    },
    glassFormLabel: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
      color: colors.text,
    },
    glassPriorityContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    glassPriorityContainerMobile: {
      gap: 8,
    },
    glassPriorityButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 40,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
      backgroundColor: 'rgba(255,255,255,0.05)',
    },
    glassPriorityButtonMobile: {
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    glassPriorityIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 8,
    },
    glassPriorityButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.sidebar.text.secondary,
    },
    glassPriorityButtonTextMobile: {
      fontSize: 12,
    },
    glassFormInput: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    glassFormInputMobile: {
      fontSize: 14,
      paddingVertical: 10,
    },
    glassTextArea: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    glassFormActions: {
      flexDirection: 'row',
      gap: 12,
      marginHorizontal: 16,
      marginTop: 24,
      marginBottom: 16,
    },
    glassFormActionsMobile: {
      flexDirection: 'column',
      gap: 10,
    },
    glassSubmitButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.accent.primary,
      paddingVertical: 12,
      borderRadius: 40,
      shadowColor: colors.accent.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    glassSubmitButtonMobile: {
      paddingVertical: 10,
    },
    glassSubmitButtonDisabled: {
      opacity: 0.5,
    },
    glassSubmitButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
    glassSubmitButtonTextMobile: {
      fontSize: 14,
    },
    glassCancelButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 40,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
    glassCancelButtonMobile: {
      paddingVertical: 10,
    },
    glassCancelButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.sidebar.text.secondary,
    },
    glassCancelButtonTextMobile: {
      fontSize: 14,
    },

    // Additional mobile-specific styles (to support existing isMobile conditionals)
    headerGradientMobile: {
      paddingTop: 10,
      paddingBottom: 5,
      paddingHorizontal: 15,
    },
    headerContentMobile: { marginBottom: 15 },
    greetingTextMobile: { fontSize: 12 },
    userNameMobile: { fontSize: 20 },
    roleTextMobile: { fontSize: 10 },
    profileButtonMobile: { width: 40, height: 40, borderRadius: 20 },
    profileInitialsMobile: { fontSize: 16 },
    dateSectionMobile: { marginTop: -5 },
    dateContainerMobile: {
      marginLeft: -5,
      marginTop: -15,
      paddingHorizontal: 5,
      paddingVertical: 4,
    },
    dateTextMobile: { fontSize: 9 },
    headerActionMobile: { width: 36, height: 36, borderRadius: 18 },
    statsGridMobile: { gap: 10, padding: 15, marginTop: -15 },
    statCardMobile: { padding: 12, minWidth: '30%' },
    statIconContainerMobile: {
      width: 36,
      height: 36,
      borderRadius: 10,
      marginBottom: 8,
    },
    statNumberMobile: { fontSize: 22 },
    statLabelMobile: { fontSize: 10 },
    mainContentMobile: { flexDirection: 'column', padding: 15, gap: 15 },
    leftGridMobile: { flex: undefined, width: '100%', marginBottom: 15 },
    rightGridMobile: { flex: undefined, width: '100%' },
    leftHeaderMobile: { marginBottom: 12 },
    leftTitleMobile: { fontSize: 16 },
    rightHeaderMobile: { marginBottom: 15 },
    rightTitleMobile: { fontSize: 16 },
    refreshButtonMobile: { width: 36, height: 36, borderRadius: 18 },
    sectionTitleMobile: { fontSize: 12, marginBottom: 6 },
    eventSelectorMobile: { padding: 12 },
    eventSelectorTextMobile: { fontSize: 14 },
    qrContainerMobile: { padding: 16 },
    eventNameMobile: { fontSize: 18 },
    actionButtonsMobile: { flexDirection: 'column', gap: 8 },
    actionButtonMobile: { paddingVertical: 12 },
    actionButtonTextMobile: { fontSize: 13 },
    filterLabelMobile: { fontSize: 11, marginBottom: 6 },
    filterChipMobile: { paddingHorizontal: 12, paddingVertical: 6 },
    filterChipTextMobile: { fontSize: 11 },
    attendanceItemMobile: { padding: 10 },
    studentNameMobile: { fontSize: 13 },
    eventItemMobile: { padding: 12 },
    eventItemNameMobile: { fontSize: 14 },
    emptyStateMobile: { paddingVertical: 32 },
    emptyStateIconMobile: {
      width: 60,
      height: 60,
      borderRadius: 30,
      marginBottom: 12,
    },
    emptyStateTitleMobile: { fontSize: 14, marginBottom: 6 },
    emptyStateTextMobile: { fontSize: 12, maxWidth: 250 },
    loadingTextMobile: { fontSize: 12 },
    modernModalContainerMobile: { width: '95%', maxWidth: 400 },
    modernModalHeaderMobile: { paddingHorizontal: 15, paddingVertical: 12 },
    modernModalHeaderLeftMobile: { gap: 8 },
    modernModalIconContainerMobile: { width: 32, height: 32, borderRadius: 10 },
    modernModalTitleMobile: { fontSize: 16 },
    modernModalSubtitleMobile: { fontSize: 10 },
    modernModalCloseButtonMobile: { width: 32, height: 32, borderRadius: 16 },
    modernModalContentMobile: { padding: 15, maxHeight: 350 },
    modernFormLabelMobile: { fontSize: 13, marginBottom: 6 },
    modernFormInputMobile: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 13,
    },
    modernFormActionsMobile: { gap: 8, marginTop: 20 },
    modernSubmitButtonMobile: { paddingVertical: 12 },
    modernSubmitButtonTextMobile: { fontSize: 14 },
    modernCancelButtonMobile: { paddingVertical: 12 },
    modernCancelButtonTextMobile: { fontSize: 14 },
    expirationModalContainerMobile: {
      width: '95%',
      maxWidth: 450,
      maxHeight: '90%',
    },
    expirationModalContentMobile: { padding: 18, maxHeight: 450 },
    expirationOptionMobile: { padding: 12 },
    expirationOptionTextMobile: { fontSize: 13 },
    paginationContainerMobile: { gap: 12, paddingTop: 12 },
    paginationButtonMobile: { paddingHorizontal: 8, paddingVertical: 6 },
    pageInfoTextMobile: { fontSize: 12 },
    searchContainerMobile: { paddingHorizontal: 8 },
    searchInputMobile: { paddingVertical: 8, fontSize: 13 },
  })
}

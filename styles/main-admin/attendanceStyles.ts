import { StyleSheet } from 'react-native';

export const attendanceStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    mainScrollView: {
        flex: 1,
    },
    mainScrollContent: {
        flexGrow: 1,
    },
    mainContent: {
        flex: 1,
        flexDirection: 'row',
        padding: 20,
        gap: 20,
    },
    mainContentMobile: {
        flexDirection: 'column',
        padding: 15,
        gap: 15,
    },

    headerGradient: {
        paddingTop: 15,
        paddingBottom: 8,
        paddingHorizontal: 20,
    },
    headerGradientMobile: {
        paddingTop: 10,
        paddingBottom: 5,
        paddingHorizontal: 15,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerContentMobile: {
        marginBottom: 15,
    },
    greetingText: {
        fontSize: 14,
        color: '#94a3b8',
        marginBottom: 4,
    },
    greetingTextMobile: {
        fontSize: 12,
    },
    userName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 2,
    },
    userNameMobile: {
        fontSize: 20,
    },
    roleText: {
        fontSize: 12,
        color: '#94a3b8',
    },
    roleTextMobile: {
        fontSize: 10,
    },
    profileButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#ffffff',
        overflow: 'hidden',
    },
    profileButtonMobile: {
        width: 40,
        height: 40,
        borderRadius: 20,
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
        fontSize: 18,
        fontWeight: '600',
    },
    profileInitialsMobile: {
        fontSize: 16,
    },
    dateSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateSectionMobile: {
        marginTop: -5,
    },
    dateContainer: {
        marginLeft: -10,
        marginTop: -3,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 6,
    },
    dateContainerMobile: {
        marginLeft: -5,
        marginTop: -15,
        paddingHorizontal: 5,
        paddingVertical: 4,
    },
    dateText: {
        fontSize: 11,
        color: '#ffffff',
        fontWeight: '500',
    },
    dateTextMobile: {
        fontSize: 9,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 12,
    },
    headerAction: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.18)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerActionMobile: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },

    // Stats Grid (Matching announcement.tsx)
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        padding: 20,
        marginTop: -20,
    },
    statsGridMobile: {
        gap: 10,
        padding: 15,
        marginTop: -15,
    },
    statCard: {
        flex: 1,
        minWidth: '22%',
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
        borderLeftWidth: 4,
    },
    statCardMobile: {
        padding: 12,
        minWidth: '30%',
    },
    statIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statIconContainerMobile: {
        width: 36,
        height: 36,
        borderRadius: 10,
        marginBottom: 8,
    },
    statNumber: {
        fontSize: 28,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 4,
    },
    statNumberMobile: {
        fontSize: 22,
    },
    statLabel: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
    statLabelMobile: {
        fontSize: 10,
    },

    // Grid Layouts
    leftGrid: {
        flex: 3,
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    leftGridMobile: {
        flex: undefined,
        width: '100%',
        marginBottom: 15,
    },
    rightGrid: {
        flex: 3,
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    rightGridMobile: {
        flex: undefined,
        width: '100%',
    },

    // Headers
    leftHeader: {
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    leftHeaderMobile: {
        marginBottom: 12,
    },
    leftTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f172a',
    },
    leftTitleMobile: {
        fontSize: 16,
    },
    rightHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    rightHeaderMobile: {
        marginBottom: 15,
    },
    rightTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f172a',
    },
    rightTitleMobile: {
        fontSize: 16,
    },
    recordCount: {
        fontSize: 12,
        color: '#64748b',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 4,
    },
    refreshButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Sections
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sectionTitleMobile: {
        fontSize: 12,
        marginBottom: 6,
    },

    // Event Selector
    eventSelector: {
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    eventSelectorMobile: {
        padding: 12,
    },
    eventSelectorText: {
        flex: 1,
        fontSize: 16,
        color: '#1e293b',
        fontWeight: '500',
    },
    eventSelectorTextMobile: {
        fontSize: 14,
    },
    eventSelectorPlaceholder: {
        flex: 1,
        fontSize: 16,
        color: '#94a3b8',
    },
    eventSelectorIcon: {
        marginLeft: 8,
    },

    // QR Container
    qrContainer: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginTop: 16,
        marginBottom: 16,
    },
    qrContainerMobile: {
        padding: 16,
    },
    eventInfo: {
        width: '100%',
        marginBottom: 20,
        alignItems: 'center',
    },
    eventName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 8,
        textAlign: 'center',
    },
    eventNameMobile: {
        fontSize: 18,
    },
    eventDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    eventDetailText: {
        fontSize: 14,
        color: '#64748b',
        marginLeft: 6,
    },

    // Status Badges
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
        fontSize: 12,
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
        fontSize: 11,
        color: '#16a34a',
        marginLeft: 4,
        fontWeight: '500',
    },

    // QR Code
    qrCodeContainer: {
        marginVertical: 20,
        padding: 10,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    qrInfo: {
        marginTop: 12,
        alignItems: 'center',
    },
    qrHint: {
        fontSize: 12,
        color: '#64748b',
        textAlign: 'center',
        marginTop: 4,
    },

    // Expired State
    expiredContainer: {
        alignItems: 'center',
        padding: 24,
    },
    expiredIcon: {
        marginBottom: 12,
    },
    expiredText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#dc2626',
        textAlign: 'center',
    },
    expiredSubtext: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        marginTop: 4,
    },

    // Action Buttons
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButtonsMobile: {
        flexDirection: 'column',
        gap: 8,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 16,
    },
    actionButtonMobile: {
        paddingVertical: 12,
    },
    actionButtonPrimary: {
        backgroundColor: '#0ea5e9',
    },
    actionButtonDanger: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#ef4444',
    },
    actionButtonSecondary: {
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    actionButtonTextMobile: {
        fontSize: 13,
    },
    actionButtonTextPrimary: {
        color: '#ffffff',
    },
    actionButtonTextSecondary: {
        color: '#475569',
    },

    // Filters
    filtersContainer: {
        marginBottom: 20,
    },
    filterLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    filterLabelMobile: {
        fontSize: 11,
        marginBottom: 6,
    },
    filterRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    filterChipMobile: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    filterChipActive: {
        backgroundColor: '#0ea5e9',
        borderColor: '#0ea5e9',
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
    },
    filterChipTextMobile: {
        fontSize: 11,
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
        borderBottomColor: '#e2e8f0',
    },
    blockTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
    },
    blockCount: {
        fontSize: 12,
        color: '#64748b',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    attendanceItem: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    attendanceItemMobile: {
        padding: 10,
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
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
        flex: 1,
    },
    studentNameMobile: {
        fontSize: 13,
    },
    studentId: {
        fontSize: 12,
        color: '#64748b',
    },
    studentDetails: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 4,
    },
    timestamp: {
        fontSize: 11,
        color: '#94a3b8',
    },

    // Location Badges
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
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    eventItemMobile: {
        padding: 12,
    },
    eventItemContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    eventItemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        flex: 1,
    },
    eventItemNameMobile: {
        fontSize: 14,
    },
    eventItemBadges: {
        flexDirection: 'row',
        gap: 6,
    },
    eventItemDate: {
        fontSize: 13,
        color: '#64748b',
        marginBottom: 4,
    },
    eventItemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    eventItemLocation: {
        fontSize: 12,
        color: '#64748b',
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

    // Empty State
    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
    },
    emptyStateMobile: {
        paddingVertical: 32,
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
    emptyStateIconMobile: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginBottom: 12,
    },
    emptyStateTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyStateTitleMobile: {
        fontSize: 14,
        marginBottom: 6,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
        maxWidth: 300,
    },
    emptyStateTextMobile: {
        fontSize: 12,
        maxWidth: 250,
    },

    // Loading
    loadingContainer: {
        padding: 24,
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 8,
    },
    loadingTextMobile: {
        fontSize: 12,
    },

    // Modern Modal Styles (Matching announcement.tsx)
    modernModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modernModalContainer: {
        width: '90%',
        maxWidth: 500,
        maxHeight: '80%',
        backgroundColor: '#ffffff',
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    modernModalContainerMobile: {
        width: '95%',
        maxWidth: 400,
    },

    // Expiration Modal - LARGER SIZE
    expirationModalContainer: {
        width: '90%',
        maxWidth: 600, // Increased from 500
        maxHeight: '85%', // Increased from 80%
        backgroundColor: '#ffffff',
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    expirationModalContainerMobile: {
        width: '95%',
        maxWidth: 450, 
        maxHeight: '90%', 
    },
    expirationModalContent: {
        padding: 24, 
        maxHeight: 500, 
    },
    expirationModalContentMobile: {
        padding: 18, 
        maxHeight: 450,
    },

    modernModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    modernModalHeaderMobile: {
        paddingHorizontal: 15,
        paddingVertical: 12,
    },
    modernModalHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    modernModalHeaderLeftMobile: {
        gap: 8,
    },
    modernModalIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#0ea5e915',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modernModalIconContainerMobile: {
        width: 32,
        height: 32,
        borderRadius: 10,
    },
    modernModalTitleContainer: {
        gap: 2,
    },
    modernModalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f172a',
    },
    modernModalTitleMobile: {
        fontSize: 16,
    },
    modernModalSubtitle: {
        fontSize: 12,
        color: '#64748b',
    },
    modernModalSubtitleMobile: {
        fontSize: 10,
    },
    modernModalCloseButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modernModalCloseButtonMobile: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    modernModalContent: {
        padding: 20,
        maxHeight: 400,
    },
    modernModalContentMobile: {
        padding: 15,
        maxHeight: 350,
    },

    // Modern Form Elements
    modernFormLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 8,
        marginLeft: 4,
    },
    modernFormLabelMobile: {
        fontSize: 13,
        marginBottom: 6,
    },
    modernFormInput: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 14,
        color: '#1e293b',
        marginBottom: 12,
    },
    modernFormActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    modernFormActionsMobile: {
        gap: 8,
        marginTop: 20,
    },
    modernSubmitButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#0ea5e9',
        paddingVertical: 14,
        borderRadius: 16,
    },
    modernSubmitButtonMobile: {
        paddingVertical: 12,
    },
    modernSubmitButtonDisabled: {
        backgroundColor: '#cbd5e1',
    },
    modernSubmitButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    modernSubmitButtonTextMobile: {
        fontSize: 14,
    },
    modernCancelButton: {
        flex: 1,
        backgroundColor: '#f1f5f9',
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
    },
    modernCancelButtonMobile: {
        paddingVertical: 12,
    },
    modernCancelButtonText: {
        color: '#64748b',
        fontSize: 16,
        fontWeight: '600',
    },
    modernCancelButtonTextMobile: {
        fontSize: 14,
    },

    // Expiration Options
    expirationOptions: {
        marginBottom: 20,
    },
    expirationOption: {
        padding: 16,
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        marginBottom: 8,
        alignItems: 'center',
    },
    expirationOptionMobile: {
        padding: 12,
    },
    expirationOptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
    },
    expirationOptionTextMobile: {
        fontSize: 13,
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
        fontSize: 11,
        color: '#d97706',
        marginLeft: 4,
    },
    paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
},
paginationContainerMobile: {
    gap: 12,
    paddingTop: 12,
},
paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
},
paginationButtonDisabled: {
    opacity: 0.5,
    borderColor: '#f1f5f9',
},
paginationButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0ea5e9',
},
paginationButtonTextDisabled: {
    color: '#cbd5e1',
},
pageInfo: {
    alignItems: 'center',
},
pageInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
},
});
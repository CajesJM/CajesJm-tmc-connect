import { StyleSheet } from 'react-native';

export const eventsStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    headerGradient: {
        paddingTop: 15,
        paddingBottom: 8,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    greetingText: {
        fontSize: 14,
        color: '#94a3b8',
        marginBottom: 4,
    },
    userName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 2,
    },
    roleText: {
        fontSize: 12,
        color: '#94a3b8',
    },
    profileButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#ffffff',
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
        fontSize: 18,
        fontWeight: '600',
    },
    dateSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateContainer: {
        marginLeft: -10,
        marginTop: -20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 6,
    },
    dateText: {
        fontSize: 11,
        color: '#ffffff',
        fontWeight: '500',
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
        position: 'relative',
    },
    notificationBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ffffff',
    },
    notificationBadgeText: {
        color: '#ffffff',
        fontSize: 9,
        fontWeight: '700',
        paddingHorizontal: 3,
    },

    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        padding: 20,
        marginTop: -20,
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
    statCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 28,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
    statSubtext: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 4,
    },

    mainContent: {
        flex: 1,
        flexDirection: 'row',
        padding: 20,
        gap: 20,
    },
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

    leftHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    leftTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f172a',
    },
    leftControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    eventCount: {
        fontSize: 14,
        color: '#64748b',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: 'hidden',
    },
    leftFilters: {
        flexGrow: 0,
    },
    leftFilterButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#f1f5f9',
        marginRight: 8,
    },
    leftFilterButtonActive: {
        backgroundColor: '#0ea5e9',
    },
    leftFilterButtonText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
    leftFilterButtonTextActive: {
        color: '#ffffff',
    },

    paginatedList: {
        flex: 1,
    },
    paginatedItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        gap: 12,
    },
    paginatedItemActive: {
        backgroundColor: '#f0f9ff',
        borderLeftWidth: 3,
        borderLeftColor: '#0ea5e9',
    },
    paginatedNumber: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    paginatedNumberText: {
        fontSize: 12,
        fontWeight: '600',
    },
    paginatedInfo: {
        flex: 1,
    },
    paginatedTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: 4,
    },
    paginatedMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    paginatedDate: {
        fontSize: 11,
        color: '#94a3b8',
    },
    paginatedBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    paginatedBadgeText: {
        fontSize: 8,
        fontWeight: '700',
        color: '#ffffff',
        textTransform: 'uppercase',
    },
    paginatedLocation: {
        fontSize: 10,
        color: '#0ea5e9',
        marginLeft: 4,
    },
    paginatedActions: {
        flexDirection: 'row',
        gap: 8,
    },
    paginatedEditButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    paginatedDeleteButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#fef2f2',
        justifyContent: 'center',
        alignItems: 'center',
    },

    selectedDetailContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    selectedDetailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },

    selectedDetailTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f172a',
    },
    selectedDetailContent: {
        gap: 12,
    },
    selectedDetailBadges: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },

    detailBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },

    detailBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#ffffff',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    selectedDetailDescription: {
        fontSize: 15,
        color: '#334155',
        lineHeight: 22,
        marginBottom: 20,
        padding: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    selectedDetailLocation: {
        fontSize: 13,
        color: '#475569',
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    selectedDetailCoordinates: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 16,
        marginTop: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    selectedDetailCoordinatesText: {
        fontSize: 12,
        color: '#475569',
        marginBottom: 4,
    },
    selectedDetailFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },

    selectedDetailDate: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },

    selectedDetailDateText: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '500',
    },

    selectedDetailAttendees: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    selectedDetailAttendeesText: {
        fontSize: 12,
        color: '#64748b',
    },
    selectedDetailActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },

    selectedDetailEditButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        backgroundColor: '#eff6ff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#3b82f6',
    },

    selectedDetailEditText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#3b82f6',
    },
    selectedDetailDeleteButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        backgroundColor: '#fef2f2',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ef4444',
    },

    selectedDetailDeleteText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#ef4444',
    },

    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        paddingTop: 16,
        marginTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
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

    rightHeader: {
        marginBottom: 20,
    },
    searchTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        color: '#1e293b',
    },
    searchClearButton: {
        padding: 4,
    },
    filterChips: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    filterChipActive: {
        backgroundColor: '#0ea5e9',
        borderColor: '#0ea5e9',
    },
    filterChipText: {
        fontSize: 12,
        color: '#64748b',
    },
    filterChipTextActive: {
        color: '#ffffff',
    },
    searchStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    resultsCount: {
        fontSize: 14,
        color: '#64748b',
    },
    resultsHighlight: {
        fontSize: 14,
        color: '#0ea5e9',
        fontWeight: '600',
    },
    searchResultsContainer: {
        flex: 1,
    },
    searchResultItem: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    searchResultHeader: {
        marginBottom: 8,
    },
    searchResultTitleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    searchResultTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0f172a',
        flex: 1,
    },
    searchResultBadges: {
        flexDirection: 'row',
        gap: 4,
        marginLeft: 8,
    },
    searchResultBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    searchResultBadgeText: {
        fontSize: 8,
        fontWeight: '700',
        color: '#ffffff',
        textTransform: 'uppercase',
    },
    searchResultLocation: {
        fontSize: 11,
        color: '#0ea5e9',
        marginBottom: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchResultActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
        marginTop: 4,
    },
    searchResultEditButton: {
        width: 28,
        height: 28,
        borderRadius: 6,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchResultDeleteButton: {
        width: 28,
        height: 28,
        borderRadius: 6,
        backgroundColor: '#fef2f2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchResultDescription: {
        fontSize: 13,
        color: '#475569',
        lineHeight: 18,
        marginBottom: 8,
    },
    searchResultFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 8,
    },
    searchResultDate: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    searchResultDateText: {
        fontSize: 11,
        color: '#64748b',
    },
    searchResultAttendees: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    searchResultAttendeesText: {
        fontSize: 10,
        color: '#94a3b8',
    },

    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
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
        marginBottom: 24,
        maxWidth: 300,
    },

    loadingContainer: {
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 8,
        fontSize: 12,
        color: '#64748b',
    },

    modernModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modernModalContainer: {
        width: '90%',
        maxWidth: 500,
        backgroundColor: '#ffffff',
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
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
    modernModalHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    modernModalIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#0ea5e915',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modernModalTitleContainer: {
        gap: 2,
    },
    modernModalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f172a',
    },
    modernModalSubtitle: {
        fontSize: 12,
        color: '#64748b',
    },
    modernModalCloseButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modernModalContent: {
        padding: 20,
        maxHeight: 600,
    },
    modernFormGroup: {
        marginBottom: 20,
    },
    modernFormLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 8,
        marginLeft: 4,
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
    },
    modernTextArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    modernLocationButton: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    modernLocationButtonText: {
        flex: 1,
    },
    modernLocationButtonTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    modernLocationButtonSubtitle: {
        fontSize: 12,
        color: '#64748b',
    },
    modernCoordinatesButton: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 16,
        padding: 16,
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    modernFormActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
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
    modernSubmitButtonDisabled: {
        backgroundColor: '#cbd5e1',
    },
    modernSubmitButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    modernCancelButton: {
        flex: 1,
        backgroundColor: '#f1f5f9',
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
    },
    modernCancelButtonText: {
        color: '#64748b',
        fontSize: 16,
        fontWeight: '600',
    },

    // Mobile Responsive Styles
    headerGradientMobile: {
        paddingTop: 10,
        paddingBottom: 5,
        paddingHorizontal: 15,
    },
    headerContentMobile: {
        marginBottom: 15,
    },
    greetingTextMobile: {
        fontSize: 12,
    },
    userNameMobile: {
        fontSize: 20,
    },
    roleTextMobile: {
        fontSize: 10,
    },
    profileButtonMobile: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    profileInitialsMobile: {
        fontSize: 16,
    },
    dateSectionMobile: {
        marginTop: -5,
    },
    dateContainerMobile: {
        marginLeft: -5,
        marginTop: -15,
        paddingHorizontal: 5,
        paddingVertical: 4,
    },
    dateTextMobile: {
        fontSize: 9,
    },
    headerActionMobile: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    statsGridMobile: {
        gap: 10,
        padding: 15,
        marginTop: -15,
    },
    statCardMobile: {
        padding: 12,
        minWidth: '30%',
    },
    statIconContainerMobile: {
        width: 36,
        height: 36,
        borderRadius: 10,
    },
    statNumberMobile: {
        fontSize: 22,
    },
    statLabelMobile: {
        fontSize: 10,
    },
    mainContentMobile: {
        flexDirection: 'column',
        padding: 15,
        gap: 15,
    },
    leftGridMobile: {
        flex: undefined,
        width: '100%',
        marginBottom: 15,
    },
    rightGridMobile: {
        flex: undefined,
        width: '100%',
    },
    leftHeaderMobile: {
        marginBottom: 12,
    },
    leftTitleMobile: {
        fontSize: 16,
    },
    leftControlsMobile: {
        gap: 8,
    },
    eventCountMobile: {
        fontSize: 12,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    leftFiltersMobile: {
        marginRight: -15,
    },
    leftFilterButtonMobile: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginRight: 6,
    },
    leftFilterButtonTextMobile: {
        fontSize: 11,
    },
    paginatedItemMobile: {
        padding: 10,
        gap: 8,
    },
    paginatedTitleMobile: {
        fontSize: 13,
    },
    paginatedDateMobile: {
        fontSize: 10,
    },
    paginatedEditButtonMobile: {
        width: 28,
        height: 28,
        borderRadius: 6,
    },
    paginatedDeleteButtonMobile: {
        width: 28,
        height: 28,
        borderRadius: 6,
    },
    paginationContainerMobile: {
        gap: 12,
        paddingTop: 12,
        marginTop: 12,
    },
    paginationButtonMobile: {
        paddingHorizontal: 8,
        paddingVertical: 6,
    },
    pageInfoTextMobile: {
        fontSize: 12,
    },
    selectedDetailContainerMobile: {
        marginTop: 12,
        padding: 12,
    },
    selectedDetailHeaderMobile: {
        marginBottom: 8,
        paddingBottom: 6,
    },
    selectedDetailTitleMobile: {
        fontSize: 14,
    },
    selectedDetailBadgesMobile: {
        gap: 6,
    },
    detailBadgeMobile: {
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    detailBadgeTextMobile: {
        fontSize: 9,
    },
    selectedDetailLocationMobile: {
        fontSize: 12,
        gap: 4,
    },
    selectedDetailFooterMobile: {
        paddingTop: 10,
    },
    selectedDetailDateMobile: {
        gap: 4,
    },

    selectedDetailActionsMobile: {
        gap: 8,
    },
    selectedDetailEditButtonMobile: {
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    selectedDetailDeleteButtonMobile: {
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    rightHeaderMobile: {
        marginBottom: 15,
    },
    searchTitleMobile: {
        fontSize: 16,
        marginBottom: 12,
    },
    searchContainerMobile: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 12,
    },
    searchInputMobile: {
        marginLeft: 8,
        fontSize: 13,
    },
    filterChipsMobile: {
        marginBottom: 12,
    },
    filterChipMobile: {
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    filterChipTextMobile: {
        fontSize: 11,
    },
    searchStatsMobile: {
        marginBottom: 12,
    },
    resultsCountMobile: {
        fontSize: 13,
    },
    searchResultItemMobile: {
        padding: 10,
        marginBottom: 6,
    },
    searchResultTitleMobile: {
        fontSize: 13,
    },
    searchResultLocationMobile: {
        fontSize: 10,
    },
    searchResultEditButtonMobile: {
        width: 26,
        height: 26,
        borderRadius: 5,
    },
    searchResultDeleteButtonMobile: {
        width: 26,
        height: 26,
        borderRadius: 5,
    },
    searchResultDescriptionMobile: {
        fontSize: 12,
        lineHeight: 16,
        marginBottom: 6,
    },
    searchResultDateTextMobile: {
        fontSize: 10,
    },
    searchResultAttendeesTextMobile: {
        fontSize: 9,
    },
    emptyStateMobile: {
        paddingVertical: 30,
    },
    emptyStateIconMobile: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginBottom: 12,
    },
    emptyStateTitleMobile: {
        fontSize: 16,
        marginBottom: 6,
    },
    emptyStateTextMobile: {
        fontSize: 12,
        maxWidth: 250,
    },
    loadingTextMobile: {
        fontSize: 11,
    },
    modernModalContainerMobile: {
        width: '95%',
        maxWidth: 400,
    },
    modernModalHeaderMobile: {
        paddingHorizontal: 15,
        paddingVertical: 12,
    },
    modernModalHeaderLeftMobile: {
        gap: 8,
    },
    modernModalIconContainerMobile: {
        width: 32,
        height: 32,
        borderRadius: 10,
    },
    modernModalTitleMobile: {
        fontSize: 16,
    },
    modernModalSubtitleMobile: {
        fontSize: 10,
    },
    modernModalCloseButtonMobile: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    modernModalContentMobile: {
        padding: 15,
        maxHeight: 500,
    },
    modernFormLabelMobile: {
        fontSize: 13,
        marginBottom: 6,
    },
    modernFormInputMobile: {
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 13,
    },
    modernFormActionsMobile: {
        gap: 8,
        marginTop: 20,
    },
    modernSubmitButtonMobile: {
        paddingVertical: 12,
    },
    modernSubmitButtonTextMobile: {
        fontSize: 14,
    },
    modernCancelButtonMobile: {
        paddingVertical: 12,
    },
    modernCancelButtonTextMobile: {
        fontSize: 14,
    },
    eventImageContainer: {
        width: 60,
        height: 60,
        borderRadius: 8,
        overflow: 'hidden',
        marginRight: 8,
        position: 'relative',
    },
    eventImage: {
        width: '100%',
        height: '100%',
    },
    eventBadge: {
        position: 'absolute',
        top: 4,
        left: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    todayBadge: {
        backgroundColor: '#16a34a',
    },
    tomorrowBadge: {
        backgroundColor: '#2563eb',
    },
    upcomingBadge: {
        backgroundColor: '#d97706',
    },
    pastBadge: {
        backgroundColor: '#64748b',
    },
    eventBadgeText: {
        fontSize: 8,
        fontWeight: '700',
        color: '#ffffff',
        textTransform: 'uppercase',
    },
    todayBadgeText: {
        color: '#ffffff',
    },
    tomorrowBadgeText: {
        color: '#ffffff',
    },
    upcomingBadgeText: {
        color: '#ffffff',
    },
    pastBadgeText: {
        color: '#ffffff',
    },
    selectedDetailImageContainer: {
        width: '100%',
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },

    selectedDetailImage: {
        width: '100%',
        height: '100%',
    },

    selectedDetailImageBadge: {
        position: 'absolute',
        top: 16,
        left: 16,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },

    selectedDetailEventTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 12,
        lineHeight: 32,
    },
    selectedDetailInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
        paddingVertical: 4,
    },

    selectedDetailInfoText: {
        fontSize: 15,
        color: '#1e293b',
        flex: 1,
        fontWeight: '500',
    },
    // Mobile responsive versions
    selectedDetailImageContainerMobile: {
        height: 150,
    },

    selectedDetailEventTitleMobile: {
        fontSize: 20,
        lineHeight: 28,
    },

    selectedDetailDescriptionMobile: {
        fontSize: 14,
        lineHeight: 20,
        padding: 12,
    },

    selectedDetailInfoTextMobile: {
        fontSize: 14,
    },

    selectedDetailDateTextMobile: {
        fontSize: 12,
    },
    eventsListContainer: {
        flex: 1,
        minHeight: 200,
    },
    eventsListContainerWithDetail: {
        flex: 1,
        maxHeight: 300,
        minHeight: 200,
    },
    selectedDetailWrapperMobile: {
        marginTop: 12,
        paddingTop: 12,
        maxHeight: 350,
    },
    eventDetailModal: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 20,
        maxHeight: '80%', // Limit to 80% of screen height
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
    },

    eventDetailModalMobile: {
        maxHeight: '70%', // Even smaller on mobile
    },
    eventDetailModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },

    eventDetailModalTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0f172a',
    },

    eventDetailModalCloseButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },

    eventDetailModalContent: {
        padding: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    // Compact Detail Styles (matching the form)
    modernDetailImageContainer: {
        width: '100%',
        height: 120,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
        position: 'relative',
    },

    modernDetailImageContainerMobile: {
        height: 100,
    },

    modernDetailImage: {
        width: '100%',
        height: '100%',
    },

    modernDetailImageBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },

    modernDetailTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 16,
    },

    modernDetailTitleMobile: {
        fontSize: 16,
    },

    modernDetailSection: {
        marginBottom: 16,
    },

    modernDetailLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    modernDetailText: {
        fontSize: 14,
        color: '#1e293b',
        lineHeight: 20,
        backgroundColor: '#f8fafc',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },

    modernDetailTextMobile: {
        fontSize: 13,
        lineHeight: 18,
        padding: 10,
    },

    modernDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
        paddingVertical: 4,
    },

    modernDetailRowText: {
        fontSize: 14,
        color: '#334155',
        flex: 1,
    },
    modernDetailIconButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    modernDetailIconButtonMobile: {
        width: 28,
        height: 28,
        borderRadius: 14,
    },
    modernDetailRangeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
},

rangeIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
},

rangeIndicatorText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
},

rangeVisualization: {
    marginTop: 8,
    marginBottom: 16,
},

rangeTrack: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
},

rangeFill: {
    height: '100%',
    backgroundColor: '#0ea5e9',
    borderRadius: 4,
},

rangeTrackText: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
},

checkLocationButton: {
    backgroundColor: '#0ea5e9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
},

checkLocationButtonDisabled: {
    backgroundColor: '#cbd5e1',
},

checkLocationButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500',
},
// Map Styles
mapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
},

map: {
    width: '100%',
    height: 200,
},

markerContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
},

markerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
},

userMarkerContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
},

userMarkerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
},

userMarkerPulse: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
},

mapLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 8,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
},

legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
},

legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
},

legendCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#0ea5e9',
    backgroundColor: 'transparent',
},

legendText: {
    fontSize: 10,
    color: '#64748b',
},

distanceInfo: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
},

distanceRow: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
},

});
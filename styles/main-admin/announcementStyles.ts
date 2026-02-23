import { StyleSheet } from 'react-native';

export const announcementStyles = StyleSheet.create({
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
    leftControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
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
        marginTop: 16,
        padding: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    selectedDetailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    selectedDetailTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
    },
    selectedDetailContent: {
        gap: 12,
    },
    selectedDetailBadges: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 4,
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
    selectedDetailMessage: {
        fontSize: 14,
        color: '#1e293b',
        lineHeight: 20,
        marginBottom: 12,
    },
    selectedDetailFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    selectedDetailDate: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    selectedDetailDateText: {
        fontSize: 12,
        color: '#64748b',
    },
    selectedDetailActions: {
        flexDirection: 'row',
        gap: 12,
    },
    selectedDetailEditButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#eff6ff',
        borderRadius: 8,
    },
    selectedDetailEditText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#3b82f6',
    },
    selectedDetailDeleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#fef2f2',
        borderRadius: 8,
    },
    selectedDetailDeleteText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#ef4444',
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
        height: 120,
        textAlignVertical: 'top',
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
    announcementCount: {
        fontSize: 14,
        color: '#64748b',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: 'hidden',
    },
    announcementList: {
        flex: 1,
    },
    announcementItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        gap: 12,
    },
    announcementNumber: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    announcementNumberText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
    },
    announcementInfo: {
        flex: 1,
    },
    announcementItemTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: 4,
    },
    announcementItemMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    announcementItemDate: {
        fontSize: 11,
        color: '#94a3b8',
    },
    announcementItemBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    announcementItemBadgeText: {
        fontSize: 8,
        fontWeight: '700',
        color: '#ffffff',
        textTransform: 'uppercase',
    },
    announcementItemActive: {
        backgroundColor: '#f0f9ff',
        borderLeftWidth: 3,
        borderLeftColor: '#0ea5e9',
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
    filtersContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#f8fafc',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    filterButtonActive: {
        backgroundColor: '#0ea5e9',
        borderColor: '#0ea5e9',
    },
    filterButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
    },
    filterButtonTextActive: {
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
        marginBottom: -25,
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
    searchResultMessage: {
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
    searchResultFullDate: {
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

    modalContainer: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    modalHeader: {
        backgroundColor: '#f8fafc',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    modalHeaderTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    modalBackButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    modalBackText: {
        fontSize: 14,
        color: '#0ea5e9',
        fontWeight: '600',
    },
    modalTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
        textAlign: 'center',
        marginLeft: -80,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    formLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 8,
    },
    formInput: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        color: '#1e293b',
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    formActions: {
        marginTop: 24,
        gap: 12,
    },
    submitButton: {
        backgroundColor: '#0ea5e9',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 10,
    },
    submitButtonDisabled: {
        backgroundColor: '#cbd5e1',
    },
    submitButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        backgroundColor: '#f1f5f9',
        paddingVertical: 16,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#64748b',
        fontSize: 16,
        fontWeight: '600',
    },
    cardActions: {
        flexDirection: 'row',
        gap: 8,
    },
    editButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#fef2f2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    priorityContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 8,
    },
    priorityButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    priorityButtonNormalActive: {
        backgroundColor: '#0ea5e915',
        borderColor: '#0ea5e9',
    },
    priorityButtonImportantActive: {
        backgroundColor: '#f59e0b15',
        borderColor: '#f59e0b',
    },
    priorityButtonUrgentActive: {
        backgroundColor: '#ef444415',
        borderColor: '#ef4444',
    },
    priorityIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    priorityButtonText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748b',
    },
    priorityButtonTextActive: {
        color: '#1e293b',
        fontWeight: '600',
    },
    priorityHint: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 4,
        marginLeft: 4,
        fontStyle: 'italic',
    },
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
    announcementCountMobile: {
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
    selectedDetailMessageMobile: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 10,
    },
    selectedDetailFooterMobile: {
        paddingTop: 10,
    },
    selectedDetailDateMobile: {
        gap: 4,
    },
    selectedDetailDateTextMobile: {
        fontSize: 10,
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
    searchResultMessageMobile: {
        fontSize: 12,
        lineHeight: 16,
        marginBottom: 6,
    },
    searchResultDateTextMobile: {
        fontSize: 10,
    },
    searchResultFullDateMobile: {
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
    priorityContainerMobile: {
        gap: 6,
    },
    priorityButtonMobile: {
        paddingVertical: 10,
        paddingHorizontal: 6,
        gap: 6,
    },
    priorityIndicatorMobile: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    priorityButtonTextMobile: {
        fontSize: 12,
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
});
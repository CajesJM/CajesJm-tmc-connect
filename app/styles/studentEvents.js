import { Dimensions, Platform, StyleSheet } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const isSmallScreen = screenWidth < 375;

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },

    dashboardHeader: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: isSmallScreen ? 12 : 16,
        paddingTop: Platform.OS === 'ios' ? (isSmallScreen ? 40 : 45) : (isSmallScreen ? 20 : 25),
        paddingBottom: isSmallScreen ? 10 : 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },
    dashboardHeaderSmall: {
        paddingHorizontal: 12,
        paddingTop: Platform.OS === 'ios' ? 40 : 20,
        paddingBottom: 10,
    },
    headerContent: {
        marginBottom: isSmallScreen ? 8 : 10,
    },
    title: {
        fontSize: isSmallScreen ? 20 : 24,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 2,
    },
    titleSmall: {
        fontSize: 20,
    },
    subtitle: {
        fontSize: isSmallScreen ? 12 : 13,
        color: '#64748B',
        fontWeight: '500',
    },
    subtitleSmall: {
        fontSize: 12,
    },

    headerStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    headerStatsSmall: {},
    statCard: {
        backgroundColor: '#F1F5F9',
        padding: isSmallScreen ? 8 : 10,
        borderRadius: 8,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: isSmallScreen ? 2 : 3,
    },
    statCardSmall: {
        padding: 8,
        marginHorizontal: 2,
    },
    statNumber: {
        fontSize: isSmallScreen ? 16 : 18,
        fontWeight: 'bold',
        color: '#1E88E5',
        marginBottom: 2,
    },
    statNumberSmall: {
        fontSize: 16,
    },
    statLabel: {
        fontSize: isSmallScreen ? 9 : 10,
        color: '#64748B',
        fontWeight: '500',
    },
    statLabelSmall: {
        fontSize: 9,
    },

    headerActions: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: isSmallScreen ? 12 : 16,
        paddingVertical: isSmallScreen ? 8 : 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerActionsSmall: {
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    filterContainer: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
        padding: isSmallScreen ? 1 : 2,
        width: '100%',
    },
    filterButton: {
        paddingHorizontal: isSmallScreen ? 10 : 12,
        paddingVertical: isSmallScreen ? 8 : 10,
        borderRadius: 6,
        marginHorizontal: isSmallScreen ? 1 : 2,
        flex: 1,
        alignItems: 'center',
    },
    filterButtonActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    filterButtonText: {
        fontSize: isSmallScreen ? 11 : 12,
        color: '#64748B',
        fontWeight: '500',
    },
    filterButtonTextActive: {
        color: '#1E88E5',
        fontWeight: '600',
    },

    listContent: {
        padding: isSmallScreen ? 8 : 12,
        paddingTop: isSmallScreen ? 4 : 6,
    },
    listContentSmall: {
        padding: 8,
        paddingTop: 4,
    },

    eventCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: isSmallScreen ? 10 : 12,
        marginBottom: isSmallScreen ? 8 : 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    eventCardSmall: {
        borderRadius: 10,
        marginBottom: 8,
    },
    pastEventCard: {
        opacity: 0.7,
        backgroundColor: '#F8FAFC',
    },

    eventImageContainer: {
        position: 'relative',
    },
    eventImage: {
        width: '100%',
        height: isSmallScreen ? 120 : 140,
    },
    eventImageSmall: {
        height: 120,
    },

    eventBadge: {
        position: 'absolute',
        top: isSmallScreen ? 6 : 8,
        right: isSmallScreen ? 6 : 8,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        paddingHorizontal: isSmallScreen ? 6 : 8,
        paddingVertical: isSmallScreen ? 3 : 4,
        borderRadius: isSmallScreen ? 10 : 12,
    },
    eventBadgeSmall: {
        top: 6,
        right: 6,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 10,
    },
    todayBadge: {
        backgroundColor: '#EF4444',
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
        color: '#FFFFFF',
        fontSize: isSmallScreen ? 9 : 10,
        fontWeight: '600',
    },
    eventBadgeTextSmall: {
        fontSize: 9,
    },

    eventContent: {
        padding: isSmallScreen ? 12 : 14,
    },
    eventContentSmall: {
        padding: 12,
    },
    eventHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: isSmallScreen ? 6 : 8,
    },
    eventMeta: {
        flex: 1,
    },
    eventLocation: {
        fontSize: isSmallScreen ? 11 : 12,
        color: '#1E88E5',
        fontWeight: '700',
        marginBottom: 2,
    },
    eventLocationSmall: {
        fontSize: 11,
    },
    eventDate: {
        fontSize: isSmallScreen ? 9 : 10,
        color: '#64748B',
        fontWeight: '500',
    },
    eventDateSmall: {
        fontSize: 9,
    },
    pastEventDate: {
        color: '#94A3B8',
    },
    eventTitle: {
        fontSize: isSmallScreen ? 14 : 16,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: isSmallScreen ? 3 : 4,
        lineHeight: isSmallScreen ? 18 : 20,
    },
    eventTitleSmall: {
        fontSize: 14,
        marginBottom: 3,
        lineHeight: 18,
    },
    eventDescription: {
        fontSize: isSmallScreen ? 11 : 12,
        color: '#475569',
        lineHeight: isSmallScreen ? 14 : 16,
        marginBottom: isSmallScreen ? 3 : 4,
    },
    eventDescriptionSmall: {
        fontSize: 11,
        lineHeight: 14,
        marginBottom: 3,
    },
    locationDescription: {
        fontSize: isSmallScreen ? 9 : 10,
        color: '#64748B',
        fontStyle: 'italic',
        marginBottom: isSmallScreen ? 6 : 8,
    },
    locationDescriptionSmall: {
        fontSize: 9,
        marginBottom: 6,
    },

    verificationBadge: {
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginTop: 4,
        marginLeft: -8,
        marginBottom: isSmallScreen ? 6 : 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    verificationBadgeText: {
        color: '#065F46',
        fontSize: 12,
        fontWeight: '500',
    },

    eventStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: isSmallScreen ? 8 : 10,
    },
    eventOrganizer: {
        fontSize: isSmallScreen ? 9 : 10,
        color: '#1E88E5',
        fontWeight: '600',
    },
    eventStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    eventOrganizerSmall: {
        fontSize: 9,
    },
    attendeeCount: {
        fontSize: isSmallScreen ? 9 : 10,
        color: '#1E88E5',
        fontWeight: '600',
    },
    attendeeCountSmall: {
        fontSize: 9,
    },

    eventFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    pastEventBadge: {
        backgroundColor: '#EF4444',
        paddingHorizontal: isSmallScreen ? 12 : 14,
        paddingVertical: isSmallScreen ? 6 : 8,
        borderRadius: 6,
        minWidth: isSmallScreen ? 100 : 120,
    },
    pastEventBadgeSmall: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        minWidth: 100,
    },
    pastEventText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: isSmallScreen ? 11 : 12,
        textAlign: 'center',
    },
    pastEventTextSmall: {
        fontSize: 11,
    },

    emptyState: {
        alignItems: 'center',
        padding: isSmallScreen ? 30 : 40,
        marginTop: isSmallScreen ? 40 : 60,
    },
    emptyStateSmall: {
        padding: 30,
        marginTop: 40,
    },
    emptyStateTitle: {
        fontSize: isSmallScreen ? 18 : 20,
        color: '#64748B',
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
        marginTop: 12,
    },
    emptyStateTitleSmall: {
        fontSize: 18,
    },
    emptyStateText: {
        fontSize: isSmallScreen ? 12 : 14,
        color: '#94A3B8',
        textAlign: 'center',
        marginBottom: 24,
    },
    emptyStateTextSmall: {
        fontSize: 12,
    },

    loadingText: {
        marginTop: 10,
        color: '#64748B',
        fontSize: isSmallScreen ? 14 : 16,
        fontWeight: '500',
    },
});
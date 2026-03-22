import { StyleSheet } from 'react-native';
import { ThemeColors } from '../../context/ThemeContext';

export const createStudentDashboardStyles = (
  colors: ThemeColors,
  isDark: boolean,
  isMobile: boolean,
  isTablet: boolean,
  isDesktop: boolean
) => {
  const { background, card, text, border, accent, sidebar } = colors;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: background,
    },
    contentArea: {
      flex: 1,
    },
    overviewContainer: {
      flex: 1,
    },
    headerGradient: {
      paddingHorizontal: isMobile ? 16 : 24,
      paddingTop: isMobile ? 50 : 60,
      paddingBottom: isMobile ? 5 : 8,
      borderBottomLeftRadius: isMobile ? 20 : 24,
      borderBottomRightRadius: isMobile ? 20 : 24,
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    greetingText: {
      fontSize: isMobile ? 12 : 13,
      color: sidebar.text.muted,
      fontFamily: 'Inter-Regular',
    },
    userName: {
      fontSize: isMobile ? 18 : 20,
      fontWeight: 'bold',
      color: '#ffffff',
      marginTop: 2,
    },
    roleText: {
      fontSize: isMobile ? 12 : 13,
      color: accent.primary,
      marginTop: 4,
    },
    profileButton: {
      width: isMobile ? 48 : 56,
      height: isMobile ? 48 : 56,
      borderRadius: isMobile ? 24 : 28,
      backgroundColor: '#ffffff20',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    profileImage: {
      width: isMobile ? 48 : 56,
      height: isMobile ? 48 : 56,
      borderRadius: isMobile ? 24 : 28,
    },
    profileFallback: {
      backgroundColor: accent.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    profileInitials: {
      fontSize: isMobile ? 20 : 24,
      fontWeight: '600',
      color: '#ffffff',
    },
    dateSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: isMobile ? 12 : 16,
    },
    dateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    dateText: {
      fontSize: isMobile ? 10 : 12,
      color: sidebar.text.muted,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 12,
    },
    headerAction: {
      width: isMobile ? 32 : 36,
      height: isMobile ? 32 : 36,
      borderRadius: isMobile ? 16 : 18,
      backgroundColor: '#ffffff20',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    notificationBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      backgroundColor: '#ef4444',
      borderRadius: 10,
      minWidth: 18,
      height: 18,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    notificationBadgeText: {
      color: '#ffffff',
      fontSize: 10,
      fontWeight: 'bold',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: isMobile ? 12 : 16,
      marginTop: 0,
      gap: 12,
      justifyContent: 'space-between',
    },
    statCard: {
      backgroundColor: card,
      borderRadius: 20,
      padding: isMobile ? 12 : 16,
      width: '30%',
      minWidth: 90,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 8,
      elevation: 2,
      borderLeftWidth: 4,
      marginTop: 12,
    },
    statCardHeader: {
      marginBottom: 12,
    },
    statIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statNumber: {
      fontSize: isMobile ? 20 : 24,
      fontWeight: 'bold',
      color: text,
    },
    statLabel: {
      fontSize: isMobile ? 11 : 13,
      color: sidebar.text.secondary,
      marginTop: 4,
    },
    twoColumnLayout: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: isMobile ? 16 : 24,
      marginTop: 24,
      gap: 16,
      paddingBottom: 30,
    },
    column: {
      flex: 1,
      minWidth: isMobile ? 280 : 300,
    },
    upcomingColumn: {
      flex: 1,
    },
    upcomingCard: {
      backgroundColor: card,
      borderRadius: 24,
      padding: isMobile ? 12 : 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    upcomingHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    upcomingTitle: {
      fontSize: isMobile ? 15 : 16,
      fontWeight: '600',
      color: text,
    },
    viewAllText: {
      fontSize: isMobile ? 12 : 13,
      color: accent.primary,
      fontWeight: '500',
    },
    upcomingList: {
      gap: 12,
    },
    upcomingItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    eventDate: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: border,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    eventDay: {
      fontSize: 16,
      fontWeight: 'bold',
      color: text,
    },
    eventMonth: {
      fontSize: 10,
      color: sidebar.text.secondary,
    },
    eventInfo: {
      flex: 1,
    },
    eventName: {
      fontSize: 14,
      fontWeight: '600',
      color: text,
    },
    eventTime: {
      fontSize: 12,
      color: sidebar.text.secondary,
      marginTop: 2,
    },
    loadingContainer: {
      alignItems: 'center',
      paddingVertical: 24,
    },
    loadingText: {
      fontSize: 13,
      color: sidebar.text.muted,
      marginTop: 8,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 24,
    },
    emptyText: {
      fontSize: 14,
      color: sidebar.text.muted,
      marginTop: 8,
    },
    createButton: {
      marginTop: 12,
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: accent.primary,
      borderRadius: 20,
    },
    createButtonText: {
      fontSize: 13,
      color: '#ffffff',
      fontWeight: '600',
    },
    announcementCard: {
      backgroundColor: card,
      borderRadius: 24,
      padding: isMobile ? 12 : 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    announcementHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    announcementTitle: {
      fontSize: isMobile ? 15 : 16,
      fontWeight: '600',
      color: text,
    },
    announcementList: {
      gap: 12,
    },
    announcementItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    announcementBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    announcementContent: {
      flex: 1,
    },
    announcementText: {
      fontSize: 14,
      fontWeight: '500',
      color: text,
    },
    announcementTime: {
      fontSize: 11,
      color: sidebar.text.muted,
      marginTop: 2,
    },
    registeredBadge: {
      fontSize: 11,
      color: '#10b981',
      fontWeight: '600',
      marginTop: 2,
    },
    donutChartContainer: {
      backgroundColor: card,
      borderRadius: 20,
      marginHorizontal: isMobile ? 16 : 24,
      marginVertical: 12,
      padding: isMobile ? 12 : 16,
      shadowColor: '#000',
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    donutHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    donutHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    donutTitle: {
      fontSize: isMobile ? 15 : 16,
      fontWeight: '600',
      color: text,
    },
    donutTotalBadge: {
      backgroundColor: `${accent.primary}15`,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      fontSize: 12,
      fontWeight: '600',
      color: accent.primary,
    },
    donutChartWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 16,
    },
    donutCenterLabel: {
      alignItems: 'center',
    },
    donutCenterValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: text,
    },
    donutCenterText: {
      fontSize: 12,
      color: sidebar.text.secondary,
    },
    progressLegendContainer: {
      marginTop: 16,
      gap: 12,
    },
    progressLegendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    progressLegendIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    progressLegendInfo: {
      flex: 1,
    },
    progressLegendLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: text,
    },
    progressLegendCount: {
      fontSize: 12,
      color: sidebar.text.secondary,
    },
    progressLegendPercent: {
      fontSize: 14,
      fontWeight: '600',
    },
    donutChartEmptyText: {
      textAlign: 'center',
      color: sidebar.text.muted,
      padding: 24,
    },
  });
};
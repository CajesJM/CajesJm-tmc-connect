
import { Dimensions, StyleSheet } from 'react-native';
import { ThemeColors } from '../../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const createStudentDashboardStyles = (
  colors: ThemeColors,
  isDark: boolean,
  isMobile: boolean,
  isTablet: boolean,
  isDesktop: boolean
) => {
  const { background, card, text, textSecondary, textMuted, border, accent, sidebar } = colors;

  return StyleSheet.create({
    // Container styles
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

    // Enhanced Header with Gradient
    headerGradient: {
      paddingHorizontal: isMobile ? 20 : 28,
      paddingTop: isMobile ? 60 : 70,
      paddingBottom: isMobile ? 24 : 32,
      borderBottomLeftRadius: isMobile ? 24 : 32,
      borderBottomRightRadius: isMobile ? 24 : 32,
      position: 'relative',
      overflow: 'hidden',
    },
    headerBackgroundShapes: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: 0.1,
    },
    shape1: {
      position: 'absolute',
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: 'rgba(255,255,255,0.2)',
      top: -50,
      right: -50,
    },
    shape2: {
      position: 'absolute',
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor: 'rgba(255,255,255,0.15)',
      bottom: -30,
      left: -30,
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      zIndex: 1,
    },
    greetingText: {
      fontSize: isMobile ? 14 : 16,
      color: 'rgba(255,255,255,0.8)',
      fontWeight: '500',
      letterSpacing: 0.5,
    },
    userName: {
      fontSize: isMobile ? 24 : 32,
      fontWeight: 'bold',
      color: '#ffffff',
      marginTop: 4,
      letterSpacing: -0.5,
    },
    roleBadge: {
      marginTop: 8,
      alignSelf: 'flex-start',
    },
    roleGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    roleText: {
      fontSize: isMobile ? 12 : 13,
      color: '#ffffff',
      fontWeight: '600',
    },
    profileButton: {
      width: isMobile ? 56 : 64,
      height: isMobile ? 56 : 64,
      borderRadius: isMobile ? 28 : 32,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      borderWidth: 3,
      borderColor: 'rgba(255,255,255,0.3)',
      position: 'relative',
    },
    profileImage: {
      width: isMobile ? 56 : 64,
      height: isMobile ? 56 : 64,
      borderRadius: isMobile ? 28 : 32,
    },
    profileFallback: {
      backgroundColor: accent.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    profileInitials: {
      fontSize: isMobile ? 24 : 28,
      fontWeight: '700',
      color: '#ffffff',
    },
    editIconContainer: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: accent.primary,
      width: 22,
      height: 22,
      borderRadius: 11,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#ffffff',
    },
    dateSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: isMobile ? 20 : 24,
      zIndex: 1,
    },
    dateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: 'rgba(255,255,255,0.15)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    dateText: {
      fontSize: isMobile ? 12 : 14,
      color: 'rgba(255,255,255,0.9)',
      fontWeight: '500',
    },
    headerActions: {
      flexDirection: 'row',
      gap: 12,
    },
    headerAction: {
      width: isMobile ? 40 : 44,
      height: isMobile ? 40 : 44,
      borderRadius: isMobile ? 20 : 22,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    notificationBadge: {
      position: 'absolute',
      top: -6,
      right: -6,
      backgroundColor: '#ef4444',
      borderRadius: 12,
      minWidth: 22,
      height: 22,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
      borderWidth: 2,
      borderColor: isDark ? '#1e293b' : '#ffffff',
      shadowColor: '#ef4444',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 4,
    },
    notificationBadgeText: {
      color: '#ffffff',
      fontSize: 11,
      fontWeight: 'bold',
    },

    // Enhanced Stats Grid
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: isMobile ? 16 : 24,
      marginTop: isMobile ? 16 : 20,
      gap: 12,
      justifyContent: 'space-between',
    },
    statCard: {
      backgroundColor: card,
      borderRadius: 20,
      padding: isMobile ? 16 : 20,
      width: isMobile ? '30%' : '31%',
      minWidth: 100,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.4 : 0.08,
      shadowRadius: 12,
      elevation: 4,
      borderLeftWidth: 0,
      borderTopWidth: 4,
      marginTop: 0,
    },
    statCardHeader: {
      marginBottom: 12,
    },
    statIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statNumber: {
      fontSize: isMobile ? 28 : 32,
      fontWeight: 'bold',
      letterSpacing: -1,
    },
    statLabel: {
      fontSize: isMobile ? 11 : 13,
      color: textSecondary,
      marginTop: 4,
      fontWeight: '500',
    },

    // Interactive Donut Chart Styles
    donutChartContainer: {
      marginHorizontal: isMobile ? 16 : 24,
      marginVertical: isMobile ? 16 : 20,
      borderRadius: 24,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.4 : 0.1,
      shadowRadius: 24,
      elevation: 8,
    },
    donutGradient: {
      padding: isMobile ? 20 : 24,
    },
    donutHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 20,
    },
    donutHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    donutIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    donutTitle: {
      fontSize: isMobile ? 17 : 19,
      fontWeight: 'bold',
      color: text,
    },
    donutSubtitle: {
      fontSize: isMobile ? 12 : 13,
      color: textMuted,
      marginTop: 2,
    },
    donutTotalBadge: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 16,
      alignItems: 'center',
    },
    donutTotalBadgeText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: accent.primary,
    },
    donutTotalBadgeLabel: {
      fontSize: 11,
      color: textMuted,
      marginTop: 2,
    },
    donutChartWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 20,
    },
    donutCenterLabel: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    donutCenterValue: {
      fontSize: 32,
      fontWeight: 'bold',
      color: text,
    },
    donutCenterText: {
      fontSize: 13,
      color: textSecondary,
      marginTop: 4,
    },

    // Interactive Legend
    interactiveLegendContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 8,
    },
    interactiveLegendItem: {
      flex: 1,
      minWidth: isMobile ? '45%' : '30%',
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    interactiveLegendItemSelected: {
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
      transform: [{ scale: 1.02 }],
    },
    interactiveLegendItemHovered: {
      opacity: 0.9,
    },
    legendGradient: {
      padding: 14,
      minHeight: 90,
    },
    legendContent: {
      flex: 1,
    },
    legendIconRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    legendPercent: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#ffffff',
    },
    legendLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: 4,
    },
    legendCount: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.8)',
    },
    selectedIndicator: {
      position: 'absolute',
      top: 10,
      right: 10,
    },

    // Selected Details Panel
    selectedDetailsContainer: {
      marginTop: 16,
      borderRadius: 16,
      overflow: 'hidden',
    },
    selectedDetailsGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      gap: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    selectedDetailsText: {
      flex: 1,
    },
    selectedDetailsTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 2,
    },
    selectedDetailsDescription: {
      fontSize: 13,
      color: textSecondary,
    },
    exploreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
    },
    exploreButtonText: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '600',
    },

    // Empty State
    donutChartEmptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    donutChartEmptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: text,
      marginTop: 16,
    },
    donutChartEmptySubtext: {
      fontSize: 14,
      color: textMuted,
      marginTop: 8,
    },

    // Two Column Layout
    twoColumnLayout: {
      flexDirection: isDesktop ? 'row' : 'column',
      paddingHorizontal: isMobile ? 12 : 16,
      marginTop: isMobile ? 12 : 16,
      gap: 12,
      paddingBottom: 24,
      marginBottom:100,
    },
    column: {
      flex: 1,
      minWidth: isMobile ? '100%' : 260,
      
    },
    upcomingColumn: {
      flex: 1,
    },

    // Card Styles with Gradients
    upcomingCard: {
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 8,
      elevation: 3,
      marginBottom: 12,
    },
    announcementCard: {
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 8,
      elevation: 3,
    },
    cardGradient: {
      padding: isMobile ? 12 : 16,
      flex: 1,
    },
    // Section Headers
    upcomingHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,                     
    },
    sectionTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,                               
    },
    sectionIcon: {
      width: 32,                             
      height: 32,                           
      borderRadius: 8,                       
      justifyContent: 'center',
      alignItems: 'center',
    },
    upcomingTitle: {
      fontSize: isMobile ? 14 : 16,        
      fontWeight: 'bold',
      color: text,
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    viewAllText: {
      fontSize: isMobile ? 13 : 14,
      color: accent.primary,
      fontWeight: '600',
    },

    // List Styles
    upcomingList: {
      gap: 12,
    },
    upcomingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
      borderRadius: 12,                      // ✅ smaller radius
      padding: 8,                            // ✅ smaller padding
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    },
    registeredItem: {
      backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.05)',
      borderColor: 'rgba(16,185,129,0.2)',
    },
    eventDateGradient: {
      width: 40,
      height: 40,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    eventDay: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#ffffff',
    },
    eventMonth: {
      fontSize: 9,
      color: 'rgba(255,255,255,0.9)',
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    eventInfo: {
      flex: 1,
    },
    eventName: {
      fontSize: 13,
      fontWeight: '600',
      color: text,
      marginBottom: 2,
    },
    eventMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    eventTime: {
      fontSize: 12,
      color: textSecondary,
    },
    eventMetaDivider: {
      fontSize: 12,
      color: textMuted,
    },
    registeredBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 6,
    },
    registeredBadgeText: {
      fontSize: 11,
      color: '#10b981',
      fontWeight: '600',
    },
    chevronContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Announcement Styles
    announcementHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    announcementTitle: {
      fontSize: isMobile ? 14 : 16,         
      fontWeight: 'bold',
      color: text,
    },
    announcementList: {
      gap: 12,
    },
    announcementItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
      borderRadius: 12,
      padding: 10,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    },
    announcementBadge: {
      width: 32,
      height: 32,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
      borderWidth: 1.5,
    },
    announcementContent: {
      flex: 1,
    },
    announcementText: {
      fontSize: 13,
      fontWeight: '600',
      color: text,
      marginBottom: 4,
    },
    announcementMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    announcementTime: {
      fontSize: 12,
      color: textMuted,
    },
    announcementMetaDivider: {
      fontSize: 12,
      color: textMuted,
    },
    announcementAuthor: {
      fontSize: 12,
      color: textSecondary,
      fontWeight: '500',
    },
    priorityBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
    },
    priorityText: {
      fontSize: 10,
      fontWeight: 'bold',
      textTransform: 'uppercase',
    },

    // Loading & Empty States
    loadingContainer: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    loadingText: {
      fontSize: 14,
      color: textMuted,
      marginTop: 12,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: '500',
      color: textSecondary,
      marginBottom: 16,
    },
    createButton: {
      borderRadius: 24,
      overflow: 'hidden',
    },
    createButtonGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 20,
    },
    createButtonText: {
      fontSize: 14,
      color: '#ffffff',
      fontWeight: '600',
    },
  });
};
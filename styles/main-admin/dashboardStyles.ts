import { Dimensions, StyleSheet } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export const createDashboardStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentArea: {
    flex: 1,
  },
  overviewContainer: {
    flex: 1,
    backgroundColor: colors.background,
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
  userDistributionColumn: {
    flex: 2.2,
    minWidth: 320,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCardGrid: {
    flex: 0.8,
    minWidth: 180,
    margin: 0,
  },
  statsGridContainer: {
    flex: 1,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.2 : 0.05,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 280,
  },
  statsColumn: {
    flex: 1,
    minWidth: 280,
  },
  greetingText: {
    fontSize: 14,
    color: colors.sidebar.text.muted,
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
    color: colors.sidebar.text.muted,
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
    color: isDark ? colors.sidebar.text.secondary : '#ffffff',
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
    backgroundColor: 'rgba(255,255,255,0.1)',
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
  statCard: {
    flex: 1,
    minWidth: '42%',
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 10,
    borderWidth: 0,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderRightColor: isDark ? '#3b82f6' : '#1266d4',
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  statIconContainer: {
    width: 26,
    height: 26,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: colors.sidebar.text.secondary,
    fontWeight: '500',
  },
  statSubtext: {
    fontSize: 10,
    color: colors.sidebar.text.muted,
    marginTop: 2,
  },
  statExpand: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statProgress: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  statProgressBar: {
    height: '100%',
    borderRadius: 2,
  },
  statDetail: {
    fontSize: 11,
    color: colors.accent.primary,
    fontWeight: '600',
    textAlign: 'right',
  },
  chartsContainer: {
    backgroundColor: colors.card,
    borderRadius: 24,
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 20,
    shadowColor: isDark ? '#000' : '#0ea5e9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.4 : 0.12,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)',
  },

  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },

  chartsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
    letterSpacing: -0.5,
  },

  chartsSubtitle: {
    fontSize: 13,
    color: colors.sidebar.text.secondary,
    fontWeight: '500',
  },

  chartLegend: {
    flexDirection: 'row',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },

  legendButton: {
    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(248, 250, 252, 0.9)',
    borderWidth: 1.5,
    borderColor: isDark ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },

  legendText: {
    fontSize: 13,
    fontWeight: '700',
  },

  legendValue: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 4,
  },

  legendValueText: {
    fontSize: 12,
    fontWeight: '800',
  },

  chartWrapper: {
    position: 'relative',
    borderRadius: 16,
    marginVertical: 8,
    paddingTop: 8,
  },

  chartBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },

  chartScrollContent: {
    paddingRight: 16,
    paddingLeft: 4,
  },

  chart: {
    borderRadius: 16,
    marginVertical: 8,
    paddingRight: 16,
  },

  axisLabelContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },

  axisLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  dataPointsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 40,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    pointerEvents: 'none',
  },

  dataPointTooltip: {
    alignItems: 'center',
    marginBottom: 8,
  },

  tooltipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },

  tooltipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0ea5e9',
  },


  chartSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)',
  },

  summaryItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: isDark ? 'rgba(14, 165, 233, 0.1)' : 'rgba(240, 249, 255, 0.8)',
    borderColor: isDark ? 'rgba(14, 165, 233, 0.2)' : 'rgba(14, 165, 233, 0.15)',
  },
  summaryItemBlue: {
    backgroundColor: isDark ? '#0ea5e920' : '#f0f9ff',
    borderColor: isDark ? '#0ea5e940' : '#0ea5e920',
  },
  summaryItemGreen: {
    backgroundColor: isDark ? '#10b98120' : '#f0fdf4',
    borderColor: isDark ? '#10b98140' : '#10b98120',
  },
  summaryItemPurple: {
    backgroundColor: isDark ? '#8b5cf620' : '#faf5ff',
    borderColor: isDark ? '#8b5cf640' : '#8b5cf620',
  },
  summaryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: isDark ? 'rgba(14, 165, 233, 0.2)' : '#ffffff',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.5,
  },

  summaryLabel: {
    fontSize: 10,
    color: colors.sidebar.text.secondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  twoColumnLayout: {
    flexDirection: 'row',
    gap: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'stretch',
  },
  column: {
    flex: 1,
  },
  activityColumn: {
    flex: 7,
  },
  upcomingColumn: {
    flex: 3,
  },
  monthlyActivityColumn: {
    flex: 2.2,
    minWidth: 320,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  activityList: {
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
  activityItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lastActivityItem: {
    borderBottomWidth: 0,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  activityTime: {
    fontSize: 11,
    color: colors.sidebar.text.muted,
    fontWeight: '500',
  },
  activityDescription: {
    fontSize: 13,
    color: colors.sidebar.text.secondary,
  },
  emptyActivity: {
    alignItems: 'center',
    padding: 32,
  },
  emptyActivityText: {
    fontSize: 14,
    color: colors.sidebar.text.muted,
    marginTop: 12,
  },
  upcomingCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  upcomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  viewAllText: {
    fontSize: 12,
    color: colors.accent.primary,
    fontWeight: '600',
  },
  upcomingList: {
    gap: 12,
  },
  upcomingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  eventDate: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: isDark ? '#334155' : '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDark ? '#475569' : '#e2e8f0',
  },
  eventDay: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  eventMonth: {
    fontSize: 10,
    color: colors.sidebar.text.secondary,
    fontWeight: '600',
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 11,
    color: colors.sidebar.text.secondary,
    marginBottom: 2,
  },
  eventAction: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: isDark ? '#334155' : '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDark ? '#475569' : '#e2e8f0',
  },
  announcementCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  announcementList: {
    gap: 12,
  },
  announcementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  announcementBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  announcementContent: {
    flex: 1,
  },
  announcementText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  announcementTime: {
    fontSize: 10,
    color: colors.sidebar.text.muted,
    fontWeight: '500',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
    gap: 4,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent.primary,
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
    color: colors.text,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: colors.sidebar.text.secondary,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.sidebar.text.muted,
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  eventAttendees: {
    fontSize: 10,
    color: '#10b981',
    marginTop: 2,
    fontWeight: '500',
  },
  approvalBadge: {
    backgroundColor: '#f59e0b',
  },
  roleDistributionContainer: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.08,
    shadowRadius: 12,
    elevation: 4,
    height: '100%',
    minHeight: 220,
    justifyContent: 'space-between',
  },

  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  roleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  roleTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },

  roleSubtitle: {
    fontSize: 14,
    color: colors.sidebar.text.secondary,
    fontWeight: '500',
  },
  roleTotalBadge: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },

  roleBarsContainer: {
    gap: 16,
    flex: 1,
    justifyContent: 'center',
  },

  roleBarRow: {
    gap: 8,
  },
  roleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },

  roleLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  roleIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  roleLabel: {
    fontSize: 13,
    fontWeight: '600',
  },


  roleBarWrapper: {
    height: 12,
    justifyContent: 'center',
  },

  roleBarBackground: {
    height: 12,
    backgroundColor: isDark ? '#334155' : '#f1f5f9',
    borderRadius: 6,
    overflow: 'hidden',
  },
  roleBarTrack: {
    height: 28,
    backgroundColor: isDark ? 'rgba(51, 65, 85, 0.5)' : '#f1f5f9',
    borderRadius: 8,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },

  roleBarFill: {
    height: '100%',
    borderRadius: 8,
    justifyContent: 'center',
    minWidth: 4,
  },
  roleValueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  roleBarLabel: {
    paddingHorizontal: 10,
  },

  roleBarPercentage: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  rolePercentageOutside: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
  },
  roleValue: {
    fontSize: 15,
    fontWeight: '700',
  },

  rolePercentage: {
    fontSize: 14,
    fontWeight: '700',
  },

  roleTotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1.5,
  },

  roleTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
  },

  roleTotalValue: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  // Charts Grid Layout
  chartsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    marginTop: 10,
  },
  chartColumn: {
    flex: 1,
  },
  lineChartColumn: {
    flex: 2.2,
  },
  donutChartColumn: {
    flex: 1, 
    minWidth: 320,
  },

  // Donut Chart Styles
  donutChartContainer: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    height: '100%',
    justifyContent: 'space-between',
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
    gap: 10,
  },

  donutTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  donutTotalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 13,
    fontWeight: '600',
  },

  donutChartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    height: 200,
    position: 'relative',
  },

  donutCenterLabel: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  donutCenterValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },

  donutCenterText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },

  
  externalLabelContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -35, 
    marginTop: -25, 
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    width: 70,
  },

  externalLabelBubble: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },

  externalLabelPercent: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },

  externalLabelArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },

  progressLegendPercentContainer: {
    minWidth: 50,
    alignItems: 'flex-end',
  },
  donutLegendContainer: {
    marginTop: 10,
    gap: 8,
  },
  donutLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  donutLegendIcon: {
    width: 18,
    height: 18,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  donutLegendContent: {
    flex: 1,
  },
  donutLegendLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  donutLegendValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  donutLegendValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  donutLegendPercent: {
    fontSize: 12,
    fontWeight: '600',
  },
  donutLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },

  // Progress Bar Legend Styles
  progressLegendContainer: {
    marginTop: 16,
    gap: 14,
  },

  progressLegendItem: {
    width: '100%',
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },

  progressLegendItemFocused: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
  },

  progressLegendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },

  progressLegendIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  progressLegendInfo: {
    flex: 1,
  },

  progressLegendLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },

  progressLegendCount: {
    fontSize: 12,
    fontWeight: '500',
  },

  progressLegendPercent: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'right',
  },

  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },

  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
 
  customBarChartContainer: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.2 : 0.05,
    shadowRadius: 8,
    elevation: 2,
    flex: 1,
    justifyContent: 'space-between',
  },
  customBarChartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  customBarChartHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customBarChartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  customBarChartTotalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  customBarChartLegend: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  customLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  customLegendText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.sidebar.text.secondary,
  },
  customBarChartScrollContent: {
    paddingHorizontal: 4,
  },
  customBarsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 24,
  },
  customMonthColumn: {
    alignItems: 'center',
    width: 70,
  },
  customMonthLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  customBarsWrapper: {
    height: 160,
    justifyContent: 'flex-end',
  },
  customBarPair: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  customBarItem: {
    alignItems: 'center',
    width: 28,
  },
  customBar: {
    width: 28,
    minHeight: 4,
    borderRadius: 6,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 4,
  },
  customBarValue: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  customBarChartFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  customBarChartFooterText: {
    fontSize: 11,
    color: colors.sidebar.text.muted,
    fontWeight: '500',
  },
  

  statsGridEnhanced: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
    gap: 12,
  },
  statCardEnhanced: {
    width: '48%',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center', 
    justifyContent: 'center',
    position: 'relative',
  },

  statCardHeaderEnhanced: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
    position: 'relative',
  },

  statIconEnhanced: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  trendBadgeEnhanced: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },

  trendTextEnhanced: {
    fontSize: 12,
    fontWeight: '600',
  },
  statNumberEnhanced: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.5,
  },

  statLabelEnhanced: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },

  statSubtextEnhanced: {
    fontSize: 11,
    fontWeight: '500',
  },

  statStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },

  approvalBadgeEnhanced: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },

  approvalBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },

 
  yearlyBarChartScrollContent: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  yearlyBarsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16, 
    paddingRight: 16,
  },

  yearlyMonthColumn: {
    alignItems: 'center',
    width: 50, 
    minWidth: 50,
  },

  yearlyMonthLabel: {
    fontSize: 11, 
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },

  yearlyBarsWrapper: {
    height: 140,
    justifyContent: 'flex-end',
  },

  yearlyBarPair: {
    flexDirection: 'row',
    gap: 4, 
    alignItems: 'flex-end',
  },

  yearlyBarItem: {
    alignItems: 'center',
    width: 20, 
  },

  yearlyBar: {
    width: 20,
    minHeight: 4,
    borderRadius: 4,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 2,
  },

  yearlyBarValue: {
    color: '#ffffff',
    fontSize: 9, 
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  ...(screenWidth < 768 && {
    chartsGrid: {
      flexDirection: 'column',
      gap: 16,
    },
    chartColumn: {
      flex: 1,
      width: '100%',
    },
    lineChartColumn: {
      flex: 1,
    },
    donutChartColumn: {
      flex: 1,
      minWidth: 'auto',
    },
    twoColumnLayout: {
      flexDirection: 'column',
    },
    monthlyActivityColumn: {
      flex: 1,
      width: '100%',
    },
    statsColumn: {
      flex: 1,
      width: '100%',
    },
    customMonthColumn: {
      width: 60,
    },
    customBarItem: {
      width: 22,
    },
    customBar: {
      width: 22,
    },
    customBarsContainer: {
      gap: 16,
    },
  }),
});
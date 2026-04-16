import { Dimensions, StyleSheet } from 'react-native'

const { width: screenWidth } = Dimensions.get('window')
const isMobile = screenWidth < 768
const isTablet = screenWidth >= 768 && screenWidth < 1024

export const createProfileStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    // ─── Root & Container ───────────────────────────────────────────────────
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: isMobile ? 12 : 20,
      paddingTop: 12,
      paddingBottom: 24,
      gap: 12,
    },

    // ─── Header (PRESERVED - UNCHANGED) ────────────────────────────────────
    headerGradient: {
      paddingTop: 20,
      paddingBottom: 12,
      paddingHorizontal: 24,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    greetingText: {
      fontSize: 13,
      fontWeight: '500',
      letterSpacing: 0.3,
      opacity: 0.85,
      marginBottom: 2,
    },
    userName: {
      fontSize: 26,
      fontWeight: '800',
      color: '#ffffff',
      marginBottom: 2,
      letterSpacing: -0.8,
    },
    roleText: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 1,
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
      fontSize: 18,
      fontWeight: '700',
    },
    dateSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    dateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
    },
    dateText: {
      fontSize: 12,
      fontWeight: '500',
      letterSpacing: 0.2,
      marginLeft: -8,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 10,
    },
    headerAction: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    logoutHeaderButton: {
      backgroundColor: 'rgba(239,68,68,0.15)',
      borderColor: 'rgba(239,68,68,0.3)',
    },

    // ─── Hero Card (Compact) ────────────────────────────────────────────────
    heroCard: {
      backgroundColor: colors.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      shadowColor: isDark ? '#000' : '#0f172a',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.06,
      shadowRadius: 12,
      elevation: 4,
    },
    heroCardContent: {
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'center' : 'flex-start',
      padding: 16,
      gap: 12,
    },

    // Avatar Section (Smaller)
    avatarSection: {
      alignItems: 'center',
      position: 'relative',
    },
    avatarButton: {
      width: 80,
      height: 80,
      borderRadius: 40,
      overflow: 'hidden',
      position: 'relative',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: 40,
    },
    avatarFallback: {
      width: '100%',
      height: '100%',
      backgroundColor: isDark ? 'rgba(14,165,233,0.2)' : '#e0f2fe',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 40,
      borderWidth: 2,
      borderColor: '#0ea5e9',
    },
    avatarInitials: {
      fontSize: 28,
      fontWeight: '800',
      color: '#0ea5e9',
    },
    avatarEditOverlay: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      left: 0,
      height: 24,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#d1fae5',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.3)',
    },
    statusIndicator: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#10b981',
    },
    statusText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#10b981',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },

    // Identity Section (Smaller)
    identitySection: {
      flex: 1,
      alignItems: isMobile ? 'center' : 'flex-start',
    },
    identityName: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.5,
      marginBottom: 2,
    },
    identityEmail: {
      fontSize: 13,
      color: colors.sidebar?.text?.secondary || '#64748b',
      fontWeight: '500',
      marginBottom: 12,
    },
    roleBadge: {
      borderRadius: 20,
      overflow: 'hidden',
      marginBottom: 8,
      shadowColor: '#0ea5e9',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    roleBadgeGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    roleBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#ffffff',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    memberSince: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    memberSinceText: {
      fontSize: 11,
      color: colors.sidebar?.text?.muted || '#94a3b8',
      fontWeight: '500',
    },

    // Stats Grid (Tighter)
    statsGrid: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: isDark
        ? 'rgba(255,255,255,0.02)'
        : 'rgba(248,250,252,0.8)',
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
      borderRightWidth: 1,
      borderRightColor: colors.border,
    },
    statItemFirst: {
      borderLeftWidth: 0,
    },
    statItemLast: {
      borderRightWidth: 0,
    },
    statIconContainer: {
      width: 28,
      height: 28,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    statValue: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.5,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.sidebar?.text?.muted || '#94a3b8',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },

    // ─── Section Container (Compact) ────────────────────────────────────────
    section: {
      backgroundColor: colors.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      shadowColor: isDark ? '#000' : '#0f172a',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sectionTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    sectionIconContainer: {
      width: 28,
      height: 28,
      borderRadius: 6,
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
      justifyContent: 'center',
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: -0.2,
    },
    refreshButton: {
      width: 28,
      height: 28,
      borderRadius: 6,
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
      justifyContent: 'center',
      alignItems: 'center',
    },

    // ─── Quick Access Grid (Smaller tiles) ─────────────────────────────────
    quickGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: 12,
      gap: 8,
    },
    quickTile: {
      width: isMobile ? '47%' : '23%',
      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
      borderRadius: 14,
      padding: 12,
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: colors.border,
      position: 'relative',
    },
    quickTileIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
    },
    quickTileLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    quickTileArrow: {
      position: 'absolute',
      top: 8,
      right: 8,
    },

    // ─── Account Information (Tighter rows) ─────────────────────────────────
    infoList: {
      paddingHorizontal: 16,
      paddingVertical: 4,
    },
    infoItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    infoItemLast: {
      borderBottomWidth: 0,
    },
    infoItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    infoIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
      justifyContent: 'center',
      alignItems: 'center',
    },
    infoIconContainerHighlight: {
      backgroundColor: isDark ? 'rgba(14,165,233,0.15)' : '#e0f2fe',
    },
    infoLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.sidebar?.text?.secondary || '#64748b',
    },
    infoItemRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
      justifyContent: 'flex-end',
    },
    infoValue: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'right',
    },
    infoValueHighlight: {
      color: '#0ea5e9',
    },
    copyButton: {
      padding: 6,
      borderRadius: 6,
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
    },

    // ─── Analytics Section (More compact) ───────────────────────────────────
    analyticsContent: {
      padding: 16,
      gap: 14,
    },

    // Metrics Row
    metricsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    metricCard: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      gap: 8,
    },
    metricCardLarge: {
      flex: 1,
    },
    metricHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    metricIconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    metricTrend: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 16,
    },
    metricTrendText: {
      fontSize: 11,
      fontWeight: '700',
    },
    metricBody: {
      gap: 2,
    },
    metricValue: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.8,
    },
    metricLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.sidebar?.text?.muted || '#94a3b8',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    metricFooter: {
      marginTop: 4,
    },
    metricBar: {
      height: 4,
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
      borderRadius: 2,
      overflow: 'hidden',
    },
    metricBarFill: {
      height: '100%',
      borderRadius: 2,
    },

    // Status Grid
    statusGrid: {
      flexDirection: 'row',
      gap: 8,
    },
    statusItem: {
      flex: 1,
      borderRadius: 14,
      padding: 12,
      alignItems: 'center',
      gap: 4,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    statusHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statusValue: {
      fontSize: 18,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    statusLabel: {
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      opacity: 0.8,
    },

    // Chart Container
    chartContainer: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      gap: 12,
    },
    chartHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 2,
    },
    chartTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: -0.2,
    },
    chartSubtitle: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.sidebar?.text?.muted || '#94a3b8',
    },
    chartContent: {
      gap: 12,
    },
    chartRow: {
      gap: 6,
    },
    chartRowHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    chartRowMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    chartDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    chartRowLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    chartRowValue: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.sidebar?.text?.secondary || '#64748b',
    },
    chartTrack: {
      height: 6,
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
      borderRadius: 3,
      overflow: 'hidden',
    },
    chartFill: {
      height: '100%',
      borderRadius: 3,
    },

    // Rate Container
    rateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
    },
    rateVisual: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    rateRing: {
      width: 70,
      height: 70,
      borderRadius: 35,
      borderWidth: 6,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
    },
    ratePercent: {
      fontSize: 18,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    rateDetails: {
      flex: 1,
      gap: 4,
    },
    rateTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: -0.2,
    },
    rateDescription: {
      fontSize: 11,
      color: colors.sidebar?.text?.secondary || '#64748b',
      lineHeight: 16,
      fontWeight: '500',
    },
    rateProgress: {
      marginTop: 4,
    },
    rateTrack: {
      height: 6,
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
      borderRadius: 3,
      overflow: 'hidden',
    },
    rateFill: {
      height: '100%',
      borderRadius: 3,
    },

    // ─── Logout Card (Smaller) ──────────────────────────────────────────────
    logoutCard: {
      backgroundColor: isDark ? 'rgba(239,68,68,0.08)' : '#fef2f2',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.15)',
      overflow: 'hidden',
      marginTop: 2,
    },
    logoutContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      gap: 12,
    },
    logoutIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoutTextContainer: {
      flex: 1,
      gap: 2,
    },
    logoutTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: '#ef4444',
      letterSpacing: -0.2,
    },
    logoutSubtitle: {
      fontSize: 11,
      fontWeight: '500',
      color: isDark ? 'rgba(239,68,68,0.7)' : 'rgba(239,68,68,0.6)',
    },

    // ─── Footer (Reduced) ───────────────────────────────────────────────────
    footer: {
      alignItems: 'center',
      paddingVertical: 20,
      gap: 4,
      marginTop: 4,
    },
    footerBrand: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: -0.2,
    },
    footerVersion: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.sidebar?.text?.muted || '#94a3b8',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
  })

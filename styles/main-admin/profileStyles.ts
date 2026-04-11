import { Dimensions, StyleSheet } from 'react-native'

const { width: screenWidth } = Dimensions.get('window')
const isMobile = screenWidth < 768

export const createProfileStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    // ─── Root ────────────────────────────────────────────────────────────────
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 40,
      gap: 14,
    },

    // ─── Header Gradient (full width) ────────────────────────────────────────
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

    // Date row + header actions
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

    // ─── Profile Identity Card ────────────────────────────────────────────────
    identityCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      shadowColor: isDark ? '#000' : '#64748b',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.07,
      shadowRadius: 16,
      elevation: 4,
    },
    identityAccent: {
      height: 4,
    },
    identityBody: {
      padding: 20,
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'center' : 'flex-start',
      gap: 16,
    },

    // Large avatar inside card
    largeAvatarWrapper: {
      position: 'relative',
    },
    largeAvatarButton: {
      width: 88,
      height: 88,
      borderRadius: 44,
      overflow: 'hidden',
      borderWidth: 3,
      borderColor: '#0ea5e9',
      shadowColor: '#0ea5e9',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 6,
    },
    largeAvatarImage: {
      width: '100%',
      height: '100%',
    },
    largeAvatarFallback: {
      flex: 1,
      backgroundColor: isDark ? 'rgba(14,165,233,0.2)' : '#e0f2fe',
      justifyContent: 'center',
      alignItems: 'center',
    },
    largeAvatarInitials: {
      fontSize: 30,
      fontWeight: '800',
      color: '#0ea5e9',
      letterSpacing: -1,
    },
    largeAvatarEditBadge: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#0ea5e9',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.card,
    },

    identityDetails: {
      flex: 1,
      alignItems: isMobile ? 'center' : 'flex-start',
    },
    identityName: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.5,
      marginBottom: 3,
    },
    identityEmail: {
      fontSize: 13,
      color: colors.sidebar?.text?.secondary || '#64748b',
      fontWeight: '500',
      marginBottom: 10,
    },
    rolePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(14,165,233,0.15)' : '#e0f2fe',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(14,165,233,0.3)' : 'rgba(14,165,233,0.25)',
      alignSelf: isMobile ? 'center' : 'flex-start',
    },
    rolePillDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: '#0ea5e9',
    },
    rolePillText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#0ea5e9',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },

    // ─── Stats Row ────────────────────────────────────────────────────────────
    statsRow: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    statCell: {
      flex: 1,
      paddingVertical: 14,
      alignItems: 'center',
      gap: 2,
    },
    statDivider: {
      width: 1,
      backgroundColor: colors.border,
    },
    statValue: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.5,
    },
    statLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.sidebar?.text?.muted || '#94a3b8',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },

    // ─── Section shell ────────────────────────────────────────────────────────
    sectionCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      shadowColor: isDark ? '#000' : '#64748b',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDark ? 0.22 : 0.05,
      shadowRadius: 12,
      elevation: 3,
    },
    sectionHeader: {
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.sidebar?.text?.muted || '#94a3b8',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },

    // ─── Quick Action Grid ────────────────────────────────────────────────────
    quickGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: 12,
      gap: 10,
    },
    quickTile: {
      width: isMobile ? '46%' : '22%',
      flexGrow: 1,
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 14,
      paddingHorizontal: 12,
      alignItems: 'center',
      gap: 8,
    },
    quickTileIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    quickTileLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },

    // ─── Account info list ────────────────────────────────────────────────────
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    infoRowLast: {
      borderBottomWidth: 0,
    },
    infoLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.sidebar?.text?.secondary || '#64748b',
    },
    infoValue: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
      maxWidth: '55%',
      textAlign: 'right',
    },

    // ─── Logout ───────────────────────────────────────────────────────────────
    logoutCard: {
      backgroundColor: isDark ? 'rgba(239,68,68,0.08)' : '#fef2f2',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.15)',
      overflow: 'hidden',
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 15,
      gap: 10,
    },
    logoutText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#ef4444',
      letterSpacing: 0.2,
    },

    // ─── Footer ───────────────────────────────────────────────────────────────
    footer: {
      alignItems: 'center',
      paddingVertical: 20,
      gap: 3,
    },
    footerText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.sidebar?.text?.muted || '#94a3b8',
    },
    footerSub: {
      fontSize: 10,
      color: colors.sidebar?.text?.muted || '#94a3b8',
      opacity: 0.7,
    },

    // ─── Upload overlay (if needed) ───────────────────────────────────────────
    uploadOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 44,
    },

    // ─── Analytics section ────────────────────────────────────────────────────
    analyticsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      padding: 14,
    },

    highlightCard: {
      flex: 1,
      minWidth: isMobile ? '45%' : '22%',
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      gap: 6,
    },
    highlightIconRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    highlightIconBox: {
      width: 34,
      height: 34,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    highlightTrend: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    highlightTrendText: {
      fontSize: 10,
      fontWeight: '700',
    },
    highlightValue: {
      fontSize: 26,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.8,
      marginTop: 4,
    },
    highlightLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.sidebar?.text?.muted || '#94a3b8',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },

    chartBlock: {
      width: '100%',
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      gap: 12,
    },
    chartBlockTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: -0.2,
    },
    chartBlockSub: {
      fontSize: 11,
      color: colors.sidebar?.text?.muted || '#94a3b8',
      marginTop: -8,
    },
    barRow: {
      gap: 6,
    },
    barMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    barMetaLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },
    barDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    barLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },
    barValueText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.sidebar?.text?.secondary || '#64748b',
    },
    barTrack: {
      height: 8,
      backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
      borderRadius: 4,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 4,
    },

    statusRow: {
      flexDirection: 'row',
      gap: 8,
      width: '100%',
    },
    statusCell: {
      flex: 1,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 10,
      alignItems: 'center',
      gap: 4,
    },
    statusCellValue: {
      fontSize: 20,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    statusCellLabel: {
      fontSize: 10,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },

    rateBlock: {
      width: '100%',
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    rateRing: {
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 7,
      justifyContent: 'center',
      alignItems: 'center',
    },
    rateRingValue: {
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    rateInfo: {
      flex: 1,
      gap: 4,
    },
    rateTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    rateSub: {
      fontSize: 11,
      color: colors.sidebar?.text?.secondary || '#64748b',
      lineHeight: 16,
    },
    rateBarTrack: {
      height: 6,
      backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
      borderRadius: 3,
      overflow: 'hidden',
      marginTop: 4,
    },
    rateBarFill: {
      height: '100%',
      borderRadius: 3,
    },
    combinedNote: {
      fontSize: 10,
      color: colors.sidebar?.text?.muted,
      textAlign: 'center',
      marginTop: 8,
    },
    highlightCardRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 14,
      gap: 12,
    },
    highlightCardLeft: {
      flex: 1,
      gap: 6,
    },
    highlightCardRight: {
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 50,
    },
  })

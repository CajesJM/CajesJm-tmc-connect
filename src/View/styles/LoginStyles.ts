import { Dimensions, Platform, StyleSheet } from 'react-native'
import { ThemeColors } from '../../Controller/context/ThemeContext'

const { width, height } = Dimensions.get('window')

export const FONTS = {
  display: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'Georgia, serif',
  }),
  heading: Platform.select({
    ios: 'Helvetica Neue',
    android: 'sans-serif-medium',
    default: "'Helvetica Neue', sans-serif",
  }),
  body: Platform.select({
    ios: 'Helvetica Neue',
    android: 'sans-serif',
    default: "'Helvetica Neue', sans-serif",
  }),
  mono: Platform.select({
    ios: 'Courier New',
    android: 'monospace',
    default: 'monospace',
  }),
}

export const createLoginStyles = (isDark: boolean, colors: ThemeColors) => {
  // === DARK THEME: Deep Navy / Electric Indigo ===
  // === LIGHT THEME: Crisp White / Royal Blue ===

  const accent = isDark ? '#6366F1' : '#4F46E5'
  const accentVibrant = isDark ? '#818CF8' : '#6366F1'
  const accentGlow = isDark ? '#4F46E533' : '#6366F120'

  const rootBg = isDark ? '#080C1A' : '#F0F2FF'
  const cardBg = isDark ? '#0F1629' : '#FFFFFF'
  const cardBorder = isDark ? '#1E2A4A' : '#E2E5FF'

  const inputBg = isDark ? '#131929' : '#F5F6FF'
  const inputBgFocused = isDark ? '#0A0E1F' : '#FFFFFF'
  const inputBorder = isDark ? '#1E2A4A' : '#D0D4F5'
  const inputBorderFocused = isDark ? '#6366F1' : '#4F46E5'

  const textPrimary = isDark ? '#F1F5FF' : '#0F172A'
  const textSecondary = isDark ? '#8892B0' : '#64748B'
  const textMuted = isDark ? '#4A5580' : '#A0A3B5'

  const errorRed = '#EF4444'
  const errorBg = isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.06)'
  const errorBorder = isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.2)'

  const dividerLine = isDark ? '#1A2240' : '#E2E5FF'
  const iconActive = accent
  const iconInactive = isDark ? '#3D4E78' : '#A0A8D0'

  const shadowColor = isDark ? '#000000' : '#4F46E5'

  return StyleSheet.create({
    // ─── ROOT ─────────────────────────────────────────────────
    root: {
      flex: 1,
      backgroundColor: rootBg,
    },

    // ─── HEADER / HERO AREA ───────────────────────────────────
    header: {
      width: '100%',
      height: height * 0.38,
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingBottom: 40,
      // Subtle bottom shape via borderRadius
      borderBottomLeftRadius: 40,
      borderBottomRightRadius: 40,
      overflow: 'hidden',
    },

    // Decorative noise overlay layer (use as absolute child inside header)
    headerOverlay: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.06,
    },

    statusBarSpacer: {
      height: Platform.OS === 'android' ? 28 : 0,
    },

    // ─── LOGO ─────────────────────────────────────────────────
    logoWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
    },

    logoRing: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.25)',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.12)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.4,
      shadowRadius: 24,
      elevation: 16,
    },

    // Keep old name for compatibility
    logoGlow: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.25)',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.12)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.4,
      shadowRadius: 24,
      elevation: 16,
    },

    logo: {
      width: 72,
      height: 72,
      borderRadius: 36,
    },

    appName: {
      marginTop: 16,
      fontSize: 11,
      fontFamily: FONTS.body,
      fontWeight: '700',
      letterSpacing: 5,
      color: 'rgba(255,255,255,0.65)',
      textTransform: 'uppercase',
    },

    // ─── KEYBOARD / SCROLL ────────────────────────────────────
    keyboardView: {
      flex: 1,
    },

    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 32,
      paddingBottom: 48,
    },

    // ─── FORM CARD ────────────────────────────────────────────
    formCard: {
      backgroundColor: cardBg,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: cardBorder,
      padding: 24,
      shadowColor: shadowColor,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.5 : 0.08,
      shadowRadius: 32,
      elevation: 12,
    },

    // ─── TITLE ────────────────────────────────────────────────
    titleRow: {
      marginBottom: 4,
    },

    title: {
      fontSize: 32,
      fontFamily: FONTS.display,
      fontWeight: '700',
      color: textPrimary,
      letterSpacing: -0.8,
      lineHeight: 38,
    },

    titleAccent: {
      fontSize: 32,
      fontFamily: FONTS.display,
      fontWeight: '700',
      color: accent,
      letterSpacing: -0.8,
      lineHeight: 38,
    },

    subtitle: {
      fontSize: 14,
      fontFamily: FONTS.body,
      color: textSecondary,
      marginBottom: 28,
      lineHeight: 20,
      letterSpacing: 0.1,
    },

    // ─── INPUT FIELDS ─────────────────────────────────────────
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: inputBg,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: inputBorder,
      paddingHorizontal: 16,
      marginBottom: 14,
      height: 56,
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },

    inputWrapperFocused: {
      borderColor: inputBorderFocused,
      backgroundColor: inputBgFocused,
      shadowColor: accentGlow,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 10,
      elevation: 2,
    },

    inputIcon: {
      marginRight: 12,
    },

    input: {
      flex: 1,
      height: '100%',
      fontSize: 15,
      fontFamily: FONTS.body,
      color: textPrimary,
      letterSpacing: 0.1,
    },

    eyeButton: {
      padding: 6,
      marginLeft: 4,
    },

    // ─── LABEL (optional above inputs) ────────────────────────
    inputLabel: {
      fontSize: 11,
      fontFamily: FONTS.body,
      fontWeight: '700',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: textMuted,
      marginBottom: 8,
      marginLeft: 2,
    },

    // ─── ERROR BANNER ─────────────────────────────────────────
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: errorBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: errorBorder,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 16,
      gap: 10,
    },

    errorText: {
      flex: 1,
      fontSize: 13,
      fontFamily: FONTS.body,
      color: errorRed,
      lineHeight: 18,
      letterSpacing: 0.1,
    },

    // ─── SIGN IN BUTTON ───────────────────────────────────────
    buttonGradient: {
      borderRadius: 16,
      marginTop: 6,
      shadowColor: accent,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.45,
      shadowRadius: 20,
      elevation: 10,
    },

    button: {
      height: 58,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },

    buttonDisabled: {
      opacity: 0.6,
    },

    buttonText: {
      fontSize: 16,
      fontFamily: FONTS.heading,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.8,
    },

    // ─── BUTTON ARROW ICON AREA ───────────────────────────────
    buttonArrow: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    // ─── FORGOT PASSWORD ──────────────────────────────────────
    forgotRow: {
      alignItems: 'center',
      marginTop: 20,
      paddingVertical: 4,
    },

    forgotText: {
      fontSize: 14,
      fontFamily: FONTS.body,
      fontWeight: '600',
      color: accentVibrant,
      letterSpacing: 0.2,
    },

    // ─── DIVIDER ──────────────────────────────────────────────
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 36,
      gap: 14,
    },

    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: dividerLine,
    },

    dividerLabel: {
      fontSize: 10,
      fontFamily: FONTS.body,
      fontWeight: '700',
      color: textMuted,
      letterSpacing: 2,
      textTransform: 'uppercase',
    },

    // ─── SECURE BADGE (below divider) ─────────────────────────
    secureBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 16,
    },

    secureBadgeText: {
      fontSize: 11,
      fontFamily: FONTS.body,
      color: textMuted,
      letterSpacing: 0.5,
    },

    // ─── VERSION / FOOTER ─────────────────────────────────────
    versionText: {
      fontSize: 11,
      fontFamily: FONTS.mono,
      color: textMuted,
      textAlign: 'center',
      marginTop: 8,
      letterSpacing: 1,
    },

    // ─── THEME TOGGLE (positioned absolute in header) ─────────
    themeToggle: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 50 : 40,
      right: 20,
      zIndex: 10,
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: 'rgba(255,255,255,0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.25)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
  })
}

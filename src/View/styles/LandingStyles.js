import { Dimensions, Platform, StyleSheet } from 'react-native'

const { width, height } = Dimensions.get('window')

export const COLORS = {
  // Richer, deeper gradient — midnight indigo to violet
  gradientStart: '#0B0F2E',
  gradientMid: '#1A1060',
  gradientEnd: '#2D0E6E',

  // Accent — electric periwinkle
  accent: '#7B8CFF',
  accentBright: '#A5B4FC',
  accentGlow: 'rgba(123,140,255,0.35)',

  white: '#FFFFFF',
  whiteHigh: 'rgba(255,255,255,0.96)',
  whiteMid: 'rgba(255,255,255,0.60)',
  whiteLow: 'rgba(255,255,255,0.30)',
  whiteGhost: 'rgba(255,255,255,0.08)',
  whiteHair: 'rgba(255,255,255,0.12)',

  // Orbs — more intentional layering
  orb1: 'rgba(99,102,241,0.18)',
  orb2: 'rgba(139,92,246,0.22)',
  orb3: 'rgba(59,130,246,0.14)',
  orb4: 'rgba(167,139,250,0.10)',

  progressTrack: 'rgba(255,255,255,0.15)',
  progressFill: '#A5B4FC',
}

export const FONTS = {
  display: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'Georgia, serif',
  }),
  body: Platform.select({
    ios: 'Helvetica Neue',
    android: 'sans-serif',
    default: "'Helvetica Neue', sans-serif",
  }),
}

export const LandingStyles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },

  // ── Floating orbs ─────────────────────────────────────────────
  orbsContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  // Top-right large bloom
  orb1: {
    width: width * 0.9,
    height: width * 0.9,
    top: -width * 0.3,
    right: -width * 0.22,
    backgroundColor: COLORS.orb1,
    borderWidth: 1,
    borderColor: 'rgba(165,180,252,0.12)',
  },
  // Bottom-left medium
  orb2: {
    width: width * 0.65,
    height: width * 0.65,
    bottom: height * 0.08,
    left: -width * 0.22,
    backgroundColor: COLORS.orb2,
  },
  // Bottom-right small
  orb3: {
    width: width * 0.45,
    height: width * 0.45,
    bottom: height * 0.28,
    right: -width * 0.1,
    backgroundColor: COLORS.orb3,
  },
  // Center ambient glow
  orb4: {
    width: width * 0.8,
    height: width * 0.8,
    top: height * 0.25,
    left: width * 0.1,
    backgroundColor: COLORS.orb4,
    borderRadius: 999,
  },

  // ── Star / particle layer (rendered via JS in the component) ──
  // (no stylesheet needed — positioned dynamically)

  // ── Main content wrapper ───────────────────────────────────────
  mainContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  // ── Logo section ───────────────────────────────────────────────
  logoSection: {
    alignItems: 'center',
    marginBottom: 42,
  },

  // Outer halo ring — very large, very faint
  logoHaloRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(165,180,252,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },

  // Mid glow ring
  logoGlowRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(123,140,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(165,180,252,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7B8CFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20,
  },

  // Inner ring
  logoInnerRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logo: {
    width: 88,
    height: 88,
    borderRadius: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },

  // ── Text content ───────────────────────────────────────────────
  textContent: {
    alignItems: 'center',
  },

  eyebrow: {
    fontSize: 10,
    fontFamily: FONTS.body,
    fontWeight: '700',
    color: COLORS.accentBright,
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 12,
    opacity: 0.85,
  },

  brandName: {
    fontSize: 46,
    fontFamily: FONTS.display,
    fontWeight: '700',
    color: COLORS.whiteHigh,
    letterSpacing: -1.5,
  },

  brandAccent: {
    fontSize: 46,
    fontFamily: FONTS.display,
    fontWeight: '700',
    color: COLORS.accentBright,
    letterSpacing: -1.5,
  },

  subtitleLine: {
    fontSize: 13,
    fontFamily: FONTS.body,
    color: COLORS.whiteMid,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 10,
  },

  // ── Decorative divider dots ────────────────────────────────────
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.whiteLow,
  },
  dotActive: {
    width: 24,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.accentBright,
    opacity: 0.85,
  },

  // ── Progress section ───────────────────────────────────────────
  progressSection: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 52 : 40,
    left: 32,
    right: 32,
    alignItems: 'center',
    gap: 10,
  },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 12,
  },

  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.progressTrack,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: COLORS.progressFill,
  },

  // Glow cap on the fill end
  progressFillGlow: {
    position: 'absolute',
    right: 0,
    top: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accentBright,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },

  progressPercent: {
    fontSize: 11,
    fontFamily: FONTS.body,
    fontWeight: '700',
    color: COLORS.accentBright,
    minWidth: 30,
    textAlign: 'right',
    letterSpacing: 0.5,
  },

  progressLabel: {
    fontSize: 11,
    fontFamily: FONTS.body,
    color: COLORS.whiteLow,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // ── Loading badge (pill) ──────────────────────────────────────
  loadingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(123,140,255,0.12)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(165,180,252,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginBottom: 16,
  },
  loadingBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentBright,
  },
  loadingBadgeText: {
    fontSize: 11,
    fontFamily: FONTS.body,
    fontWeight: '600',
    color: COLORS.accentBright,
    letterSpacing: 0.8,
  },

  // ── Skip hint ──────────────────────────────────────────────────
  skipHint: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  skipHintText: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: COLORS.whiteLow,
    letterSpacing: 0.8,
    textAlign: 'center',
  },
})

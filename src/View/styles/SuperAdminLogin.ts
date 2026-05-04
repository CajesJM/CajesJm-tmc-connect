import { Dimensions, StyleSheet } from 'react-native'

const { width } = Dimensions.get('window')
const isMobile = width < 768
const isTablet = width >= 768 && width < 1280

export const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    flexDirection: isMobile ? 'column' : 'row',
    backgroundColor: '#9c9b9b00',
    minHeight: '100%' as any,
  },

  leftColumn: {
    flex: isMobile ? 0 : 1.15,
    padding: isMobile ? 32 : 48,
    justifyContent: 'center',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: 100,
    borderBottomRightRadius: 100,

    shadowColor: '#000',
    shadowOffset: { width: 10, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 15,
    zIndex: 2,
  },
  logoImage1: {
    width: 200,
    height: 200,
    marginBottom: -60,
    marginTop: -60,
    marginLeft: 70,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: isMobile ? 32 : 52,
  },
  logoImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1.5,
  },
  logoSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9ac8ff',
    letterSpacing: 2,
    textTransform: 'uppercase' as any,
    marginTop: 1,
  },

  // Headline
  headlineTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(14,165,233,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.25)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  headlineTagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0ea5e9',
  },
  headlineTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0ea5e9',
    letterSpacing: 0.8,
    textTransform: 'uppercase' as any,
  },

  welcomeTitle: {
    fontSize: isMobile ? 28 : 42,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 16,
    lineHeight: isMobile ? 44 : 58,
    letterSpacing: -0.8,
    maxWidth: 420,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },

  welcomeTitleAccent: {
    color: '#7bc5ff',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#e0e7ff',
    marginBottom: 48,
    lineHeight: 26,
    maxWidth: 380,
    fontWeight: '500',
  },

  // Feature Cards Grid
  featuresGrid: {
    flexDirection: 'row' as any,
    flexWrap: 'wrap' as any,
    gap: 12,
    maxWidth: 420,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    width: isMobile ? ('45%' as any) : 178,
  },
  featureIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(14,165,233,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#e2e8f0',
    flexShrink: 1,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 28,
    marginTop: 40,
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9ca3af',
    marginTop: 2,
    letterSpacing: 0.3,
  },

  rightColumn: {
    flex: isMobile ? 1 : 0.85,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    padding: isMobile ? 20 : 40,
  },
  card: {
    width: '100%',
    maxWidth: isTablet ? 500 : 440,
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: isMobile ? 28 : 40,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  // Card Header
  cardHeader: {
    marginBottom: 32,
  },
  cardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  cardBadgeIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(14,165,233,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0ea5e9',
    letterSpacing: 1,
    textTransform: 'uppercase' as any,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 14,
    color: '#5b6e8c',
    fontWeight: '500',
    lineHeight: 22,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginBottom: 28,
  },

  // Input Fields
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    letterSpacing: 0.8,
    textTransform: 'uppercase' as any,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 18,
    height: 60,
  },
  inputContainerFocused: {
    borderColor: '#0ea5e9',
    backgroundColor: '#ffffff',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1.5,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
    paddingVertical: 12,
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 6,
    marginLeft: 6,
  },

  // Floating label
  floatingLabelWrapper: {
    flex: 1,
    position: 'relative' as any,
  },
  floatingLabel: {
    position: 'absolute' as any,
    left: 0,
    top: 10,
    fontSize: 16,
    color: '#94a3b8',
    backgroundColor: 'transparent',
    zIndex: 1,
    pointerEvents: 'none',
  },
  inputWithIcon: {
    paddingLeft: 0,
  },

  // Options Row
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  forgotText: {
    color: '#0ea5e9',
    fontSize: 14,
    fontWeight: '600',
  },

  error: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    color: '#ef4444',
    fontSize: 13,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Login Button
  button: {
    borderRadius: 40,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
    backgroundColor: '#0ea5e9',
  },
  disabled: {
    opacity: 0.55,
  },
  buttonGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 40,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'none',
  },

  // Footer Links
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  backLink: {
    paddingVertical: 4,
  },
  backLinkText: {
    color: '#0ea5e9',
    fontSize: 13,
    fontWeight: '600',
  },

  // Security Note
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 28,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    justifyContent: 'center',
  },
  securityNoteText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
})

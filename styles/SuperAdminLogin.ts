import { Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

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
        backgroundColor: '#0a2b4a', // fallback if gradient not used
        minHeight: '100%' as any,
    },

    leftColumn: {
        flex: isMobile ? 0 : 1.15,
        padding: isMobile ? 32 : 48,
        justifyContent: 'center',
        alignItems: 'flex-start',
        backgroundColor: 'transparent',
        position: 'relative' as any,
        overflow: 'hidden' as any,
    },

    // Logo / Brand
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: isMobile ? 32 : 52,
    },
    logoImage: {
        width: 44,
        height: 44,
        borderRadius: 22,
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
        fontSize: isMobile ? 28 : 40,
        fontWeight: '800',
        color: '#ffffff',
        marginBottom: 14,
        lineHeight: isMobile ? 44 : 60,
        letterSpacing: -0.8,
        maxWidth: 420,
    },
    welcomeTitleAccent: {
        color: '#7bc5ff',
    },
    welcomeSubtitle: {
        fontSize: 15,
        color: '#cbd5e6',
        marginBottom: 44,
        lineHeight: 24,
        maxWidth: 380,
        fontWeight: '400',
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
        width: isMobile ? '45%' as any : 178,
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

    // ─── Right Column (Login Form) ───────────────────────────────────────────
    rightColumn: {
        flex: isMobile ? 1 : 0.85,
        backgroundColor: '#f8fafc', // light background
        justifyContent: 'center',
        alignItems: 'center',
        padding: isMobile ? 24 : 48,
    },
    card: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#ffffff',
        borderRadius: 28,
        padding: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 25,
        elevation: 8,
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
        width: 18,
        height: 18,
        borderRadius: 5,
        borderWidth: 1.5,
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
        fontSize: 13,
        color: '#334155',
        fontWeight: '500',
    },
    forgotText: {
        color: '#0ea5e9',
        fontSize: 13,
        fontWeight: '500',
    },

    // Error
    error: {
        color: '#ef4444',
        fontSize: 13,
        marginBottom: 16,
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: '#fef2f2',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#fecaca',
        textAlign: 'center',
        fontWeight: '500',
    },

    // Login Button
    button: {
        backgroundColor: '#0ea5e9',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#0ea5e9',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
    },
    disabled: {
        opacity: 0.55,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 1.2,
        textTransform: 'uppercase' as any,
    },

    // Footer Links
    footerLinks: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    backLink: {
        // Add some padding to increase touch area if desired
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
});
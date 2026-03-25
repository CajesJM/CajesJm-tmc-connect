import { StyleSheet } from 'react-native';

export const createAdminProfileStyles = (colors: any, isDark: boolean) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: colors.background,
    },
    card: {
      borderRadius: 16,
      padding: 24,
      marginBottom: 20,
      alignItems: 'center',
      backgroundColor: colors.card,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    avatarContainer: {
      marginBottom: 16,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.accent?.primary || '#3B82F6',
    },
    avatarText: {
      fontSize: 40,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    name: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 4,
      color: colors.text,
    },
    role: {
      fontSize: 16,
      marginBottom: 8,
      color: colors.textSecondary,
    },
    email: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    menu: {
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: colors.card,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 12,
    },
    menuText: {
      flex: 1,
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    logoutButton: {
      borderBottomWidth: 0,
    },
    logoutText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.error,
    },
    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: '90%',
      maxHeight: '80%',
      borderRadius: 20,
      padding: 20,
      backgroundColor: colors.card,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    modalSubtitle: {
      fontSize: 14,
      marginTop: 4,
      color: colors.textSecondary,
    },
    // Settings Styles
    settingsSection: {
      marginBottom: 24,
    },
    settingsSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
      color: colors.text,
    },
    settingsOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRadius: 8,
    },
    settingsOptionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    settingsOptionText: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.text,
    },
    settingsOptionValue: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    // About Modal Styles
    aboutSection: {
      marginBottom: 24,
    },
    aboutDescription: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 16,
      color: colors.textSecondary,
    },
    sectionLabel: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
      color: colors.text,
    },
    membersList: {
      gap: 16,
    },
    memberItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    memberAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: `${colors.accent?.primary || '#3B82F6'}20`,
    },
    memberAvatarText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.accent?.primary || '#3B82F6',
    },
    memberInfo: {
      flex: 1,
    },
    memberName: {
      fontSize: 15,
      fontWeight: '600',
      marginBottom: 2,
      color: colors.text,
    },
    memberRole: {
      fontSize: 12,
      marginBottom: 2,
      color: colors.textSecondary,
    },
    memberEmail: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    versionSection: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      alignItems: 'center',
    },
    versionText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    // Help Modal Styles
    supportBanner: {
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      alignItems: 'center',
      backgroundColor: isDark ? '#1e293b' : '#f0f9ff',
    },
    supportBannerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginTop: 12,
      color: colors.text,
    },
    supportBannerText: {
      fontSize: 14,
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 16,
      color: colors.textSecondary,
    },
    contactSupportButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 25,
      gap: 8,
      backgroundColor: colors.accent?.primary || '#3B82F6',
    },
    contactSupportText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 16,
      color: colors.text,
    },
    faqList: {
      marginBottom: 24,
    },
    faqItem: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: 12,
    },
    faqQuestion: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    faqQuestionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 12,
    },
    faqQuestionText: {
      fontSize: 15,
      fontWeight: '500',
      flex: 1,
      color: colors.text,
    },
    faqAnswer: {
      paddingTop: 8,
      paddingBottom: 12,
      paddingLeft: 32,
    },
    faqAnswerText: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.textSecondary,
    },
    versionInfo: {
      alignItems: 'center',
      paddingVertical: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: 8,
    },
    copyrightText: {
      fontSize: 11,
      marginTop: 4,
      color: colors.textMuted,
    },
    // Additional utility styles
    badge: {
      backgroundColor: `${colors.accent?.primary || '#3B82F6'}20`,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
    },
    badgeText: {
      fontSize: 12,
      color: colors.accent?.primary || '#3B82F6',
      fontWeight: '600',
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 16,
    },
  });
};
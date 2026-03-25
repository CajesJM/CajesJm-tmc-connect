import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { createAdminProfileStyles } from '../../../styles/assistant-admin/profileStyles';


export default function ProfileScreen() {
  const { logout, userData } = useAuth();
  const router = useRouter();
  const { theme, setTheme, colors, isDark, toggleTheme } = useTheme();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const styles = createAdminProfileStyles(colors, isDark);

  const handleLogout = () => {
  const confirmLogout = () => {
    logout();
    router.replace('/login');
  };

  if (Platform.OS === 'web') {
    if (window.confirm('Are you sure you want to logout?')) {
      confirmLogout();
    }
  } else {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: confirmLogout }
      ]
    );
  }
};

  const getUsername = () => {
    if (!userData?.email) return 'Administrator';
    return userData.email.split('@')[0];
  };

  const getDisplayName = () => {
    if (userData?.name) return userData.name;
    return getUsername();
  };

  const renderSettingsModal = () => (
    <Modal
      visible={showSettingsModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowSettingsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Settings</Text>
            <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>
                Theme Preferences
              </Text>

              <TouchableOpacity
                style={styles.settingsOption}
                onPress={() => setTheme('light')}
              >
                <View style={styles.settingsOptionLeft}>
                  <Icon name="weather-sunny" size={24} color={colors.accent.primary} />
                  <Text style={styles.settingsOptionText}>Light Mode</Text>
                </View>
                {theme === 'light' && (
                  <Icon name="check-circle" size={20} color={colors.accent.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingsOption}
                onPress={() => setTheme('dark')}
              >
                <View style={styles.settingsOptionLeft}>
                  <Icon name="weather-night" size={24} color={colors.accent.primary} />
                  <Text style={styles.settingsOptionText}>Dark Mode</Text>
                </View>
                {theme === 'dark' && (
                  <Icon name="check-circle" size={20} color={colors.accent.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingsOption}
                onPress={() => setTheme('system')}
              >
                <View style={styles.settingsOptionLeft}>
                  <Icon name="cellphone" size={24} color={colors.accent.primary} />
                  <Text style={styles.settingsOptionText}>System Default</Text>
                </View>
                {theme === 'system' && (
                  <Icon name="check-circle" size={20} color={colors.accent.primary} />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>
                Preferences
              </Text>

              <View style={styles.settingsOption}>
                <View style={styles.settingsOptionLeft}>
                  <Icon name="bell-outline" size={24} color={colors.textSecondary} />
                  <Text style={styles.settingsOptionText}>Notifications</Text>
                </View>
                <Text style={styles.settingsOptionValue}>
                  Enabled
                </Text>
              </View>

              <View style={styles.settingsOption}>
                <View style={styles.settingsOptionLeft}>
                  <Icon name="language" size={24} color={colors.textSecondary} />
                  <Text style={styles.settingsOptionText}>Language</Text>
                </View>
                <Text style={styles.settingsOptionValue}>
                  English
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>
                About
              </Text>
              <View style={styles.settingsOption}>
                <View style={styles.settingsOptionLeft}>
                  <Icon name="information" size={24} color={colors.textSecondary} />
                  <Text style={styles.settingsOptionText}>Version</Text>
                </View>
                <Text style={styles.settingsOptionValue}>
                  1.0.1
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderAboutModal = () => {
    const aboutInfo = {
      appName: 'TMC Connect Admin',
      version: '1.0.1',
      description: 'Administrative dashboard for managing campus events, attendance tracking, and student engagement.',
      developers: [
        { name: 'John Mark Cajes', role: 'Lead Developer', email: 'markcajes@gmail.com' },
        { name: 'Ken Suarez', role: 'Lead Developer', email: 'kensuarez31@gmail.com' },
        { name: 'Denmerk Apa', role: 'QA Tester', email: 'denmerk@gmail.com' },
        { name: 'Sherylann Inanod', role: 'UI/UX Designer', email: 'inanodsherylann@gmail.com' },
        { name: 'Karl James Ayuban', role: 'Developer', email: 'ayubankarljames@gmail.com' },
      ],
      organization: 'TMC Connect Developers',
    };

    return (
      <Modal
        visible={showAboutModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAboutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>About This App</Text>
              <TouchableOpacity onPress={() => setShowAboutModal(false)}>
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {aboutInfo.description && (
                <View style={styles.aboutSection}>
                  <Text style={styles.aboutDescription}>
                    {aboutInfo.description}
                  </Text>
                </View>
              )}

              <View style={styles.aboutSection}>
                <Text style={styles.sectionLabel}>
                  {aboutInfo.organization}
                </Text>

                <View style={styles.membersList}>
                  {aboutInfo.developers.map((member, index) => (
                    <View key={index} style={styles.memberItem}>
                      <View style={styles.memberAvatar}>
                        <Text style={styles.memberAvatarText}>
                          {member.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>{member.name}</Text>
                        {member.role && (
                          <Text style={styles.memberRole}>
                            {member.role}
                          </Text>
                        )}
                        {member.email && (
                          <Text style={styles.memberEmail}>
                            {member.email}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.versionSection}>
                <Text style={styles.versionText}>
                  Version {aboutInfo.version}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderHelpModal = () => {
    const faqs = [
      {
        id: '1',
        question: 'How do I create an event?',
        answer: 'Go to the Events section and tap the "+" button. Fill in the event details including title, date, location, and attendance deadline.',
        icon: 'calendar-plus'
      },
      {
        id: '2',
        question: 'How do I scan student attendance?',
        answer: 'In the Events section, select an active event and tap "Scan QR Code". Use your device camera to scan student QR codes.',
        icon: 'qrcode-scan'
      },
      {
        id: '3',
        question: 'How do I manage penalties?',
        answer: 'Go to the Penalties section to view all pending penalties. You can mark them as paid or add new penalties for students.',
        icon: 'alert-circle'
      },
      {
        id: '4',
        question: 'How do I view attendance reports?',
        answer: 'Navigate to Reports section to view detailed analytics including attendance rates, monthly trends, and student performance.',
        icon: 'chart-line'
      },
      {
        id: '5',
        question: 'How do I manage student accounts?',
        answer: 'Access the Students section to view all registered students, update their information, or reset passwords if needed.',
        icon: 'account-group'
      },
      {
        id: '6',
        question: 'How do I receive notifications?',
        answer: 'Enable notifications in your device settings to receive alerts about new events, attendance issues, and system updates.',
        icon: 'bell'
      },
    ];

    return (
      <Modal
        visible={showHelpModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowHelpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Help & Support</Text>
                <Text style={styles.modalSubtitle}>
                  How can we help you today?
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowHelpModal(false)}>
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.supportBanner}>
                <Icon name="headset" size={48} color={colors.accent.primary} />
                <Text style={styles.supportBannerTitle}>
                  Need Immediate Help?
                </Text>
                <Text style={styles.supportBannerText}>
                  Our support team is ready to assist you.
                </Text>
                <TouchableOpacity
                  style={styles.contactSupportButton}
                  onPress={() => {
                    // Contact support action
                  }}
                >
                  <Icon name="headset" size={20} color="#FFFFFF" />
                  <Text style={styles.contactSupportText}>Contact Support</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>
                Frequently Asked Questions
              </Text>
              <View style={styles.faqList}>
                {faqs.map((faq) => {
                  const [expanded, setExpanded] = useState(false);
                  return (
                    <View key={faq.id} style={styles.faqItem}>
                      <TouchableOpacity
                        style={styles.faqQuestion}
                        onPress={() => setExpanded(!expanded)}
                      >
                        <View style={styles.faqQuestionLeft}>
                          <Icon name={faq.icon} size={20} color={colors.accent.primary} />
                          <Text style={styles.faqQuestionText}>
                            {faq.question}
                          </Text>
                        </View>
                        <Icon
                          name={expanded ? 'chevron-up' : 'chevron-down'}
                          size={20}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>

                      {expanded && (
                        <View style={styles.faqAnswer}>
                          <Text style={styles.faqAnswerText}>
                            {faq.answer}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>

              <View style={styles.versionInfo}>
                <Text style={styles.versionText}>
                  TMC Connect Admin v1.0.1
                </Text>
                <Text style={styles.copyrightText}>
                  © 2024 TMC Connect. All rights reserved.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getDisplayName().charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.name}>{getDisplayName()}</Text>
        <Text style={styles.role}>Campus Administrator</Text>
        <Text style={styles.email}>
          {userData?.email || 'admin@tmc.edu'}
        </Text>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem}>
          <Icon name="account-edit" size={20} color={colors.accent.primary} />
          <Text style={styles.menuText}>Edit Profile</Text>
          <Icon name="chevron-right" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setShowSettingsModal(true)}
        >
          <Icon name="cog" size={20} color={colors.accent.primary} />
          <Text style={styles.menuText}>Settings</Text>
          <Icon name="chevron-right" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setShowAboutModal(true)}
        >
          <Icon name="information" size={20} color={colors.accent.primary} />
          <Text style={styles.menuText}>About</Text>
          <Icon name="chevron-right" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setShowHelpModal(true)}
        >
          <Icon name="help-circle" size={20} color={colors.accent.primary} />
          <Text style={styles.menuText}>Help & Support</Text>
          <Icon name="chevron-right" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Icon name="logout" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
          <Icon name="chevron-right" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      {renderSettingsModal()}
      {renderAboutModal()}
      {renderHelpModal()}
    </ScrollView>
  );
}
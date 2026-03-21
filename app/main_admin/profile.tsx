import {
  Feather,
  FontAwesome6,
  Ionicons,
  MaterialIcons,
  Octicons
} from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { collection, doc, getDocs, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { db } from '../../lib/firebaseConfig';
import { createProfileStyles } from '../../styles/main-admin/profileStyles';

export default function MainAdminProfile() {
  const { logout, userData } = useAuth();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = createProfileStyles(colors, isDark);

  // Local state for profile image (immediate update after upload)
  const [photoURL, setPhotoURL] = useState<string | null>(userData?.photoURL || null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Stats state
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [activeEvents, setActiveEvents] = useState<number>(0);
  const [loadingStats, setLoadingStats] = useState(true);

  // Header gradient (matches dashboard)
  const headerGradientColors = isDark
    ? (['#0f172a', '#1e293b'] as const)
    : (['#1e40af', '#3b82f6'] as const);

  // Fetch real statistics from Firestore
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);

        // 1. Total users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersCount = usersSnapshot.size;
        setTotalUsers(usersCount);

        // 2. Active events: approved and upcoming
        const now = new Date();
        const eventsQuery = query(
          collection(db, 'events'),
          where('date', '>=', now), // only future events
          orderBy('date', 'asc')
        );
        const eventsSnapshot = await getDocs(eventsQuery);

        // Count only approved events (status === 'approved' or no status)
        const activeCount = eventsSnapshot.docs.filter(doc => {
          const data = doc.data();
          const status = data.status;
          return status === 'approved' || status === undefined || status === null || status === '';
        }).length;

        setActiveEvents(activeCount);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const getUsername = () => {
    if (!userData?.email) return 'Main Administrator';
    return userData.email.split('@')[0];
  };

  const getDisplayName = () => {
    if (userData?.name) return userData.name;
    return getUsername();
  };

  const getInitials = () => {
    const name = getDisplayName();
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Image picker (same as dashboard)
  const handleProfileImagePress = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e: any) => {
          const file = e.target.files[0];
          if (file) {
            await uploadProfileImage(file);
          }
        };
        input.click();
      } else {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
          Alert.alert(
            'Permission Required',
            'Permission to access camera roll is required!',
            [{ text: 'OK' }]
          );
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
        });

        if (!result.canceled) {
          await uploadProfileImage(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.', [{ text: 'OK' }]);
    }
  };

  const uploadProfileImage = async (imageUri: string | File) => {
    try {
      setUploadingImage(true);

      let blob: Blob;
      if (imageUri instanceof File) {
        blob = imageUri;
      } else {
        const response = await fetch(imageUri);
        blob = await response.blob();
      }

      const storage = getStorage();
      const fileName = `profile_${userData?.email}_${Date.now()}.jpg`;
      const storageRef = ref(storage, `profileImages/${fileName}`);

      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);

      if (userData?.email) {
        const userRef = doc(db, 'users', userData.email);
        await updateDoc(userRef, {
          photoURL: downloadUrl
        });

        // Update local state immediately
        setPhotoURL(downloadUrl);

        Alert.alert('Success', 'Profile image updated successfully!', [{ text: 'OK' }]);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.', [{ text: 'OK' }]);
    } finally {
      setUploadingImage(false);
    }
  };

  const menuItems = [
    {
      title: 'Profile Settings',
      description: 'Update your personal information',
      icon: 'user',
      iconSet: 'feather' as const,
      color: '#0ea5e9',
      onPress: () => console.log('Profile Settings pressed'),
    },
    {
      title: 'System Configuration',
      description: 'Manage system-wide settings',
      icon: 'settings',
      iconSet: 'feather' as const,
      color: '#8b5cf6',
      onPress: () => console.log('System Configuration pressed'),
    },
    {
      title: 'User Management',
      description: 'Manage admin and user accounts',
      icon: 'users',
      iconSet: 'fontawesome6' as const,
      color: '#10b981',
      onPress: () => console.log('User Management pressed'),
    },
    {
      title: 'Security & Permissions',
      description: 'Configure access controls',
      icon: 'shield',
      iconSet: 'feather' as const,
      color: '#f59e0b',
      onPress: () => console.log('Security pressed'),
    },
    {
      title: 'System Analytics',
      description: 'View usage statistics and reports',
      icon: 'bar-chart-2',
      iconSet: 'feather' as const,
      color: '#ec4899',
      onPress: () => console.log('Analytics pressed'),
    },
    {
      title: 'Help & Support',
      description: 'Documentation and support resources',
      icon: 'help-circle',
      iconSet: 'feather' as const,
      color: '#64748b',
      onPress: () => console.log('Help pressed'),
    },
  ];

  const renderIcon = (icon: string, iconSet: 'feather' | 'fontawesome6' | 'material' | 'ionicons' | 'octicons', color: string) => {
    const size = 20;

    switch (iconSet) {
      case 'feather':
        return <Feather name={icon as any} size={size} color={color} />;
      case 'fontawesome6':
        return <FontAwesome6 name={icon as any} size={size} color={color} />;
      case 'material':
        return <MaterialIcons name={icon as any} size={size} color={color} />;
      case 'ionicons':
        return <Ionicons name={icon as any} size={size} color={color} />;
      case 'octicons':
        return <Octicons name={icon as any} size={size} color={color} />;
      default:
        return <Feather name="user" size={size} color={color} />;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Dashboard‑style gradient header */}
      <LinearGradient colors={headerGradientColors} style={styles.headerGradient}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greetingText}>My Profile</Text>
            <Text style={styles.userName}>{getDisplayName()}</Text>
            <Text style={styles.roleText}>System Administrator</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={handleProfileImagePress} disabled={uploadingImage}>
            {uploadingImage ? (
              <View style={[styles.profileImage, styles.profileFallback]}>
                <ActivityIndicator size="small" color="#ffffff" />
              </View>
            ) : photoURL ? (
              <Image source={{ uri: photoURL }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImage, styles.profileFallback]}>
                <Text style={styles.profileInitials}>{getInitials()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.dateSection}>
          <View style={styles.dateContainer}>
            <Feather name="calendar" size={12} color={isDark ? colors.sidebar?.text?.secondary : '#ffffff'} />
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerAction}
              onPress={() => console.log('Settings pressed')} // Replace with actual navigation to settings
            >
              <Feather name="settings" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{getDisplayName()}</Text>
            <Text style={styles.profileRole}>Main System Administrator</Text>
            <Text style={styles.profileEmail}>{userData?.email || 'admin@system.edu'}</Text>

            <View style={styles.profileMeta}>
              <View style={styles.metaItem}>
                <Feather name="award" size={14} color={colors.accent.primary} />
                <Text style={styles.metaText}>Full Access</Text>
              </View>
              <View style={styles.metaItem}>
                <Feather name="shield" size={14} color="#10b981" />
                <Text style={styles.metaText}>Super Admin</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats with real data */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>24/7</Text>
            <Text style={styles.statLabel}>Uptime</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {loadingStats ? <ActivityIndicator size="small" color={colors.accent.primary} /> : totalUsers}
            </Text>
            <Text style={styles.statLabel}>Users</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {loadingStats ? <ActivityIndicator size="small" color={colors.accent.primary} /> : activeEvents}
            </Text>
            <Text style={styles.statLabel}>Active Events</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction}>
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(14, 165, 233, 0.1)' }]}>
              <Feather name="plus-circle" size={20} color="#0ea5e9" />
            </View>
            <Text style={styles.quickActionText}>New Event</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction}>
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
              <Feather name="user-plus" size={20} color="#8b5cf6" />
            </View>
            <Text style={styles.quickActionText}>Add Admin</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction}>
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Feather name="file-text" size={20} color="#10b981" />
            </View>
            <Text style={styles.quickActionText}>Reports</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Admin Menu */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Management</Text>
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                {renderIcon(item.icon, item.iconSet, item.color)}
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuDescription}>{item.description}</Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.sidebar?.text?.muted || '#94a3b8'} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* System Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Information</Text>
        <View style={styles.systemInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>System Version</Text>
            <Text style={styles.infoValue}>v2.4.1</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Updated</Text>
            <Text style={styles.infoValue}>2024-01-15</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Active Sessions</Text>
            <Text style={styles.infoValue}>3</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Storage Used</Text>
            <Text style={styles.infoValue}>1.2 GB / 10 GB</Text>
          </View>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Feather name="log-out" size={20} color={isDark ? '#f87171' : '#dc2626'} />
        <Text style={styles.logoutText}>Logout System</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2024 Campus Hub System</Text>
        <Text style={styles.footerSubtext}>Main Administration Panel</Text>
      </View>
    </ScrollView>
  );
}
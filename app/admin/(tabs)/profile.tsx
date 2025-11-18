import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen() {
  const { logout, userData } = useAuth(); 
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  // Safely get the username from email
  const getUsername = () => {
    if (!userData?.email) return 'Administrator';
    return userData.email.split('@')[0];
  };

  // Safely get the display name
  const getDisplayName = () => {
    if (userData?.name) return userData.name;
    return getUsername();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Profile</Text>
      
      <View style={styles.card}>
        <Text style={styles.name}>{getDisplayName()}</Text>
        <Text style={styles.role}>Campus Admin</Text>
        <Text style={styles.email}>{userData?.email || 'admin@tmc.edu'}</Text>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Edit Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>App Settings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Help & Support</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.menuItem, styles.logoutButton]} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1E293B',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  role: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: '#94A3B8',
  },
  menu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
  },
  menuItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuText: {
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#FEF2F2',
  },
  logoutText: {
    color: '#DC2626',
    fontWeight: '600',
  },
});
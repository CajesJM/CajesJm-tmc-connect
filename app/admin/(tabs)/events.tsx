import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function EventsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Events Management</Text>
      <Text style={styles.subtitle}>Create and manage campus events</Text>
      <View style={styles.placeholder}>
        <Text>Events functionality coming soon...</Text>
        <Text>• Create events with photos</Text>
        <Text>• Manage event details</Text>
        <Text>• Set event dates and locations</Text>
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
    marginBottom: 10,
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 30,
  },
  placeholder: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
});
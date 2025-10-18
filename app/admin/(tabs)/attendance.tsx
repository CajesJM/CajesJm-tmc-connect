import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AttendanceScreen() {
  const [todayCode, setTodayCode] = useState<string>('');

  const generateCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setTodayCode(code);
    Alert.alert('Attendance Code Generated', `Today's code: ${code}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance Management</Text>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Daily Attendance Code</Text>
        <Text style={styles.code}>{todayCode || 'No code generated'}</Text>
        <TouchableOpacity style={styles.button} onPress={generateCode}>
          <Text style={styles.buttonText}>Generate Today's Code</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.placeholder}>
        <Text>Attendance features coming soon...</Text>
        <Text>• View attendance reports</Text>
        <Text>• Manage student attendance</Text>
        <Text>• Export attendance data</Text>
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  code: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#22C55E',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  placeholder: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
  },
});
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function StudentAttendance() {
  const [attendanceCode, setAttendanceCode] = useState('');

  const markAttendance = () => {
    if (!attendanceCode.trim()) {
      Alert.alert('Error', 'Please enter attendance code');
      return;
    }
    
    // Here you would validate the code with your backend
    Alert.alert(
      'Attendance Submitted', 
      `Code: ${attendanceCode}\nAttendance marked successfully!`
    );
    setAttendanceCode('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mark Attendance</Text>
      <Text style={styles.subtitle}>Enter today's attendance code</Text>
      
      <View style={styles.card}>
        <Text style={styles.instruction}>
          Get the daily attendance code from your instructor and enter it below to mark your attendance.
        </Text>
        
        <TextInput
          style={styles.input}
          placeholder="Enter attendance code"
          value={attendanceCode}
          onChangeText={setAttendanceCode}
          placeholderTextColor="#999"
          autoCapitalize="characters"
        />
        
        <TouchableOpacity style={styles.button} onPress={markAttendance}>
          <Text style={styles.buttonText}>Submit Attendance</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.stats}>
        <Text style={styles.statsTitle}>Attendance Summary</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>45</Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>2</Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>94%</Text>
            <Text style={styles.statLabel}>Overall</Text>
          </View>
        </View>
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
    marginBottom: 5,
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  instruction: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
    lineHeight: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#F8FAFC',
  },
  button: {
    backgroundColor: '#22C55E',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  stats: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 5,
  },
});
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function StudentEvents() {
  const upcomingEvents = [
    {
      id: '1',
      title: 'College Festival',
      date: 'Oct 25, 2024',
      location: 'Main Campus Ground',
      description: 'Annual college cultural festival'
    },
    {
      id: '2', 
      title: 'Tech Symposium',
      date: 'Nov 15, 2024',
      location: 'Auditorium',
      description: 'Technology and innovation showcase'
    }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upcoming Events</Text>
      <Text style={styles.subtitle}>Join campus activities and events</Text>
      
      <ScrollView>
        {upcomingEvents.map((event) => (
          <View key={event.id} style={styles.eventCard}>
            <View style={styles.eventHeader}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventDate}>🗓 {event.date}</Text>
            </View>
            <Text style={styles.eventLocation}>📍 {event.location}</Text>
            <Text style={styles.eventDescription}>{event.description}</Text>
          </View>
        ))}
        
        <View style={styles.placeholder}>
          <Text>More events coming soon...</Text>
          <Text>• Event photos will be available here</Text>
          <Text>• RSVP functionality</Text>
          <Text>• Event reminders</Text>
        </View>
      </ScrollView>
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
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  eventDate: {
    fontSize: 14,
    color: '#64748B',
  },
  eventLocation: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  placeholder: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    marginTop: 10,
  },
});
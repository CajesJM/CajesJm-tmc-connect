import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { db } from '../../../lib/firebaseConfig';

dayjs.extend(relativeTime);

interface Announcement {
  id: string;
  title: string;
  message: string;
  createdAt?: any;
}

export default function StudentAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const q = query(collection(db, "updates"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Announcement[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Announcement, "id">),
      }));
      setAnnouncements(list);
    });
    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Campus Announcements</Text>
      <Text style={styles.subtitle}>Stay updated with latest news</Text>
      
      <FlatList
        data={announcements}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardMessage}>{item.message}</Text>
            {item.createdAt && (
              <Text style={styles.timestamp}>
                📅 {dayjs(item.createdAt.toDate()).fromNow()}
              </Text>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text>No announcements yet</Text>
          </View>
        }
      />
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
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  cardMessage: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 8,
  },
  empty: {
    alignItems: 'center',
    padding: 40,
  },
});
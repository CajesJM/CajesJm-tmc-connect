import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { db } from '../../../lib/firebaseConfig';
import { StudentAnnouncementStyles as styles } from '../../styles/StudentAnnouncementStyles';

dayjs.extend(relativeTime);

interface Announcement {
  id: string;
  title: string;
  message: string;
  createdAt?: any;
}

type TimeFilter = 'all' | 'today' | 'week' | 'month';

export default function StudentAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "updates"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Announcement[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Announcement, "id">),
      }));
      setAnnouncements(list);
      filterAnnouncements(list, timeFilter);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching announcements:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    filterAnnouncements(announcements, timeFilter);
  }, [timeFilter, announcements]);

  const filterAnnouncements = (announcementsList: Announcement[], filter: TimeFilter) => {
    const now = dayjs();
    let filtered = announcementsList;

    switch (filter) {
      case 'today':
        filtered = announcementsList.filter(ann =>
          ann.createdAt && dayjs(ann.createdAt.toDate()).isSame(now, 'day')
        );
        break;
      case 'week':
        filtered = announcementsList.filter(ann =>
          ann.createdAt && dayjs(ann.createdAt.toDate()).isAfter(now.subtract(1, 'week'))
        );
        break;
      case 'month':
        filtered = announcementsList.filter(ann =>
          ann.createdAt && dayjs(ann.createdAt.toDate()).isAfter(now.subtract(1, 'month'))
        );
        break;
      default:
        filtered = announcementsList;
    }

    setFilteredAnnouncements(filtered);
  };

  const isNewAnnouncement = (createdAt: any) => {
    if (!createdAt) return false;
    return dayjs(createdAt.toDate()).isAfter(dayjs().subtract(1, 'day'));
  };

  const getTotalStats = () => {
    const now = dayjs();
    const todayCount = announcements.filter(ann =>
      ann.createdAt && dayjs(ann.createdAt.toDate()).isSame(now, 'day')
    ).length;
    const newCount = announcements.filter(ann =>
      ann.createdAt && dayjs(ann.createdAt.toDate()).isAfter(now.subtract(3, 'day'))
    ).length;

    return { total: announcements.length, today: todayCount, new: newCount };
  };

  const stats = getTotalStats();

  const renderAnnouncementItem = ({ item }: { item: Announcement }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {isNewAnnouncement(item.createdAt) && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        )}
      </View>
      <Text style={styles.cardMessage} numberOfLines={4}>
        {item.message}
      </Text>
      {item.createdAt && (
        <Text style={styles.timestamp}>
          <Icon name="calendar" size={16} color="#0122f7ff" /> {dayjs(item.createdAt.toDate()).format('MMM D, YYYY • h:mm A')} • {dayjs(item.createdAt.toDate()).fromNow()}
        </Text>
      )}
    </View>
  );

  const timeFilters: { key: TimeFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Campus Announcements</Text>
          <Text style={styles.subtitle}>Stay updated with the latest campus news and updates</Text>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E88E5" />
          <Text style={styles.loadingText}>Loading announcements...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Campus Announcements</Text>
        <Text style={styles.subtitle}>Stay updated with the latest campus news and updates</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.today}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.new}</Text>
          <Text style={styles.statLabel}>New</Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <Text style={styles.filterTitle}>Filter by time:</Text>
        <View style={styles.filterChips}>
          {timeFilters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                timeFilter === filter.key && styles.filterChipActive
              ]}
              onPress={() => setTimeFilter(filter.key)}
            >
              <Text style={[
                styles.filterChipText,
                timeFilter === filter.key && styles.filterChipTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredAnnouncements}
        keyExtractor={(item) => item.id}
        renderItem={renderAnnouncementItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📢</Text>
            <Text style={styles.emptyStateText}>
              {timeFilter === 'all' ? 'No announcements yet' : `No announcements from ${timeFilters.find(f => f.key === timeFilter)?.label.toLowerCase()}`}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {timeFilter === 'all'
                ? 'Check back later for new campus announcements!'
                : 'Try changing the filter to see more announcements'
              }
            </Text>
          </View>
        }
      />
    </View>
  );
}
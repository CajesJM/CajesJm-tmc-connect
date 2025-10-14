import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { fetchAnnouncements } from "../../lib/mockApi";
import { Announcement } from "../../lib/types";

export default function StudentAnnouncementList() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAnnouncements();
      setItems(data);
    } catch (err) {
      console.warn("load announcements failed", err);
      Alert.alert("Error", "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await fetchAnnouncements();
      setItems(data);
    } catch (err) {
      console.warn("refresh failed", err);
      Alert.alert("Error", "Failed to refresh");
    } finally {
      setRefreshing(false);
    }
  };

  const renderItem = ({ item }: { item: Announcement }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardBody} numberOfLines={2}>
        {item.body}
      </Text>

      <View style={styles.row}>
       <Link href={`/student/announcement/${item.id}`} asChild>
          <TouchableOpacity style={styles.viewBtn}>
            <Text style={styles.viewBtnText}>View</Text>
          </TouchableOpacity>
        </Link>
        <Text style={styles.meta}>{new Date(item.createdAt).toLocaleString()}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Announcements</Text>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 40 }}
        onRefresh={onRefresh}
        refreshing={refreshing}
        ListEmptyComponent={<Text style={styles.empty}>No announcements</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  empty: { color: "#666", textAlign: "center", marginTop: 20 },
  card: { padding: 12, borderRadius: 8, backgroundColor: "#F3F4F6", marginBottom: 12 },
  cardTitle: { fontWeight: "700", fontSize: 16 },
  cardBody: { marginTop: 6, color: "#374151" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  viewBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, backgroundColor: "#2563EB" },
  viewBtnText: { color: "#fff", fontWeight: "700" },
  meta: { color: "#6B7280", fontSize: 12 },
});
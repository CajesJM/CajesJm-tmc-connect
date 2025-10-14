import { Link, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { deleteAnnouncement, fetchAnnouncements } from "../../../lib/mockApi";
import { Announcement } from "../../../lib/types";

export default function AdminAnnouncementList() {
  const router = useRouter();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const confirmDelete = (id: string, title?: string) => {
    Alert.alert(
      "Delete announcement",
      `Are you sure you want to delete "${title ?? "this announcement"}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => handleDelete(id) },
      ]
    );
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    // optimistic update
    const prev = items;
    setItems((p) => p.filter((x) => x.id !== id));
    try {
      await deleteAnnouncement(id);
    } catch (err) {
      console.warn("delete failed", err);
      setItems(prev); // rollback
      Alert.alert("Delete failed", "Could not delete announcement. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const renderItem = ({ item }: { item: Announcement }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.meta}>{new Date(item.createdAt).toLocaleString()}</Text>
      </View>

      <Text style={styles.cardBody} numberOfLines={2}>{item.body}</Text>

      <View style={styles.row}>
       <Link href={`/admin/announcement/${item.id}`} asChild>
          <TouchableOpacity style={styles.smallBtn}>
            <Text style={styles.smallBtnText}>Edit</Text>
          </TouchableOpacity>
        </Link>

        <TouchableOpacity
          style={[styles.smallBtn, styles.deleteBtn]}
          onPress={() => confirmDelete(item.id, item.title)}
          disabled={!!deletingId}
        >
          {deletingId === item.id ? <ActivityIndicator color="#fff" /> : <Text style={styles.smallBtnText}>Delete</Text>}
        </TouchableOpacity>
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
      <View style={styles.headerRow}>
        <Text style={styles.title}>Announcements</Text>
        <Link href="/admin/announcement/create" asChild>
          <TouchableOpacity style={styles.createBtn}>
            <Text style={styles.createBtnText}>Create</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={<Text style={styles.empty}>No announcements</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 22, fontWeight: "700" },
  createBtn: { backgroundColor: "#059669", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  createBtnText: { color: "#fff", fontWeight: "700" },
  empty: { color: "#666", textAlign: "center", marginTop: 20 },
  card: { padding: 12, borderRadius: 8, backgroundColor: "#F3F4F6", marginBottom: 12 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  cardTitle: { fontWeight: "700", fontSize: 16 },
  meta: { color: "#6B7280", fontSize: 12 },
  cardBody: { marginTop: 6, color: "#374151" },
  row: { flexDirection: "row", marginTop: 10, gap: 8, justifyContent: "flex-end" },
  smallBtn: { padding: 8, borderRadius: 6, backgroundColor: "#2563EB", marginLeft: 8 },
  deleteBtn: { backgroundColor: "#DC2626" },
  smallBtnText: { color: "#fff", fontWeight: "700" },
});
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { fetchAnnouncementById } from "../../../lib/mockApi";
import { Announcement } from "../../../lib/types";

export default function StudentAnnouncementDetail() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id;
  const router = useRouter();

  const [item, setItem] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const data = await fetchAnnouncementById(id);
        if (!mounted) return;
        setItem(data);
      } catch (err) {
        console.warn("load announcement failed", err);
        Alert.alert("Error", "Failed to load announcement", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, router]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Announcement not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.meta}>{new Date(item.createdAt).toLocaleString()}</Text>
      <Text style={styles.body}>{item.body}</Text>

      {item.location ? <Text style={styles.extra}>Location: {item.location}</Text> : null}
      {item.startsAt ? <Text style={styles.extra}>Starts: {new Date(item.startsAt).toLocaleString()}</Text> : null}
      {item.endsAt ? <Text style={styles.extra}>Ends: {new Date(item.endsAt).toLocaleString()}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16 },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 8 },
  meta: { color: "#6B7280", marginBottom: 12 },
  body: { fontSize: 16, color: "#111827", lineHeight: 22, marginBottom: 12 },
  extra: { color: "#374151", marginTop: 8 },
  notFound: { color: "#6B7280", marginBottom: 12 },
  backBtn: { marginTop: 8, padding: 10, backgroundColor: "#2563EB", borderRadius: 6 },
  backBtnText: { color: "#fff", fontWeight: "700" },
});
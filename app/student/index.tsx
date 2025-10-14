import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useRouter } from "expo-router";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { db } from "../../lib/firebaseConfig";
import { useAuth } from "../context/AuthContext";

dayjs.extend(relativeTime);

interface Update {
  id: string;
  title: string;
  message: string;
  createdAt?: any;
}

export default function StudentScreen() {
  const [updates, setUpdates] = useState<Update[]>([]);
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          await logout();
          router.replace("/login?role=student");
        },
      },
    ]);
  };

  useEffect(() => {
    const q = query(collection(db, "updates"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Update[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Update, "id">),
      }));
      setUpdates(list);
    });
    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.headerContainer}>
        <Text style={styles.header}>📢 Announcements</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {updates.length === 0 ? (
          <Text style={styles.empty}>No announcements yet 📭</Text>
        ) : (
          updates.map((update) => (
            <View key={update.id} style={styles.card}>
              <Text style={styles.cardTitle}>{update.title}</Text>
              <Text style={styles.cardMessage}>{update.message}</Text>
              {update.createdAt && (
                <Text style={styles.timestamp}>
                  📅 {dayjs(update.createdAt.toDate()).fromNow()}
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", padding: 20 },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E293B",
  },
  logoutButton: {
    backgroundColor: "#E11D48",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  logoutText: { color: "#FFF", fontWeight: "600" },
  empty: {
    textAlign: "center",
    fontSize: 16,
    color: "#64748B",
    marginTop: 50,
    fontStyle: "italic",
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  cardMessage: {
    fontSize: 15,
    color: "#475569",
    marginTop: 6,
    lineHeight: 20,
  },
  timestamp: { fontSize: 12, color: "#94A3B8", marginTop: 8 },
});

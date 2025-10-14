import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useRouter } from "expo-router";
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View, } from "react-native";
import { db } from "../../lib/firebaseConfig";
import { useAuth } from "../context/AuthContext";

dayjs.extend(relativeTime);

interface Update {
  id: string;
  title: string;
  message: string;
  createdAt?: any;
}

export default function AdminScreen() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [updates, setUpdates] = useState<Update[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          await logout();
          router.replace("/login?role=admin");
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

  const handleAdd = async () => {
    if (!title.trim() || !message.trim()) return;
    await addDoc(collection(db, "updates"), {
      title,
      message,
      createdAt: serverTimestamp(),
    });
    setTitle("");
    setMessage("");
  };

  const handleEditStart = (update: Update) => {
    setEditingId(update.id);
    setTitle(update.title);
    setMessage(update.message);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const updateRef = doc(db, "updates", editingId);
    await updateDoc(updateRef, { title, message });
    setEditingId(null);
    setTitle("");
    setMessage("");
  };

  const handleDelete = async (id: string) => {
    Alert.alert("Delete Announcement", "Are you sure you want to delete this?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", onPress: async () => await deleteDoc(doc(db, "updates", id)) },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.header}>🛠 Admin Dashboard</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Input Fields */}
      <TextInput
        style={styles.input}
        placeholder="Announcement Title"
        value={title}
        onChangeText={setTitle}
        placeholderTextColor="#999"
      />
      <TextInput
        style={[styles.input, { height: 100 }]}
        placeholder="Announcement Message"
        value={message}
        onChangeText={setMessage}
        placeholderTextColor="#999"
        multiline
      />

      {/* Action Button */}
      {editingId ? (
        <TouchableOpacity style={styles.editButton} onPress={handleSaveEdit}>
          <Text style={styles.buttonText}>💾 Save Changes</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.buttonText}>➕ Add Announcement</Text>
        </TouchableOpacity>
      )}

      {/* Announcements List */}
      <FlatList
        data={updates}
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
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#1E90FF" }]}
                onPress={() => handleEditStart(item)}
              >
                <Text style={styles.actionText}>✏️ Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#FF4C4C" }]}
                onPress={() => handleDelete(item.id)}
              >
                <Text style={styles.actionText}>🗑 Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
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
  input: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
    color: "#1E293B",
  },
  addButton: {
    backgroundColor: "#22C55E",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 25,
  },
  editButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 25,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
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
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    gap: 10,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionText: { color: "#FFF", fontWeight: "600" },
});

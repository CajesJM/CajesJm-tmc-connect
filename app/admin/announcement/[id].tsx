import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { fetchAnnouncementById, updateAnnouncement } from "../../../lib/mockApi";

export default function AdminEditAnnouncement() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id;

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const item = await fetchAnnouncementById(id);
        if (!mounted) return;
        setTitle(item.title);
        setBody(item.body);
      } catch (err) {
        console.warn("load item failed", err);
        Alert.alert("Error", "Failed to load announcement");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  const handleSave = async () => {
    if (!title || !body) {
      Alert.alert("Validation", "Title and body are required");
      return;
    }
    if (!id) {
      Alert.alert("Error", "Missing announcement id");
      return;
    }

    setBusy(true);
    try {
      await updateAnnouncement(id, { title, body });
      router.replace("./announcement");
    } catch (err) {
      console.warn("update failed", err);
      Alert.alert("Update failed", "Please try again");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <View style={styles.center}><Text>Loading...</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Announcement</Text>

      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Title" />

      <TextInput
        style={[styles.input, styles.textarea]}
        value={body}
        onChangeText={setBody}
        multiline
        placeholder="Body"
      />

      <TouchableOpacity style={[styles.button, busy && styles.disabled]} onPress={handleSave} disabled={busy}>
        <Text style={styles.buttonText}>{busy ? "Saving..." : "Save"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  input: { borderWidth: 1, borderColor: "#E5E7EB", padding: 12, borderRadius: 8, marginBottom: 12, backgroundColor: "#fff" },
  textarea: { height: 120, textAlignVertical: "top" },
  button: { backgroundColor: "#2563EB", padding: 14, borderRadius: 8, alignItems: "center" },
  disabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontWeight: "700" },
});
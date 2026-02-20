import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { createAnnouncement } from "../../../lib/mockApi";

export default function AdminCreateAnnouncement() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const validate = () => {
    if (!title.trim()) {
      Alert.alert("Validation", "Title is required");
      return false;
    }
    if (!body.trim()) {
      Alert.alert("Validation", "Body is required");
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (busy) return;
    if (!validate()) return;

    setBusy(true);
    try {
      await createAnnouncement({ title: title.trim(), body: body.trim() });
      // go back to admin announcement list
      router.replace("./");
    } catch (err) {
      console.warn("create failed", err);
      Alert.alert("Error", "Failed to create announcement. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Announcement</Text>

      <TextInput
        style={styles.input}
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
        returnKeyType="next"
      />

      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Body"
        value={body}
        onChangeText={setBody}
        multiline
      />

      <TouchableOpacity style={[styles.button, busy && styles.disabled]} onPress={handleCreate} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  input: { borderWidth: 1, borderColor: "#E5E7EB", padding: 12, borderRadius: 8, marginBottom: 12, backgroundColor: "#fff" },
  textarea: { height: 120, textAlignVertical: "top" },
  button: { backgroundColor: "#059669", padding: 14, borderRadius: 8, alignItems: "center" },
  disabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontWeight: "700" },
});
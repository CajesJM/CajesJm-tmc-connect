import {
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, Button, ScrollView, Text, TextInput, View } from "react-native";
import { db } from "../../lib/firebaseConfig";

interface Update {
  id: string;
  title: string;
  message: string;
  createdAt?: any;
}

export default function ManageUpdates() {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMessage, setEditMessage] = useState("");

  useEffect(() => {
    const q = query(collection(db, "updates"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Update[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Update, "id">),
      }));
      setUpdates(list);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "updates", id));
      Alert.alert("Deleted", "Update has been removed");
    } catch (error) {
      console.error("Error deleting update: ", error);
      Alert.alert("Error", "Could not delete update");
    }
  };

  const handleEdit = (update: Update) => {
    setEditingId(update.id);
    setEditTitle(update.title);
    setEditMessage(update.message);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      await updateDoc(doc(db, "updates", editingId), {
        title: editTitle,
        message: editMessage,
      });
      Alert.alert("Updated", "Announcement updated successfully!");
      setEditingId(null);
      setEditTitle("");
      setEditMessage("");
    } catch (error) {
      console.error("Error updating update: ", error);
      Alert.alert("Error", "Could not update announcement");
    }
  };

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10 }}>
        Manage Announcements
      </Text>

      {updates.map((update) => (
        <View
          key={update.id}
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 10,
            marginBottom: 15,
            borderRadius: 5,
          }}
        >
          {editingId === update.id ? (
            <>
              <TextInput
                value={editTitle}
                onChangeText={setEditTitle}
                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  padding: 8,
                  marginBottom: 8,
                  borderRadius: 5,
                }}
              />
              <TextInput
                value={editMessage}
                onChangeText={setEditMessage}
                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  padding: 8,
                  marginBottom: 8,
                  borderRadius: 5,
                  height: 80,
                  textAlignVertical: "top",
                }}
                multiline
              />
              <Button title="Save" onPress={handleSaveEdit} />
              <Button
                title="Cancel"
                color="gray"
                onPress={() => setEditingId(null)}
              />
            </>
          ) : (
            <>
              <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                {update.title}
              </Text>
              <Text style={{ marginBottom: 10 }}>{update.message}</Text>
              <Button title="Edit" onPress={() => handleEdit(update)} />
              <View style={{ height: 5 }} />
              <Button
                title="Delete"
                color="red"
                onPress={() =>
                  Alert.alert(
                    "Confirm",
                    "Are you sure you want to delete this update?",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => handleDelete(update.id),
                      },
                    ]
                  )
                }
              />
            </>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

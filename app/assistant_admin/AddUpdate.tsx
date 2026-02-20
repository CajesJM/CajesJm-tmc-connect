import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";
import { db } from "../../lib/firebaseConfig";

export default function AddUpdate() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const handleAddUpdate = async () => {
    if (!title || !message) {
      Alert.alert("Error", "Please fill in both title and message");
      return;
    }

    try {
      await addDoc(collection(db, "updates"), {
        title,
        message,
        createdAt: serverTimestamp(),
        createdBy: "admin", // optional, you can get from user login later
      });
      Alert.alert("Success", "Update added successfully!");

      // Clear input fields
      setTitle("");
      setMessage("");
    } catch (error) {
      console.error("Error adding update: ", error);
      Alert.alert("Error", "Failed to add update");
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10 }}>
        Add New Announcement
      </Text>

      <TextInput
        placeholder="Enter title"
        value={title}
        onChangeText={setTitle}
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 10,
          marginBottom: 10,
          borderRadius: 5,
        }}
      />

      <TextInput
        placeholder="Enter message"
        value={message}
        onChangeText={setMessage}
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 10,
          marginBottom: 10,
          borderRadius: 5,
          height: 100,
          textAlignVertical: "top",
        }}
        multiline
      />

      <Button title="Post Announcement" onPress={handleAddUpdate} />
    </View>
  );
}

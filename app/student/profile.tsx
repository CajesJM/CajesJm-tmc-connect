import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Profile() {
  return (
    <View style={styles.container}>
      <Text style={styles.name}>John Doe</Text>
      <Text style={styles.info}>BSIT 3rd Year</Text>
      <Text style={styles.info}>Student ID: 2025-12345</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  name: { fontSize: 24, fontWeight: "bold" },
  info: { fontSize: 16, marginTop: 5 },
});
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function Schedule() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Schedule</Text>
      <ScrollView contentContainerStyle={styles.list}>
        <View style={styles.card}>
          <Text style={styles.course}>Math 101</Text>
          <Text style={styles.meta}>Mon • 08:00 - 10:00 • Room A1</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.course}>English 102</Text>
          <Text style={styles.meta}>Tue • 10:00 - 12:00 • Room B2</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 12 },
  list: { paddingBottom: 24 },
  card: {
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    marginBottom: 12,
  },
  course: { fontSize: 16, fontWeight: "600" },
  meta: { fontSize: 13, color: "#6b7280", marginTop: 6 },
});
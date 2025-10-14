import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import AttendanceCard from "../../components/AttendanceCard";

export default function StudentAttendance() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Attendance</Text>
      <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 24 }}>
        <AttendanceCard event="Math 101" presentCount={10} totalCount={12} />
        <AttendanceCard event="English 102" presentCount={11} totalCount={12} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  list: { marginTop: 10 },
});
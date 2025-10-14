import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  subject: string;
  time: string;
  teacher: string;
}

export default function ScheduleCard({ subject, time, teacher }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Ionicons name="calendar" size={22} color="#ff9800" />
        <Text style={styles.subject}>{subject}</Text>
      </View>
      <Text style={styles.details}>{time}</Text>
      <Text style={styles.teacher}>Instructor: {teacher}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  subject: { fontSize: 16, fontWeight: "bold", marginLeft: 8 },
  details: { fontSize: 14, color: "#555" },
  teacher: { fontSize: 13, color: "#777", marginTop: 3 },
});

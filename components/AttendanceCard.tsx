import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  event: string;
  presentCount: number;
  totalCount: number;
}

export default function AttendanceCard({ event, presentCount, totalCount }: Props) {
  const percentage = ((presentCount / totalCount) * 100).toFixed(1);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Ionicons name="people" size={24} color="#28a745" />
        <Text style={styles.title}>{event}</Text>
      </View>
      <Text style={styles.details}>
        {presentCount}/{totalCount} present ({percentage}%)
      </Text>
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
  title: { fontSize: 16, fontWeight: "bold", marginLeft: 8 },
  details: { fontSize: 14, color: "#555" },
});

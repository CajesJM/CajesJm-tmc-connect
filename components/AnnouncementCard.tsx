import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  title: string;
  description: string;
}

export default function AnnouncementCard({ title, description }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Ionicons name="megaphone" size={24} color="#007bff" />
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.description}>{description}</Text>
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
  description: { fontSize: 14, color: "#555" },
});

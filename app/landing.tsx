import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Landing() {
  const router = useRouter();
  const [role, setRole] = useState<"admin" | "student">("student");
  const { width, height } = useWindowDimensions();

  const isSmallScreen = width < 380;
  const isTablet = width > 700;

  const handleNavigate = () => {
    router.push(`/login?role=${role}`);
  };

  const dynamicStyles = {
    content: {
      width: width * 0.9,
      paddingVertical: isTablet ? 70 : isSmallScreen ? 30 : 50,
      paddingHorizontal: isTablet ? 40 : 24,
    },
    button: {
      width: isTablet ? width * 0.5 : width * 0.75,
      paddingVertical: isTablet ? 22 : isSmallScreen ? 14 : 18,
    },
    title: {
      fontSize: isTablet ? 30 : isSmallScreen ? 20 : 24,
    },
    brand: {
      fontSize: isTablet ? 46 : isSmallScreen ? 30 : 36,
    },
    subtitle: {
      fontSize: isTablet ? 22 : isSmallScreen ? 15 : 17,
    },
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.topBg, { height: height * 0.4 }]} />
      <View style={[styles.bottomBg, { height: height * 0.35 }]} />

      <View style={[styles.content, dynamicStyles.content]}>
        <Text style={[styles.title, dynamicStyles.title]}>Welcome to</Text>
        <Text style={[styles.brand, dynamicStyles.brand]}>TMC Connect</Text>
        <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
          Select your role to continue
        </Text>

        <View style={styles.roleToggle}>
          <TouchableOpacity
            style={[
              styles.roleOption,
              role === "student" && styles.selectedRoleStudent,
            ]}
            onPress={() => setRole("student")}
          >
            <Text
              style={[
                styles.roleText,
                role === "student" && styles.activeRoleText,
              ]}
            >
              Student
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleOption,
              role === "admin" && styles.selectedRoleAdmin,
            ]}
            onPress={() => setRole("admin")}
          >
            <Text
              style={[
                styles.roleText,
                role === "admin" && styles.activeRoleText,
              ]}
            >
              Admin
            </Text>
          </TouchableOpacity>
        </View>

        <RoleButton
          label="Continue"
          onPress={handleNavigate}
          variant={role}
          dynamicStyle={dynamicStyles.button}
        />
      </View>
    </SafeAreaView>
  );
}

function RoleButton({
  label,
  onPress,
  variant,
  dynamicStyle,
}: {
  label: string;
  onPress: () => void;
  variant: "admin" | "student";
  dynamicStyle: any;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
    onPress();
  };

  const backgroundColor = variant === "admin" ? "#1E88E5" : "#43A047";
  const borderColor = variant === "admin" ? "#1565C0" : "#2E7D32";

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.button, dynamicStyle, { backgroundColor, borderColor }]}
      >
        <Text style={styles.buttonText}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  topBg: {
    position: "absolute",
    top: 0,
    width: "100%",
    backgroundColor: "#C8E6C9",
    borderBottomRightRadius: 120,
  },
  bottomBg: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#E3F2FD",
    borderTopLeftRadius: 120,
  },
  content: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    color: "#444",
    fontWeight: "600",
  },
  brand: {
    fontWeight: "800",
    color: "#1B5E20",
    marginBottom: 8,
  },
  subtitle: {
    color: "#666",
    marginBottom: 24,
  },
  roleToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    marginBottom: 24,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 6,
    borderRadius: 10,
    backgroundColor: "#E0E0E0",
    alignItems: "center",
  },
  selectedRoleStudent: {
    backgroundColor: "#43A047",
  },
  selectedRoleAdmin: {
    backgroundColor: "#1E88E5",
  },
  roleText: {
    color: "#444",
    fontWeight: "700",
    fontSize: 16,
  },
  activeRoleText: {
    color: "#fff",
  },
  button: {
    borderRadius: 14,
    marginVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
});

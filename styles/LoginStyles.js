import { Dimensions, StyleSheet } from "react-native";

const { width, height } = Dimensions.get("window");
const isSmallScreen = width < 380;
const isTablet = width > 700;

export const LoginStyles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: "#0A0A0A",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  cosmicBg: {
    position: "absolute",
    top: -height * 0.25,
    left: -width * 0.15,
    width: "130%",
    height: height * 0.6,
    backgroundColor: "#1E1E1E",
    borderBottomRightRadius: 300,
    transform: [{ rotate: "-8deg" }],
  },

  nebulaBg: {
    position: "absolute",
    bottom: -height * 0.25,
    right: -width * 0.15,
    width: "130%",
    height: height * 0.6,
    backgroundColor: "#151515",
    borderTopLeftRadius: 300,
    transform: [{ rotate: "8deg" }],
  },

  card: {
    width: isTablet ? "70%" : "90%",
    maxWidth: 400,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 25,
    paddingVertical: isTablet ? 50 : 40,
    paddingHorizontal: isTablet ? 40 : 30,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.4)",
    alignItems: "center",
  },

  title: {
    fontSize: isSmallScreen ? 26 : isTablet ? 34 : 30,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 8,
  },

  subtitle: {
    fontSize: isSmallScreen ? 14 : isTablet ? 16 : 15,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    marginBottom: 30,
  },

  input: {
    width: "100%",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.15)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 16,
  },

  inputWrap: {
    width: "100%",
    position: "relative",
    marginBottom: 16,
  },

  inputWithIcon: {
    width: "100%",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.15)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingRight: 50,
    color: "#FFFFFF",
    fontSize: 16,
  },

  iconBtn: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    width: 40,
  },

  icon: {
    fontSize: 20,
    color: "rgba(255, 255, 255, 0.6)",
  },

  error: {
    color: "rgba(255, 100, 100, 0.9)",
    marginBottom: 12,
    textAlign: "center",
    fontSize: 14,
  },

  button: {
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 60,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  buttonText: {
    color: "#000000",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  disabled: {
    opacity: 0.6,
  },

  demoAccounts: {
    marginTop: 30,
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: "rgba(255, 255, 255, 0.3)",
    width: "100%",
  },

  demoTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
    color: "rgba(255, 255, 255, 0.9)",
  },

  demoText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 6,
  },

  demoNote: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.5)",
    fontStyle: "italic",
    marginTop: 8,
  },
   logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  outerContainer: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
});

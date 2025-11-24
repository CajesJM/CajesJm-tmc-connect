import { Dimensions, StyleSheet } from "react-native";

const { width, height } = Dimensions.get("window");
const isSmallScreen = width < 380;
const isTablet = width > 700;

export const LandingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  cosmicBg: {
    position: "absolute",
    top: -height * 0.3,
    left: -width * 0.2,
    width: "140%",
    height: height * 0.8,
    backgroundColor: "#1E1E1E",
    borderBottomRightRadius: 300,
    transform: [{ rotate: "-10deg" }],
  },

  nebulaBg: {
    position: "absolute",
    bottom: -height * 0.3,
    right: -width * 0.2,
    width: "140%",
    height: height * 0.8,
    backgroundColor: "#151515",
    borderTopLeftRadius: 300,
    transform: [{ rotate: "10deg" }],
  },

  content: {
    width: isTablet ? "65%" : "90%",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 25,
    paddingVertical: isTablet ? 60 : 45,
    paddingHorizontal: isTablet ? 50 : 35,
    alignItems: "center",
    justifyContent: "center",
  },

  logoWrap: {
    alignItems: 'center',
    width: '100%',
  },

  welcomeText: {
    fontSize: isSmallScreen ? 14 : isTablet ? 18 : 16,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "600",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 8,
  },

  brand: {
    fontSize: isSmallScreen ? 36 : isTablet ? 60 : 48,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -1.5,
    marginBottom: 10,
  },

  subtitleContainer: {
    marginBottom: 40,
    alignItems: "center",
  },

  subtitleLine: {
    fontSize: isSmallScreen ? 16 : isTablet ? 20 : 18,
    color: "rgba(255, 255, 255, 0.85)",
    fontWeight: "300",
    textAlign: "center",
    lineHeight: 26,
  },

  accentLine: {
    width: 60,
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 2,
    marginTop: 15,
  },

  button: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    paddingVertical: isSmallScreen ? 15 : isTablet ? 22 : 18,
    paddingHorizontal: isSmallScreen ? 45 : isTablet ? 60 : 50,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    color: "#000000",
    fontSize: isSmallScreen ? 16 : isTablet ? 18 : 17,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },

  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
});
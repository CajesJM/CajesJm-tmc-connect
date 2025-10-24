import { Dimensions, StyleSheet } from "react-native";

const { width, height } = Dimensions.get("window");
const isSmallScreen = width < 380;
const isTablet = width > 700;

export const LandingStyles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },


  cosmicBg: {
    position: "absolute",
    top: -height * 0.3,
    left: -width * 0.2,
    width: "140%",
    height: height * 0.8,
    backgroundColor: "#1a1a1a",
    borderBottomRightRadius: 400,
    transform: [{ rotate: "-12deg" }],
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 30 },
    shadowOpacity: 0.08,
    shadowRadius: 40,
    elevation: 20,
  },

  nebulaBg: {
    position: "absolute",
    bottom: -height * 0.3,
    right: -width * 0.2,
    width: "140%",
    height: height * 0.8,
    backgroundColor: "#111111",
    borderTopLeftRadius: 400,
    transform: [{ rotate: "12deg" }],
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 30 },
    shadowOpacity: 0.06,
    shadowRadius: 40,
    elevation: 20,
  },


  particle1: {
    position: "absolute",
    top: height * 0.2,
    left: width * 0.15,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  particle2: {
    position: "absolute",
    top: height * 0.4,
    right: width * 0.2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  particle3: {
    position: "absolute",
    bottom: height * 0.3,
    left: width * 0.25,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },


  content: {
    width: isTablet ? "65%" : "90%",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 40,
    paddingVertical: isTablet ? 60 : 50,
    paddingHorizontal: isTablet ? 50 : 35,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 50,
    elevation: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
    position: "relative",
  },

  contentGlow: {
    position: "absolute",
    top: -100,
    left: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    blurRadius: 30,
  },


  welcomeText: {
    fontSize: isSmallScreen ? 14 : isTablet ? 18 : 16,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 8,
  },

  brand: {
    fontSize: isSmallScreen ? 36 : isTablet ? 64 : 48,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -1.5,
    textShadowColor: "rgba(255, 255, 255, 0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: 5,
    backgroundImage: "linear-gradient(135deg, #FFFFFF 0%, #E0E0E0 100%)",
    backgroundClip: "text",
  },

  subtitleContainer: {
    marginBottom: 40,
    alignItems: "center",
  },

  subtitleLine: {
    fontSize: isSmallScreen ? 16 : isTablet ? 20 : 18,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "300",
    textAlign: "center",
    letterSpacing: 0.5,
    lineHeight: 28,
  },

  accentLine: {
    width: 60,
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 2,
    marginTop: 20,
  },

 
  buttonContainer: {
    borderRadius: 30,
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 15,
    marginTop: 10,
    overflow: "hidden",
  },

  button: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    paddingVertical: isSmallScreen ? 18 : isTablet ? 24 : 20,
    paddingHorizontal: isSmallScreen ? 45 : isTablet ? 60 : 50,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },

  buttonText: {
    color: "#000000",
    fontSize: isSmallScreen ? 16 : isTablet ? 18 : 17,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
  },

  buttonGlow: {
    position: "absolute",
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 40,
    blurRadius: 20,
  },

  orbPrimary: {
    position: "absolute",
    top: height * 0.18,
    left: width * 0.12,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },

  orbSecondary: {
    position: "absolute",
    bottom: height * 0.15,
    right: width * 0.15,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    s
import { Dimensions, StyleSheet } from "react-native";

const { width, height } = Dimensions.get("window");
const isSmallScreen = width < 380;
const isTablet = width > 700;

export const LandingStyles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
    position: "relative",
    overflow: "hidden",
  },

  background: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "#0A0A0A",
  },

  gradientOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundImage: "linear-gradient(135deg, #0A0A0A 0%, #1a0a2a 100%)",
  },

  slideBackground: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },

  floatingOrbs: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },

  orb: {
    position: "absolute",
    borderRadius: 500,
  },

  orb1: {
    width: 300,
    height: 300,
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    top: -100,
    left: -100,
  },

  orb2: {
    width: 200,
    height: 200,
    backgroundColor: "rgba(236, 72, 153, 0.1)",
    bottom: -50,
    right: -50,
  },

  orb3: {
    width: 150,
    height: 150,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    top: "50%",
    right: "27%",
  },

  mainContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  contentCard: {
    width: isTablet ? "70%" : "100%",
    maxWidth: 450,
    borderRadius: 32,
    paddingVertical: isTablet ? 50 : 40,
    paddingHorizontal: isTablet ? 40 : 30,
    alignItems: "center",
    borderWidth: 0.7, 
    borderColor: "rgba(139, 92, 246, 0.4)", 
   
    backdropFilter: "blur(20px)",
  },

  logoSection: {
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
  },

  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5, 
    borderColor: "rgba(139, 92, 246, 0.4)", 
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    zIndex: 2,
  },

  logoGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(139, 92, 246, 0.15)", 
    zIndex: 1,
  },

  textContent: {
    alignItems: "center",
    marginBottom: 40,
  },

  welcomeText: {
    fontSize: isSmallScreen ? 13 : isTablet ? 16 : 14,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "600",
    letterSpacing: 3.5,
    textTransform: "uppercase",
    marginBottom: 8,
    fontFamily: "System",
  },

  brandName: {
    fontSize: isSmallScreen ? 38 : isTablet ? 64 : 50,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -1,
    marginBottom: 25,
    textShadowColor: "rgba(139, 92, 246, 0.3)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 15,
    fontFamily: "System",
  },

  subtitleSection: {
    marginBottom: 10,
    alignItems: "center",
  },

  subtitle: {
    fontSize: isSmallScreen ? 16 : isTablet ? 20 : 18,
    color: "rgba(255, 255, 255, 0.85)",
    fontWeight: "300",
    textAlign: "center",
    lineHeight: 28,
    fontFamily: "System",
    letterSpacing: 0.3,
  },

  divider: {
    width: 80,
    height: 2.5, 
    backgroundColor: "rgba(139, 92, 246, 0.6)", 
    borderRadius: 2,
    marginTop: 25,
  },

  skipButton: {
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 25,
    borderWidth: 0.5, 
    borderColor: "rgba(139, 92, 246, 0.3)", 
  },

  skipButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  skipText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 0.5,
    fontFamily: "System",
  },

  skipArrow: {
    color: "rgba(139, 92, 246, 0.9)",
    fontSize: 18,
    fontWeight: "600",
  },

  progressSection: {
    position: "absolute",
    bottom: isSmallScreen ? 40 : 60,
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  progressContainer: {
    width: "100%",
    maxWidth: 400,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginBottom: 12,
  },

  progressBackground: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "rgba(139, 92, 246, 0.9)", 
    borderRadius: 2,
  },

  progressText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "System",
    minWidth: 35,
  },

  progressLabel: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 12,
    fontWeight: "400",
    fontFamily: "System",
    letterSpacing: 0.5,
  },
});
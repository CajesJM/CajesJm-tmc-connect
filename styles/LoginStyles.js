import { Dimensions, StyleSheet } from "react-native";

const { width, height } = Dimensions.get("window");
const isSmallScreen = width < 380;
const isTablet = width > 700;

export const LoginStyles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  outerContainer: {
    flex: 1,
  },
  
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  
  card: {
    width: isTablet ? "70%" : "90%",
    maxWidth: 420,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 32,
    paddingVertical: isTablet ? 50 : 40,
    paddingHorizontal: isTablet ? 40 : 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
    backdropFilter: 'blur(10px)',
  },
  
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  
  logoGlow: {
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  
  logo: {
    width: isTablet ? 140 : 110,
    height: isTablet ? 140 : 110,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "rgba(139, 92, 246, 0.5)",
  },
  
  title: {
    fontSize: isSmallScreen ? 28 : isTablet ? 36 : 32,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  
  subtitle: {
    fontSize: isSmallScreen ? 14 : isTablet ? 16 : 15,
    color: "rgba(255, 255, 255, 0.75)",
    textAlign: "center",
    marginBottom: 36,
    fontWeight: "500",
  },
  
  inputContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    position: "relative",
  },
  
  inputIcon: {
    marginRight: 12,
  },
  
  input: {
    flex: 1,
    paddingVertical: 16,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  
  eyeIcon: {
    padding: 8,
  },
  
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 100, 100, 0.15)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 20,
    width: "100%",
  },
  
  error: {
    color: "#FF6B6B",
    marginLeft: 8,
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  
  button: {
    backgroundColor: "#8B5CF6",
    borderRadius: 25,
    paddingVertical: 16,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#8B5CF6",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  
  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  
  disabled: {
    opacity: 0.6,
  },
  
  forgotPassword: {
    marginTop: 20,
    padding: 8,
  },
  
  forgotPasswordText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    fontWeight: "500",
  },
  
  decorativeLine: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
    width: "100%",
  },
  
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  
  decorativeText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 12,
    marginHorizontal: 12,
    fontWeight: "500",
  },
});
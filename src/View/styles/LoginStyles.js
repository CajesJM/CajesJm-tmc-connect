import { Dimensions, Platform, StyleSheet } from "react-native";

const { width, height } = Dimensions.get("window");

export const COLORS = {

  gradientStart: "#3A5BF0",   
  gradientMid:   "#5B3FD4",   
  gradientEnd:   "#7B2FF7",  

  white:         "#FFFFFF",
  formBg:        "#F5F7FF",   
  inputBg:       "#ECEEF8",
  inputBorder:   "#DDE0F5",

  titleDark:     "#1A1D3A",
  subtitleGray:  "#6B7280",
  placeholderGray:"#A0A3B5",
  linkBlue:      "#4C6EF5",

  errorRed:      "#EF4444",
  errorBg:       "#FFF0F0",

  dividerLine:   "#D1D5F0",
  iconTint:      "#8B92C4",
};

export const FONTS = {

  title: Platform.select({
    ios:     "Georgia",
    android: "serif",
    default: "Georgia, serif",
  }),
  body: Platform.select({
    ios:     "Helvetica Neue",
    android: "sans-serif",
    default: "'Helvetica Neue', sans-serif",
  }),
};

export const LoginStyles = StyleSheet.create({

 
  root: {
    flex: 1,
    backgroundColor: COLORS.formBg,
  },


  header: {
    width: "100%",
    height: height * 0.35,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 50 : 35,
    // Wave bottom edge
    borderBottomLeftRadius: width * 0.30,
    borderBottomRightRadius: width * 0.30,
    overflow: "hidden",
  },

  // ── Logo block inside header ────────────────────────────────────
  logoWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoGlow: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,

  },
  appName: {
    marginTop: 14,
    fontSize: 13,
    fontFamily: FONTS.body,
    fontWeight: "600",
    letterSpacing: 3,
    color: "rgba(255,255,255,0.80)",
    textTransform: "uppercase",
  },

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 40,
  },

  // ── Form section heading ───────────────────────────────────────
  titleRow: {
    marginBottom: 6,
    marginTop: 14,
  },
  title: {
    fontSize: 34,
    fontFamily: FONTS.title,
    fontWeight: "700",
    color: COLORS.titleDark,
    letterSpacing: -0.5,
  },
  titleAccent: {
    color: COLORS.gradientStart,   
    fontFamily: FONTS.title,
    fontWeight: "700",
    fontSize: 34,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: COLORS.subtitleGray,
    marginBottom: 32,
    lineHeight: 20,
  },

  // ── Input fields ───────────────────────────────────────────────
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 56,
    shadowColor: "#4C6EF5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  inputWrapperFocused: {
    borderColor: COLORS.gradientStart,
    backgroundColor: "#FFFFFF",
    shadowOpacity: 0.12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.body,
    color: COLORS.titleDark,
  },
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },

  // ── Error banner ───────────────────────────────────────────────
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.errorBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.body,
    color: COLORS.errorRed,
    lineHeight: 18,
  },

  // ── Primary CTA button ──────
  buttonGradient: {
    borderRadius: 16,
    marginTop: 8,
    shadowColor: COLORS.gradientMid,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 16,
    elevation: 8,
  },
  button: {
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: FONTS.body,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },

  // ── Forgot password ────────────────────────────────────────────
  forgotRow: {
    alignItems: "center",
    marginTop: 18,
  },
  forgotText: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: COLORS.linkBlue,
    fontWeight: "500",
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 32,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.dividerLine,
  },
  dividerLabel: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: COLORS.placeholderGray,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  statusBarSpacer: {
    height: Platform.OS === "android" ? 28 : 0,
  },
});
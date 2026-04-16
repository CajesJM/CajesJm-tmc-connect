import { Dimensions, Platform, StyleSheet } from "react-native";

const { width, height } = Dimensions.get("window");

export const COLORS = {
  gradientStart: "#3A5BF0",
  gradientMid:   "#5B3FD4",
  gradientEnd:   "#7B2FF7",

  white:         "#FFFFFF",
  whiteHigh:     "rgba(255,255,255,0.95)",
  whiteMid:      "rgba(255,255,255,0.70)",
  whiteLow:      "rgba(255,255,255,0.45)",
  whiteGhost:    "rgba(255,255,255,0.15)",

  orb1:          "rgba(255,255,255,0.10)",
  orb2:          "rgba(91,63,212,0.35)",
  orb3:          "rgba(58,91,240,0.25)",

  progressTrack: "rgba(255,255,255,0.25)",
  progressFill:  "#FFFFFF",
};

export const FONTS = {
  display: Platform.select({
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

export const LandingStyles = StyleSheet.create({

  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },

  // ── Floating orbs ───────────────────────────────────────────────
  orbsContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: "none",
  },
  orb: {
    position: "absolute",
    borderRadius: 999,
  },
  orb1: {
    width:  width * 0.75,
    height: width * 0.75,
    top:    -width * 0.25,
    right:  -width * 0.20,
    backgroundColor: COLORS.orb1,
    borderWidth: 1,
    borderColor: COLORS.whiteLow,
  },
  orb2: {
    width:  width * 0.55,
    height: width * 0.55,
    bottom: height * 0.12,
    left:   -width * 0.18,
    backgroundColor: COLORS.orb2,
  },
  orb3: {
    width:  width * 0.40,
    height: width * 0.40,
    bottom: height * 0.30,
    right:  -width * 0.08,
    backgroundColor: COLORS.orb3,
  },

  // ── Main content wrapper ────────────────────────────────────────
  mainContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  // ── Logo section ────────────────────────────────────────────────
  logoSection: {
    alignItems: "center",
    marginBottom: 36,
  },
 
  logoGlowRing: {
    width:  104,
    height: 104,
    borderRadius: 52,
    backgroundColor: COLORS.whiteGhost,
    borderWidth: 1.5,
    borderColor: COLORS.whiteLow,
    alignItems: "center",
    justifyContent: "center",
  },
  // Inner ring — adds depth
  logoInnerRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.whiteGhost,
    borderWidth: 1,
    borderColor: COLORS.whiteLow,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width:  100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.white,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },

  // ── Text content ────────────────────────────────────────────────
  textContent: {
    alignItems: "center",
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: FONTS.body,
    fontWeight: "700",
    color: COLORS.whiteMid,
    letterSpacing: 3.5,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  brandName: {
    fontSize: 42,
    fontFamily: FONTS.display,
    fontWeight: "700",
    color: COLORS.whiteHigh,
    letterSpacing: -1,
    marginBottom: 20,
  },
  brandAccent: {
    // "Connect" rendered via a nested Text with this style
    color: "rgba(200,210,255,0.95)",
    fontFamily: FONTS.display,
    fontWeight: "700",
    fontSize: 42,
    letterSpacing: -1,
  },
  subtitleLine: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: COLORS.whiteMid,
    lineHeight: 22,
    textAlign: "center",
  },

  // Decorative dot-divider between subtitle lines
  dotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.whiteLow,
  },
  dotActive: {
    width: 20,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.whiteMid,
  },

  // ── Progress section ────────────────────────────────────────────
  progressSection: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 48 : 36,
    left: 40,
    right: 40,
    alignItems: "center",
    gap: 10,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.progressTrack,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: COLORS.progressFill,
  },
  progressPercent: {
    fontSize: 12,
    fontFamily: FONTS.body,
    fontWeight: "600",
    color: COLORS.whiteMid,
    minWidth: 32,
    textAlign: "right",
  },
  progressLabel: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: COLORS.whiteLow,
    letterSpacing: 0.5,
  },

  // ── Skip tap hint ────────────────────────────────────────────────
  skipHint: {
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipHintText: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: COLORS.whiteLow,
    letterSpacing: 0.5,
  },
});
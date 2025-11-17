import { Dimensions, StyleSheet } from "react-native";

const { width } = Dimensions.get("window");
const isSmallDevice = width < 375;

export const attendanceStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F4F8",
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 80,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1E293B",
    textAlign: "center",
    marginVertical: 20,
  },

  // Card styling
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
    textAlign: "center",
  },

  // Inputs & labels
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
  },
  inputText: {
    color: "#111827",
    fontWeight: "600",
  },
  placeholderText: {
    color: "#9CA3AF",
  },

  // QR Section
  qrContainer: {
    alignItems: "center",
    marginTop: 12,
    backgroundColor: "#F8FAFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  eventName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E40AF",
    marginBottom: 6,
  },
  eventDate: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: "#2563EB",
    marginBottom: 12,
  },

  qrStatus: {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  qrStatusActive: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  qrStatusExpired: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  qrStatusTitle: {
    fontWeight: "700",
    fontSize: 14,
    color: "#111827",
  },
  qrStatusText: {
    fontSize: 13,
    color: "#4B5563",
  },
  qrStatusNote: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },

  codeHint: {
    marginTop: 8,
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
  },
  locationHint: {
    fontSize: 13,
    color: "#3B82F6",
    marginTop: 6,
  },

  expiredQRPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  expiredQRTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#B91C1C",
    marginTop: 8,
  },
  expiredQRDescription: {
    color: "#6B7280",
    fontSize: 13,
  },

  expirationManagement: {
    marginTop: 16,
    backgroundColor: "#F9FAFB",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  managementTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  managementButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  managementButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 4,
  },
  setExpirationButton: {
    backgroundColor: "#3B82F6",
  },
  clearExpirationButton: {
    backgroundColor: "#EF4444",
  },
  managementButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 13,
  },
  managementNote: {
    textAlign: "center",
    color: "#6B7280",
    marginTop: 8,
    fontSize: 12,
  },

  // Buttons
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 20,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  refreshButton: {
    backgroundColor: "#16A34A",
  },
  clearButton: {
    backgroundColor: "#F59E0B",
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "700",
  },

  // Attendance Record Section
  attendanceContainer: {
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderColor: "#E5E7EB",
    borderWidth: 1,
  },
  attendanceHeader: {
    marginBottom: 12,
  },
  attendanceTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  filterContainer: {
    marginBottom: 8,
  },
  filterContainerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginRight: 6,
  },
  filterButton: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 6,
  },
  filterButtonActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  filterButtonText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 13,
  },
  filterButtonTextActive: {
    color: "#FFF",
  },

  blockSection: {
    marginBottom: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
  },
  blockHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  blockTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  blockCount: {
    color: "#6B7280",
    fontSize: 13,
  },
  attendanceItem: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  studentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  studentName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  studentId: {
    fontSize: 12,
    color: "#6B7280",
  },
  locationBadge: {
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  locationValid: {
    backgroundColor: "#DCFCE7",
  },
  locationInvalid: {
    backgroundColor: "#FEE2E2",
  },
  locationBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  studentDetails: {
    color: "#4B5563",
    fontSize: 13,
    marginTop: 4,
  },
  timestamp: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 6,
  },

  // Modal styling
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  modalSubtitle: {
    color: "#6B7280",
    fontSize: 13,
    marginBottom: 16,
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
  },
  modalButton: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginLeft: 8,
  },
  confirmButton: {
    backgroundColor: "#3B82F6",
  },
  cancelButton: {
    backgroundColor: "#9CA3AF",
  },
  modalButtonText: {
    color: "#FFF",
    fontWeight: "700",
  },
});

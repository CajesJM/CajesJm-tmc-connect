import { Dimensions, StyleSheet } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const COLORS = {
  primary: '#4F46E5',
  primaryLight: '#6366F1',
  secondary: '#6B7280',
  background: '#F0F4F8',
  cardBg: '#FFFFFF',
  textDark: '#111827',
  textMedium: '#374151',
  textLight: '#6B7280',
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#DC2626',
  info: '#3B82F6',
  shadow: '#000000',
};

export const AnnouncementStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header styles with responsive variants
  header: {
    backgroundColor: COLORS.primary,
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  headerSmall: {
    padding: 16,
    marginBottom: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerIconSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  headerTitleSmall: {
    fontSize: 18,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 16,
  },
  headerSubtitleSmall: {
    fontSize: 11,
    lineHeight: 14,
  },

  // Stats container responsive styles
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  statsContainerSmall: {
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 6,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statCardSmall: {
    padding: 8,
    borderRadius: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 2,
  },
  statNumberSmall: {
    fontSize: 16,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statLabelSmall: {
    fontSize: 9,
  },

  // Filter section responsive styles
  filterSection: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterSectionSmall: {
    padding: 12,
    marginHorizontal: 12,
    marginBottom: 8,
  },
  filterScrollView: {
    flex: 1,
  },
  filterChips: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipSmall: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMedium,
    marginLeft: 4,
  },
  filterChipTextSmall: {
    fontSize: 11,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },

  // Create button responsive styles
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    minWidth: 44, // Minimum touch target size
    minHeight: 36,
    justifyContent: 'center',
  },
  createButtonSmall: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 40,
    minHeight: 36,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Results info responsive
  resultsInfo: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  resultsInfoSmall: {
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  resultsText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  resultsTextSmall: {
    fontSize: 11,
  },

  // List content responsive
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  listContentSmall: {
    paddingHorizontal: 12,
    paddingBottom: 16,
  },

  // Card responsive styles
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardSmall: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardHeaderSmall: {
    marginBottom: 6,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    flex: 1,
    lineHeight: 20,
  },
  cardTitleSmall: {
    fontSize: 14,
    lineHeight: 18,
  },
  cardMessage: {
    fontSize: 14,
    color: COLORS.textMedium,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardMessageSmall: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cardActionsSmall: {
    gap: 6,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  editButtonSmall: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  editButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  editButtonTextSmall: {
    fontSize: 10,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  deleteButtonSmall: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  deleteButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
  },
  deleteButtonTextSmall: {
    fontSize: 10,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  dateContainerSmall: {
    marginTop: 6,
  },
  timestamp: {
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: '500',
    marginLeft: 4,
  },
  timestampSmall: {
    fontSize: 10,
  },
  newBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#065F46',
    letterSpacing: 0.3,
  },

  // Modal responsive styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalHeaderSmall: {
    padding: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  backButtonTextSmall: {
    fontSize: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  modalTitleSmall: {
    fontSize: 16,
  },
  placeholder: {
    width: 100,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: 16,
  },
  modalContentContainerSmall: {
    padding: 12,
  },
  formSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  labelSmall: {
    fontSize: 13,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    fontSize: 14,
    color: COLORS.textDark,
  },
  inputSmall: {
    padding: 10,
    fontSize: 13,
    borderRadius: 6,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  textAreaSmall: {
    minHeight: 100,
  },
  buttonContainer: {
    gap: 12,
    marginTop: 8,
  },
  buttonContainerSmall: {
    gap: 10,
    marginTop: 6,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonSmall: {
    padding: 14,
    borderRadius: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonTextSmall: {
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonSmall: {
    padding: 14,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: COLORS.textMedium,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonTextSmall: {
    fontSize: 14,
  },

  // Empty state responsive
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateSmall: {
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    color: COLORS.textDark,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateTitleSmall: {
    fontSize: 16,
    marginBottom: 6,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  emptyStateTextSmall: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  emptyStateButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyStateButtonSmall: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyStateButtonTextSmall: {
    fontSize: 13,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textLight,
  },
});
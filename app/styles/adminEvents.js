import { Dimensions, Platform, StyleSheet } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallScreen = screenWidth < 375;
const isMediumScreen = screenWidth < 768;

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    loadingText: {
        marginTop: 10,
        color: '#64748B',
        fontSize: isSmallScreen ? 14 : 16,
        fontWeight: '500',
    },
    dashboardHeader: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: isSmallScreen ? 12 : 16,
        paddingTop: Platform.OS === 'ios' ? (isSmallScreen ? 40 : 45) : (isSmallScreen ? 20 : 25),
        paddingBottom: isSmallScreen ? 10 : 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },
    dashboardHeaderSmall: {
        paddingHorizontal: 12,
        paddingTop: Platform.OS === 'ios' ? 40 : 20,
        paddingBottom: 10,
    },
    headerContent: {
        marginBottom: isSmallScreen ? 8 : 10,
    },
    title: {
        fontSize: isSmallScreen ? 20 : 24,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 2,
    },
    titleSmall: {
        fontSize: 20,
    },
    subtitle: {
        fontSize: isSmallScreen ? 12 : 13,
        color: '#64748B',
        fontWeight: '500',
    },
    subtitleSmall: {
        fontSize: 12,
    },
    headerStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    headerStatsSmall: {
        // Additional small screen adjustments if needed
    },
    statCard: {
        backgroundColor: '#F1F5F9',
        padding: isSmallScreen ? 8 : 10,
        borderRadius: 8,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: isSmallScreen ? 2 : 3,
    },
    statCardSmall: {
        padding: 8,
        marginHorizontal: 2,
    },
    statNumber: {
        fontSize: isSmallScreen ? 16 : 18,
        fontWeight: 'bold',
        color: '#1E88E5',
        marginBottom: 2,
    },
    statNumberSmall: {
        fontSize: 16,
    },
    statLabel: {
        fontSize: isSmallScreen ? 9 : 10,
        color: '#64748B',
        fontWeight: '500',
    },
    statLabelSmall: {
        fontSize: 9,
    },
    headerActions: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: isSmallScreen ? 12 : 16,
        paddingVertical: isSmallScreen ? 8 : 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        flexDirection: isSmallScreen ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: isSmallScreen ? 8 : 0,
    },
    headerActionsSmall: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: 'column',
        gap: 8,
    },
    filterContainer: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
        padding: isSmallScreen ? 1 : 2,
        flex: isSmallScreen ? 0 : 1,
        marginRight: isSmallScreen ? 0 : 8,
        width: isSmallScreen ? '100%' : 'auto',
    },
    filterButton: {
        paddingHorizontal: isSmallScreen ? 10 : 12,
        paddingVertical: isSmallScreen ? 6 : 8,
        borderRadius: 6,
        marginHorizontal: isSmallScreen ? 1 : 2,
        flex: 1,
        alignItems: 'center',
    },
    filterButtonActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    filterButtonText: {
        fontSize: isSmallScreen ? 11 : 12,
        color: '#64748B',
        fontWeight: '500',
    },
    filterButtonTextActive: {
        color: '#1E88E5',
        fontWeight: '600',
    },
    createButton: {
        backgroundColor: '#1E88E5',
        paddingHorizontal: isSmallScreen ? 14 : 16,
        paddingVertical: isSmallScreen ? 10 : 12,
        borderRadius: 8,
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
        width: isSmallScreen ? '100%' : 'auto',
        alignItems: 'center',
    },
    createButtonSmall: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        width: '100%',
    },
    createButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: isSmallScreen ? 13 : 14,
    },
    createButtonTextSmall: {
        fontSize: 13,
    },
    listContent: {
        padding: isSmallScreen ? 8 : 12,
        paddingTop: isSmallScreen ? 4 : 6,
    },
    listContentSmall: {
        padding: 8,
        paddingTop: 4,
    },
    eventCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: isSmallScreen ? 10 : 12,
        marginBottom: isSmallScreen ? 8 : 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    eventCardSmall: {
        borderRadius: 10,
        marginBottom: 8,
    },
    eventImageContainer: {
        position: 'relative',
    },
    eventImage: {
        width: '100%',
        height: isSmallScreen ? 120 : 140,
    },
    eventImageSmall: {
        height: 120,
    },
    eventBadge: {
        position: 'absolute',
        top: isSmallScreen ? 6 : 8,
        right: isSmallScreen ? 6 : 8,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        paddingHorizontal: isSmallScreen ? 6 : 8,
        paddingVertical: isSmallScreen ? 3 : 4,
        borderRadius: isSmallScreen ? 10 : 12,
    },
    eventBadgeSmall: {
        top: 6,
        right: 6,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 10,
    },
    todayBadge: {
        backgroundColor: '#EF4444',
    },
    tomorrowBadge: {
        backgroundColor: '#F59E0B',
    },
    upcomingBadge: {
        backgroundColor: '#10B981',
    },
    pastBadge: {
        backgroundColor: '#6B7280',
    },
    eventBadgeText: {
        color: '#FFFFFF',
        fontSize: isSmallScreen ? 9 : 10,
        fontWeight: '600',
    },
    eventBadgeTextSmall: {
        fontSize: 9,
    },
    eventContent: {
        padding: isSmallScreen ? 12 : 14,
    },
    eventContentSmall: {
        padding: 12,
    },
    eventHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: isSmallScreen ? 6 : 8,
    },
    eventMeta: {
        flex: 1,
    },
    eventLocation: {
        fontSize: isSmallScreen ? 11 : 12,
        color: '#1E88E5',
        fontWeight: '700',
        marginBottom: 2,
    },
    eventLocationSmall: {
        fontSize: 11,
    },
    eventDate: {
        fontSize: isSmallScreen ? 9 : 10,
        color: '#64748B',
        fontWeight: '500',
    },
    eventDateSmall: {
        fontSize: 9,
    },
    editButton: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: isSmallScreen ? 6 : 8,
        paddingVertical: isSmallScreen ? 3 : 4,
        borderRadius: 4,
        marginLeft: isSmallScreen ? 3 : 4,
    },
    editButtonSmall: {
        paddingHorizontal: 6,
        paddingVertical: 3,
        marginLeft: 3,
    },
    editButtonText: {
        color: '#475569',
        fontWeight: '600',
        fontSize: isSmallScreen ? 9 : 10,
    },
    editButtonTextSmall: {
        fontSize: 9,
    },
    eventTitle: {
        fontSize: isSmallScreen ? 14 : 16,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: isSmallScreen ? 3 : 4,
        lineHeight: isSmallScreen ? 18 : 20,
    },
    eventTitleSmall: {
        fontSize: 14,
        marginBottom: 3,
        lineHeight: 18,
    },
    eventDescription: {
        fontSize: isSmallScreen ? 11 : 12,
        color: '#475569',
        lineHeight: isSmallScreen ? 14 : 16,
        marginBottom: isSmallScreen ? 3 : 4,
    },
    eventDescriptionSmall: {
        fontSize: 11,
        lineHeight: 14,
        marginBottom: 3,
    },
    locationDescription: {
        fontSize: isSmallScreen ? 9 : 10,
        color: '#64748B',
        fontStyle: 'italic',
        marginBottom: isSmallScreen ? 6 : 8,
    },
    locationDescriptionSmall: {
        fontSize: 9,
        marginBottom: 6,
    },
    eventStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: isSmallScreen ? 8 : 10,
    },
    eventOrganizer: {
        fontSize: isSmallScreen ? 9 : 10,
        color: '#94A3B8',
        fontWeight: '500',
    },
    eventOrganizerSmall: {
        fontSize: 9,
    },
    attendeeCount: {
        fontSize: isSmallScreen ? 9 : 10,
        color: '#94A3B8',
        fontWeight: '500',
    },
    attendeeCountSmall: {
        fontSize: 9,
    },
    eventFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    eventActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: isSmallScreen ? 3 : 4,
    },
    deleteButton: {
        backgroundColor: '#EF4444',
        paddingHorizontal: isSmallScreen ? 10 : 12,
        paddingVertical: isSmallScreen ? 5 : 6,
        borderRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    deleteButtonSmall: {
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    deleteButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: isSmallScreen ? 9 : 10,
    },
    deleteButtonTextSmall: {
        fontSize: 9,
    },

    fullPageModalContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: isSmallScreen ? 16 : 20,
        paddingTop: Platform.OS === 'ios' ? (isSmallScreen ? 50 : 60) : (isSmallScreen ? 30 : 40),
        paddingBottom: isSmallScreen ? 16 : 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        fontSize: isSmallScreen ? 14 : 16,
        color: '#1E88E5',
        fontWeight: '600',
    },
    modalTitle: {
        fontSize: isSmallScreen ? 18 : 20,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    placeholder: {
        width: 60,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    fullPageScrollView: {
        flex: 1,
    },
    fullPageFormContent: {
        padding: isSmallScreen ? 16 : 20,
        paddingBottom: isSmallScreen ? 30 : 40,
    },
    formSection: {
        marginBottom: isSmallScreen ? 20 : 24,
    },
    sectionLabel: {
        fontSize: isSmallScreen ? 14 : 16,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: isSmallScreen ? 14 : 16,
        fontSize: isSmallScreen ? 14 : 16,
        color: '#1E293B',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 1,
    },
    textArea: {
        height: isSmallScreen ? 80 : 100,
        textAlignVertical: 'top',
        paddingTop: isSmallScreen ? 14 : 16,
    },
    datePickerButton: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: isSmallScreen ? 14 : 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 1,
    },
    datePickerText: {
        fontSize: isSmallScreen ? 14 : 16,
        color: '#1E293B',
        fontWeight: '500',
    },
    datePickerLabel: {
        fontSize: isSmallScreen ? 11 : 12,
        color: '#64748B',
        marginTop: 4,
    },
    locationPickerButton: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: isSmallScreen ? 14 : 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 1,
    },
    locationPickerText: {
        fontSize: isSmallScreen ? 14 : 16,
        color: '#1E293B',
        fontWeight: '500',
    },
    locationPickerLabel: {
        fontSize: isSmallScreen ? 11 : 12,
        color: '#64748B',
        marginTop: 4,
    },
    imageUploadButton: {
        backgroundColor: '#F1F5F9',
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        borderRadius: 12,
        padding: isSmallScreen ? 16 : 20,
        alignItems: 'center',
        marginBottom: 12,
    },
    imageUploadText: {
        fontSize: isSmallScreen ? 14 : 16,
        color: '#64748B',
        fontWeight: '500',
    },
    selectedImagePreview: {
        width: '100%',
        height: isSmallScreen ? 150 : 200,
        borderRadius: 12,
        marginTop: 8,
    },
    submitButtonContainer: {
        marginTop: isSmallScreen ? 20 : 24,
    },
    submitButton: {
        backgroundColor: '#1E88E5',
        padding: isSmallScreen ? 16 : 18,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: {
        backgroundColor: '#9CA3AF',
        shadowColor: '#9CA3AF',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: isSmallScreen ? 14 : 16,
    },
    cancelButton: {
        padding: isSmallScreen ? 14 : 16,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#64748B',
        fontSize: isSmallScreen ? 14 : 16,
        fontWeight: '500',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    closeButton: {
        fontSize: isSmallScreen ? 14 : 16,
        color: '#1E88E5',
        fontWeight: '600',
    },
    locationsList: {
        flex: 1,
    },
    customLocationContainer: {
        padding: isSmallScreen ? 16 : 20,
    },
    helperText: {
        fontSize: isSmallScreen ? 11 : 12,
        color: '#64748B',
        marginTop: 4,
        fontStyle: 'italic',
    },

    emptyState: {
        alignItems: 'center',
        padding: isSmallScreen ? 30 : 40,
        marginTop: isSmallScreen ? 40 : 60,
    },
    emptyStateSmall: {
        padding: 30,
        marginTop: 40,
    },
    emptyStateTitle: {
        fontSize: isSmallScreen ? 18 : 20,
        color: '#64748B',
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyStateTitleSmall: {
        fontSize: 18,
    },
    emptyStateText: {
        fontSize: isSmallScreen ? 12 : 14,
        color: '#94A3B8',
        textAlign: 'center',
        marginBottom: 24,
    },
    emptyStateTextSmall: {
        fontSize: 12,
    },
    emptyStateButton: {
        backgroundColor: '#1E88E5',
        paddingHorizontal: isSmallScreen ? 20 : 24,
        paddingVertical: isSmallScreen ? 10 : 12,
        borderRadius: 8,
    },
    emptyStateButtonSmall: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    emptyStateButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: isSmallScreen ? 12 : 14,
    },
    emptyStateButtonTextSmall: {
        fontSize: 12,
    },

    coordinatesButton: {
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 16,
        backgroundColor: '#F8FAFC',
        marginBottom: 8,
    },
    coordinatesButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    coordinatesButtonText: {
        flex: 1,
        marginLeft: 12,
        marginRight: 8,
    },
    coordinatesButtonTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 2,
    },
    coordinatesButtonSubtitle: {
        fontSize: 14,
        color: '#64748B',
    },
    coordinatesActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginTop: 16,
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: '#F1F5F9',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    secondaryButtonText: {
        color: '#64748B',
        fontWeight: '600',
        fontSize: 16,
    },
    sectionDescription: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
        marginBottom: 20,
        textAlign: 'center',
    },
    inputHint: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 4,
        fontStyle: 'italic',
    },
    verificationBadge: {
        backgroundColor: '#10B98120',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginTop: 4,
        marginBottom: 8,
        marginLeft: -8,
    },
    verificationBadgeText: {
        color: '#10B981',
        fontSize: 10,
        fontWeight: '600',
    },

    mapContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    mapHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingTop: 60,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    mapTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    mapDoneButton: {
        padding: 8,
    },
    mapDoneButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e6dff',
    },
    map: {
        flex: 1,
    },
    mapControls: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    mapInstruction: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },

    mapPickerButton: {
        backgroundColor: '#f0f7ff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#1e6dff',
        marginBottom: 8,
    },
    secondaryLocationButton: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 8,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    buttonTextContainer: {
        flex: 1,
    },
    buttonTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e6dff',
    },
    buttonSubtitle: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    secondaryButtonTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },

    coordinatesDisplay: {
        marginTop: 8,
        padding: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
    },
    coordinatesText: {
        fontSize: 14,
        color: '#666',
    },
    radiusControl: {
        marginTop: 12,
    },
    radiusLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    radiusSlider: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    radiusActive: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e6dff',
        padding: 8,
        backgroundColor: '#f0f7ff',
        borderRadius: 6,
    },
    radiusInactive: {
        fontSize: 14,
        color: '#666',
        padding: 8,
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        textAlign: 'center',
        marginVertical: 10,
        fontWeight: '500',
    },
     sectionContainer: {
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'center',
  },
  
  hintContainer: {
    marginTop: 4,
    paddingHorizontal: 4,
  },
  
  inputHint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  
  coordinatesDisplay: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  
  coordinatesText: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 4,
  },
   locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 4,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e1e5e9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  
  locationOptionSelected: {
    backgroundColor: '#f0f7ff',
    borderColor: '#1e6dffff',
    shadowColor: '#1e6dffff',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  
  locationOptionImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: '#f8f9fa',
  },
  
  locationOptionText: {
    flex: 1,
    marginRight: 8,
  },
  
  locationOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  
  locationOptionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  
  imagePickerSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
  },
  mapPickerButtonDisabled: {
  opacity: 0.7,
  backgroundColor: '#f5f5f5',
},
loadingSpinner: {
  marginLeft: 'auto',
},
});
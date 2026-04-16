export type ScannerError = 
  | 'CAMERA_PERMISSION_DENIED'
  | 'LOCATION_PERMISSION_DENIED'
  | 'LOCATION_UNAVAILABLE'
  | 'NETWORK_ERROR'
  | 'QR_PARSE_ERROR'
  | 'STUDENT_DATA_MISSING'
  | 'VALIDATION_ERROR';

export interface ErrorHandlingConfig {
  showAlert?: boolean;
  allowRetry?: boolean;
  logToConsole?: boolean;
}

export interface ErrorMessage {
  title: string;
  message: string;
}

export class ErrorService {
  static getErrorMessage(error: ScannerError, customMessage?: string): ErrorMessage {
    const errorMessages: Record<ScannerError, ErrorMessage> = {
      CAMERA_PERMISSION_DENIED: {
        title: 'Camera Access Required',
        message: 'Camera permission is needed to scan QR codes. Please enable it in your device settings.'
      },
      LOCATION_PERMISSION_DENIED: {
        title: 'Location Access Required',
        message: 'Location permission is needed for event verification. Some events may require location check.'
      },
      LOCATION_UNAVAILABLE: {
        title: 'Location Unavailable',
        message: 'Unable to access your location. Please check your location settings and try again.'
      },
      NETWORK_ERROR: {
        title: 'Connection Error',
        message: 'Please check your internet connection and try again.'
      },
      QR_PARSE_ERROR: {
        title: 'Invalid QR Code',
        message: 'This QR code cannot be read. Please try scanning again or ask for a new code.'
      },
      STUDENT_DATA_MISSING: {
        title: 'Profile Incomplete',
        message: 'Student information not found. Please make sure you are properly logged in.'
      },
      VALIDATION_ERROR: {
        title: 'Validation Error',
        message: 'There was an error validating the QR code. Please try again.'
      }
    };

    const defaultError = errorMessages[error] || {
      title: 'Error',
      message: 'An unexpected error occurred. Please try again.'
    };

    return {
      title: defaultError.title,
      message: customMessage || defaultError.message
    };
  }

  static handleError(error: ScannerError, config: ErrorHandlingConfig = {}, customMessage?: string): ErrorMessage {
    const { logToConsole = true } = config;
    
    if (logToConsole) {
      console.error(`Scanner Error [${error}]:`, customMessage);
    }

    return this.getErrorMessage(error, customMessage);
  }

  static logScanAttempt(result: any, studentId?: string) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      studentId,
      eventId: result.event?.id,
      success: result.valid,
      error: result.error,
      locationVerified: result.locationVerified,
      distance: result.distance
    };
    
    console.log('Scan Attempt:', logEntry);
  }
}
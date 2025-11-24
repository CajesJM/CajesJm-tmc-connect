import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface EventLocation {
  latitude: number;
  longitude: number;
  radius: number; 
  address?: string;
}

export interface LocationResult {
  success: boolean;
  location?: UserLocation;
  error?: string;
}

class LocationService {
  async requestLocationPermission(): Promise<boolean> {
    try {
      // Check if permission is already granted
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      
      if (existingStatus === 'granted') {
        return true;
      }

      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        this.showLocationPermissionAlert();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  private showLocationPermissionAlert(): void {
    Alert.alert(
      'Location Permission Required',
      'Location access is required to verify your attendance at the event venue. Please enable location permissions in your device settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Settings', 
          onPress: this.openAppSettings.bind(this)
        }
      ]
    );
  }

  private openAppSettings(): void {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  }

  async getCurrentLocation(): Promise<LocationResult> {
    try {
      // Check if location services are enabled
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        return {
          success: false,
          error: 'Location services are disabled. Please enable them in your device settings.'
        };
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        // Only use supported options
      });

      const userLocation: UserLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        timestamp: location.timestamp,
      };

      return {
        success: true,
        location: userLocation
      };
    } catch (error: any) {
      console.error('Error getting location:', error);
      
      let errorMessage = 'Unable to get your current location. Please try again.';
      
      if (error.code === 'PERMISSION_DENIED') {
        errorMessage = 'Location permission denied. Please enable location access in settings.';
      } else if (error.code === 'POSITION_UNAVAILABLE') {
        errorMessage = 'Location unavailable. Please check your connection and try again.';
      } else if (error.code === 'TIMEOUT') {
        errorMessage = 'Location request timed out. Please try again.';
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    if (!lat1 || !lon1 || !lat2 || !lon2) {
      console.warn('Invalid coordinates provided for distance calculation');
      return 0;
    }
    
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c;
    return distance * 1000; // Convert to meters
  }

  isLocationAccurate(location: UserLocation, requiredAccuracy: number = 50): boolean {
    return location.accuracy <= requiredAccuracy;
  }

  isWithinEventRadius(userLocation: UserLocation, eventLocation: EventLocation): { within: boolean; distance: number } {
    const distance = this.calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      eventLocation.latitude,
      eventLocation.longitude
    );

    return {
      within: distance <= eventLocation.radius,
      distance: distance
    };
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}

export const locationService = new LocationService();
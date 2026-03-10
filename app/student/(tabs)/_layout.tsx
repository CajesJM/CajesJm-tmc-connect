import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function StudentTabsLayout() {
  const router = useRouter();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={({ route }) => ({
          tabBarActiveTintColor: '#0ea5e9',
          tabBarInactiveTintColor: '#94a3b8',
          tabBarStyle: {
            position: 'absolute',
            bottom: 16,
            left: 16,
            right: 16,
            height: 80,
            backgroundColor: '#ffffff',
            borderRadius: 24,
            borderWidth: 0,
            shadowColor: '#0ea5e9',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 24,
            elevation: 10,
            paddingHorizontal: 8,
            paddingTop: 12,
            paddingBottom: 12,
          },
          headerShown: false,
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 4,
          },
        })}
      >
        {/* Dashboard Tab */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Animated.View 
                style={[
                  styles.iconContainer, 
                  focused && styles.activeIconContainer,
                  { transform: [{ scale: focused ? 1.1 : 1 }] }
                ]}
              >
                <Ionicons
                  name={focused ? 'home' : 'home-outline'}
                  size={22}
                  color={focused ? '#0ea5e9' : color}
                />
                {focused && <View style={styles.activeIndicator} />}
              </Animated.View>
            ),
          }}
        />

        {/* Announcements Tab */}
        <Tabs.Screen
          name="announcements"
          options={{
            title: 'News',
            tabBarIcon: ({ color, focused }) => (
              <Animated.View 
                style={[
                  styles.iconContainer, 
                  focused && styles.activeIconContainer,
                  { transform: [{ scale: focused ? 1.1 : 1 }] }
                ]}
              >
                <Ionicons
                  name={focused ? 'notifications' : 'notifications-outline'}
                  size={22}
                  color={focused ? '#0ea5e9' : color}
                />
                {focused && <View style={styles.activeIndicator} />}
              </Animated.View>
            ),
          }}
        />

        {/* QR Scanner – Center Floating Button */}
        <Tabs.Screen
          name="attendance"
          options={{
            title: '',
            tabBarIcon: () => null,
            tabBarLabel: () => null,
            tabBarButton: (props) => {
              const { onPress, accessibilityState } = props;
              const isSelected = accessibilityState?.selected;

              return (
                <View style={styles.qrButtonContainer}>
                  <TouchableOpacity
                    onPress={onPress}
                    activeOpacity={0.8}
                    style={styles.qrButtonWrapper}
                  >
                    <Animated.View 
                      style={[
                        styles.qrButtonOuter,
                        { transform: [{ scale: pulseAnim }] }
                      ]}
                    >
                      <LinearGradient
                        colors={isSelected ? ['#0ea5e9', '#0284c7'] : ['#3b82f6', '#2563eb']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.qrButtonGradient}
                      >
                        <Animated.View style={{ transform: [{ rotate }] }}>
                          <Ionicons name="scan-outline" size={28} color="#ffffff" />
                        </Animated.View>
                      </LinearGradient>
                    </Animated.View>
                    
                    {/* Glow effect */}
                    <View style={styles.qrButtonGlow} />
                  </TouchableOpacity>
                  
                  <Text style={styles.qrButtonLabel}>Scan</Text>
                </View>
              );
            },
          }}
        />

        {/* Events Tab */}
        <Tabs.Screen
          name="events"
          options={{
            title: 'Events',
            tabBarIcon: ({ color, focused }) => (
              <Animated.View 
                style={[
                  styles.iconContainer, 
                  focused && styles.activeIconContainer,
                  { transform: [{ scale: focused ? 1.1 : 1 }] }
                ]}
              >
                <Ionicons
                  name={focused ? 'calendar' : 'calendar-outline'}
                  size={22}
                  color={focused ? '#0ea5e9' : color}
                />
                {focused && <View style={styles.activeIndicator} />}
              </Animated.View>
            ),
          }}
        />

        {/* Profile Tab */}
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <Animated.View 
                style={[
                  styles.iconContainer, 
                  focused && styles.activeIconContainer,
                  { transform: [{ scale: focused ? 1.1 : 1 }] }
                ]}
              >
                <Ionicons
                  name={focused ? 'person' : 'person-outline'}
                  size={22}
                  color={focused ? '#0ea5e9' : color}
                />
                {focused && <View style={styles.activeIndicator} />}
              </Animated.View>
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    position: 'relative',
  },
  activeIconContainer: {
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0ea5e9',
  },

  // QR Button Styles
  qrButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
  },
  qrButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrButtonOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 4,
    backgroundColor: '#ffffff',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  qrButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  qrButtonGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    zIndex: -1,
  },
  qrButtonLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0ea5e9',
    marginTop: 4,
  },
});
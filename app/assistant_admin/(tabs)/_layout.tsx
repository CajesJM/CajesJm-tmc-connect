import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';

const { width } = Dimensions.get('window');

const TabIcon = ({
  name,
  focused,
  colors,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  colors: any;
}) => {
  const iconName = focused ? name : `${name}-outline`;
  const validIconName = iconName as keyof typeof Ionicons.glyphMap; 

  return (
    <Animated.View
      style={[
        styles.iconContainer,
        focused && [styles.activeIconContainer, { backgroundColor: `${colors.accent.primary}15` }],
        { transform: [{ scale: focused ? 1.1 : 1 }] },
      ]}
    >
      <Ionicons
        name={validIconName} 
        size={22}
        color={focused ? colors.accent.primary : colors.sidebar.text.secondary}
      />
      {focused && <View style={[styles.activeIndicator, { backgroundColor: colors.accent.primary }]} />}
    </Animated.View>
  );
};

export default function AdminTabsLayout() {
  const { colors, isDark } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const qrScaleAnim = useRef(new Animated.Value(1)).current;

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

  useEffect(() => {
    const rotate = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );
    rotate.start();
    return () => rotate.stop();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleQrPressIn = () => {
    Animated.spring(qrScaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handleQrPressOut = () => {
    Animated.spring(qrScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const tabBarStyle = useMemo<ViewStyle>(
    () => ({
      position: 'absolute',
      bottom: 16,
      left: 16,
      right: 16,
      height: 80,
      backgroundColor: colors.card,
      borderRadius: 24,
      borderWidth: 0,
      shadowColor: colors.accent.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.2 : 0.15,
      shadowRadius: 24,
      elevation: 10,
      paddingHorizontal: 8,
      paddingTop: 12,
      paddingBottom: 12,
    }),
    [colors.card, colors.accent.primary, isDark]
  );

  // Gradient colors for the QR button
  const qrGradientColors = useMemo(
    () => [colors.accent.primary, '#0284c7'] as const,
    [colors.accent.primary]
  );

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.accent.primary,
          tabBarInactiveTintColor: colors.sidebar.text.secondary,
          tabBarStyle: tabBarStyle,
          headerShown: false,
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 4,
          },
        }}
      >
        {/* Dashboard Tab */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ focused }) => (
              <TabIcon name="home" focused={focused} colors={colors} />
            ),
          }}
        />

        {/* Announcements Tab */}
        <Tabs.Screen
          name="announcements"
          options={{
            title: 'Announcements',
            tabBarIcon: ({ focused }) => (
              <TabIcon name="megaphone" focused={focused} colors={colors} />
            ),
          }}
        />

        {/* QR Code Generation – Center Floating Button */}
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
                    onPressIn={handleQrPressIn}
                    onPressOut={handleQrPressOut}
                    activeOpacity={0.8}
                    style={styles.qrButtonWrapper}
                  >
                    <Animated.View
                      style={[
                        styles.qrButtonOuter,
                        {
                          transform: [{ scale: Animated.multiply(pulseAnim, qrScaleAnim) }],
                          backgroundColor: colors.card,
                          shadowColor: colors.accent.primary,
                        },
                      ]}
                    >
                      <LinearGradient
                        colors={qrGradientColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.qrButtonGradient}
                      >
                        <Animated.View style={{ transform: [{ rotate }] }}>
                          <Ionicons name="qr-code-outline" size={28} color="#ffffff" />
                        </Animated.View>
                      </LinearGradient>
                    </Animated.View>
                    <View
                      style={[
                        styles.qrButtonGlow,
                        { backgroundColor: `${colors.accent.primary}30` },
                      ]}
                    />
                  </TouchableOpacity>
                  <Text style={[styles.qrButtonLabel, { color: colors.accent.primary }]}>
                    Generate
                  </Text>
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
            tabBarIcon: ({ focused }) => (
              <TabIcon name="calendar" focused={focused} colors={colors} />
            ),
          }}
        />

        {/* Profile Tab */}
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused }) => (
              <TabIcon name="person" focused={focused} colors={colors} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

// Styles – reused from student tabs
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
    // background applied inline
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
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
    zIndex: -1,
  },
  qrButtonLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
});
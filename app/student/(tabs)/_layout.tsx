import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View, ViewStyle
} from 'react-native';
import { NotificationProvider, useNotifications } from '../../../context/NotificationContext';
import { useTheme } from '../../../context/ThemeContext';

const { width } = Dimensions.get('window');

// Tab icon component with badge – now uses theme colors
const TabIconWithBadge = ({
  name,
  focused,
  badgeCount,
  colors,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  badgeCount?: number;
  colors: any; // ThemeColors
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
      {badgeCount !== undefined && badgeCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
        </View>
      )}
    </Animated.View>
  );
};

// Inner component that uses the notification context and theme
function TabsContent() {
  const router = useRouter();
  const { unreadCounts } = useNotifications();
  const { colors, isDark } = useTheme();

  // Animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const qrScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for QR button (always running)
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

  // Rotate animation for QR icon (optional – runs on each press? could be triggered on press)
  // For now, we just keep it as a static animation (continuous)
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

  // Press animation for QR button
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

  // QR button gradient colors (active / inactive)
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
        {/* Home Tab */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused }) => (
              <TabIconWithBadge
                name="home"
                focused={focused}
                badgeCount={unreadCounts.home}
                colors={colors}
              />
            ),
          }}
        />

        {/* Announcements Tab */}
        <Tabs.Screen
          name="announcements"
          options={{
            title: 'News',
            tabBarIcon: ({ focused }) => (
              <TabIconWithBadge
                name="notifications"
                focused={focused}
                badgeCount={unreadCounts.announcements}
                colors={colors}
              />
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
                          <Ionicons name="scan-outline" size={28} color="#ffffff" />
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
                    Scan
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
              <TabIconWithBadge
                name="calendar"
                focused={focused}
                badgeCount={unreadCounts.events}
                colors={colors}
              />
            ),
          }}
        />

        {/* Profile Tab */}
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused }) => (
              <TabIconWithBadge
                name="person"
                focused={focused}
                badgeCount={unreadCounts.profile}
                colors={colors}
              />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

// Main layout – wraps everything with the NotificationProvider and ThemeProvider
export default function StudentTabsLayout() {
  return (
    <NotificationProvider>
      <TabsContent />
    </NotificationProvider>
  );
}

// Styles – keep mostly static, but we now use theme for dynamic parts
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
    // background color is applied inline with theme
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444', // keep red for badge
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
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
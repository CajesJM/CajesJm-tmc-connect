import { Ionicons } from '@expo/vector-icons';
import { Href, router, Tabs, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { collection, onSnapshot, query } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import LoadingScreen from '../../components/LoadingScreen';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { db } from '../../lib/firebaseConfig';

interface MenuItem {
  name: string;
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  route: Href;
}

interface UserStats {
  total: number;
  newThisWeek: number;
  mainAdmins: number;
  assistantAdmins: number;
  students: number;
}

const menuItems: MenuItem[] = [
  { name: 'index', title: 'Dashboard', icon: 'home', route: '/main_admin' },
  { name: 'announcements', title: 'Announcements', icon: 'megaphone', route: '/main_admin/announcements' },
  { name: 'events', title: 'Events', icon: 'calendar', route: '/main_admin/events' },
  { name: 'attendance', title: 'Attendance', icon: 'calendar', route: '/main_admin/attendance' },
  { name: 'users', title: 'Users', icon: 'people', route: '/main_admin/users' },
  { name: 'profile', title: 'Profile', icon: 'person', route: '/main_admin/profile' },
];

export default function MainAdminLayout() {
  const pathname = usePathname();
  const isWeb = Platform.OS === 'web';
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({
    total: 0,
    newThisWeek: 0,
    mainAdmins: 0,
    assistantAdmins: 0,
    students: 0
  });
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  
  // Animated values
  const sidebarAnim = useRef(new Animated.Value(260)).current;   // full width
  const contentOpacity = useRef(new Animated.Value(1)).current;  // for text fading
  const mobileSlideAnim = useRef(new Animated.Value(-300)).current;
  const mobileOverlayAnim = useRef(new Animated.Value(0)).current;
  
  const { userData } = useAuth();
  const { colors, isDark } = useTheme();

  const fullWidth = 260;
  const collapsedWidth = 80;
  const sidebarWidth = collapsed ? collapsedWidth : fullWidth;

  // Animate sidebar width and content opacity when collapse state changes
  useEffect(() => {
    Animated.parallel([
      Animated.timing(sidebarAnim, {
        toValue: collapsed ? collapsedWidth : fullWidth,
        duration: 300,
        useNativeDriver: false, // width must use native driver false
      }),
      Animated.timing(contentOpacity, {
        toValue: collapsed ? 0 : 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  }, [collapsed]);

  // Mobile menu animations with spring
  useEffect(() => {
    Animated.parallel([
      Animated.spring(mobileSlideAnim, {
        toValue: mobileMenuOpen ? 0 : -300,
        useNativeDriver: true,
        speed: 12,
        bounciness: 8,
      }),
      Animated.timing(mobileOverlayAnim, {
        toValue: mobileMenuOpen ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  }, [mobileMenuOpen]);

  // Entrance animation for nav items (sequential fade-in)
  useEffect(() => {
    const timer = setTimeout(() => setIsLayoutReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Real-time user stats (unchanged)
  useEffect(() => {
    const usersQuery = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      let mainAdmins = 0, assistantAdmins = 0, students = 0, newThisWeek = 0;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const role = data.role;
        if (role === 'main_admin') mainAdmins++;
        else if (role === 'assistant_admin') assistantAdmins++;
        else if (role === 'student') students++;

        const createdAt = data.createdAt?.toDate?.() || data.createdAt;
        if (createdAt && createdAt >= oneWeekAgo) newThisWeek++;
      });

      setUserStats({ total: snapshot.size, newThisWeek, mainAdmins, assistantAdmins, students });
    });
    return () => unsubscribe();
  }, []);

  const isRouteActive = (route: Href) => {
    const routeString = route.toString();
    if (routeString === '/main_admin') {
      return pathname === '/main_admin' || pathname === '/main_admin/';
    }
    return pathname.includes(routeString.replace('/main_admin/', ''));
  };

  const handleNavigation = (route: Href) => {
    router.push(route);
    if (!isWeb) setMobileMenuOpen(false);
  };

  // Swipe to close on mobile
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return mobileMenuOpen && gestureState.dx > 20;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0) {
          mobileSlideAnim.setValue(-300 + gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 100) {
          setMobileMenuOpen(false);
        } else {
          Animated.spring(mobileSlideAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Sidebar component with premium animations
  const Sidebar = ({ isMobile }: { isMobile?: boolean }) => {
    const animatedWidth = isMobile ? 280 : sidebarAnim;
    
    return (
      <Animated.View 
        style={[
          styles.sidebarContainer,
          { 
            backgroundColor: colors.sidebar.background,
            width: animatedWidth,
            // Glassmorphism effect on web – use type assertion for web‑only styles
            ...(isWeb && !isMobile && {
              backgroundColor: isDark 
                ? 'rgba(15, 25, 35, 0.85)' 
                : 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(20px)',
            } as any),
          },
          isMobile && { width: 280 }
        ]}
      >
        <View style={styles.sidebarContent}>
          {/* Collapse button with rotation animation */}
          {isWeb && !isMobile && (
            <TouchableOpacity 
              onPress={() => setCollapsed(!collapsed)} 
              style={[styles.collapseButton, collapsed && styles.collapseButtonCollapsed]}
              activeOpacity={0.8}
            >
              <Animated.View style={{
                transform: [{
                  rotate: sidebarAnim.interpolate({
                    inputRange: [collapsedWidth, fullWidth],
                    outputRange: ['180deg', '0deg'],
                  })
                }]
              }}>
                <Ionicons 
                  name="chevron-back" 
                  size={18} 
                  color={colors.sidebar.text.muted} 
                />
              </Animated.View>
            </TouchableOpacity>
          )}

          {/* Logo Section */}
          <Animated.View style={[
            styles.logoSection,
            collapsed && styles.logoSectionCollapsed,
            { opacity: contentOpacity }
          ]}>
            <View style={styles.logoWrapper}>
              <View style={[styles.logoBackground, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F1F5F9' }]}>
                <Image
                  source={require('../../assets/images/Logo/V_1.0.1.png')}
                  style={[styles.logoImage, collapsed ? { width: 30, height: 30 } : { width: 40, height: 40 }]}
                  resizeMode="contain"
                />
              </View>
            </View>
            {!collapsed && (
              <View style={styles.adminInfo}>
                <Text style={[styles.adminTitle, { color: colors.sidebar.text.primary }]}>Admin Panel</Text>
                <Text style={[styles.adminSubtitle, { color: colors.sidebar.text.secondary }]}>TMC Campus Hub</Text>
                <View style={styles.statusContainer}>
                  <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                  <Text style={[styles.statusText, { color: '#10B981' }]}>
                    {userData?.role === 'main_admin' ? 'Main Admin' : 'Assistant Admin'}
                  </Text>
                </View>
              </View>
            )}
          </Animated.View>

          {/* Quick Stats with animation */}
          {isWeb && !collapsed && (
            <Animated.View 
              style={[
                styles.quickStats, 
                { 
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  opacity: contentOpacity,
                  transform: [{
                    scale: contentOpacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    })
                  }]
                }
              ]}
            >
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.sidebar.text.primary }]}>{userStats.newThisWeek}</Text>
                <Text style={[styles.statLabel, { color: colors.sidebar.text.secondary }]}>New this week</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.sidebar.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.sidebar.text.primary }]}>{userStats.total}</Text>
                <Text style={[styles.statLabel, { color: colors.sidebar.text.secondary }]}>Total users</Text>
              </View>
            </Animated.View>
          )}

          {/* Role Breakdown with animation */}
          {isWeb && !collapsed && userStats.total > 0 && (
            <Animated.View style={[
              styles.roleBreakdown,
              { 
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                opacity: contentOpacity,
              }
            ]}>
              <View style={styles.roleItem}>
                <View style={[styles.roleDot, { backgroundColor: '#3B82F6' }]} />
                <Text style={[styles.roleText, { color: colors.sidebar.text.secondary }]}>Main Admin: {userStats.mainAdmins}</Text>
              </View>
              <View style={styles.roleItem}>
                <View style={[styles.roleDot, { backgroundColor: '#10B981' }]} />
                <Text style={[styles.roleText, { color: colors.sidebar.text.secondary }]}>Asst. Admin: {userStats.assistantAdmins}</Text>
              </View>
              <View style={styles.roleItem}>
                <View style={[styles.roleDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={[styles.roleText, { color: colors.sidebar.text.secondary }]}>Students: {userStats.students}</Text>
              </View>
            </Animated.View>
          )}

          {/* Navigation Items with hover & active effects */}
          <View style={styles.navItems}>
            {menuItems.map((item, index) => {
              const isActive = isRouteActive(item.route);
              return (
                <TouchableOpacity
                  key={item.name}
                  style={[
                    styles.navItem,
                    collapsed && styles.navItemCollapsed,
                    isActive && [styles.activeNavItem, { 
                      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                      borderLeftColor: colors.accent.primary,
                    }]
                  ]}
                  onPress={() => handleNavigation(item.route)}
                  activeOpacity={0.7}
                  {...(isWeb ? {
                    onMouseEnter: (e: any) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
                    },
                    onMouseLeave: (e: any) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.backgroundColor = isActive 
                        ? (isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)')
                        : 'transparent';
                    }
                  } : {})}
                >
                  <Animated.View style={[
                    styles.navIconWrapper,
                    collapsed && styles.navIconWrapperCollapsed,
                    {
                      transform: [{
                        scale: isActive ? 1.1 : 1
                      }]
                    }
                  ]}>
                    <Ionicons
                      name={item.icon}
                      size={collapsed ? 24 : 20}
                      color={isActive ? colors.accent.primary : colors.sidebar.icon.inactive}
                    />
                  </Animated.View>
                  {!collapsed && (
                    <Animated.Text style={[
                      styles.navText,
                      { color: isActive ? colors.accent.primary : colors.sidebar.text.secondary },
                      { opacity: contentOpacity }
                    ]}>
                      {item.title}
                    </Animated.Text>
                  )}
                  {isActive && !collapsed && (
                    <View style={[styles.activeIndicator, { backgroundColor: colors.accent.primary }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Bottom Section */}
          <Animated.View style={[
            styles.sidebarFooter, 
            { borderTopColor: colors.sidebar.border, opacity: contentOpacity }
          ]}>
            <TouchableOpacity
              style={[styles.navItem, collapsed && styles.navItemCollapsed]}
              onPress={() => router.push('/main_admin/settings' as Href)}
            >
              <View style={[styles.navIconWrapper, collapsed && styles.navIconWrapperCollapsed]}>
                <Ionicons name="settings-outline" size={collapsed ? 24 : 20} color={colors.sidebar.icon.inactive} />
              </View>
              {!collapsed && <Text style={[styles.navText, { color: colors.sidebar.text.secondary }]}>Settings</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navItem, styles.logoutButton, collapsed && styles.navItemCollapsed]}
              onPress={() => router.replace('/super-admin-login' as Href)}
            >
              <View style={[styles.navIconWrapper, collapsed && styles.navIconWrapperCollapsed]}>
                <Ionicons name="log-out-outline" size={collapsed ? 24 : 20} color="#EF4444" />
              </View>
              {!collapsed && <Text style={[styles.navText, styles.logoutText]}>Logout</Text>}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
    );
  };

  if (!isLayoutReady) {
    return <LoadingScreen message="Loading Dashboard" subMessage="Preparing your admin workspace" />;
  }

  // Animated margin for main content on web
  const mainMarginLeft = sidebarAnim.interpolate({
    inputRange: [collapsedWidth, fullWidth],
    outputRange: [collapsedWidth, fullWidth],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.statusBar} />
      
      {/* Mobile Header */}
      {!isWeb && (
        <View style={[styles.mobileHeader, { backgroundColor: colors.header.background, borderBottomColor: colors.header.border }]}>
          <TouchableOpacity onPress={() => setMobileMenuOpen(!mobileMenuOpen)} style={styles.hamburgerButton}>
            <Ionicons name={mobileMenuOpen ? "close" : "menu"} size={28} color={colors.header.text} />
          </TouchableOpacity>
          <View style={styles.mobileLogoContainer}>
            <Image source={require('../../assets/images/Logo/V_1.0.1.png')} style={styles.mobileLogo} resizeMode="contain" />
          </View>
          <View style={styles.mobileHeaderRight} />
        </View>
      )}

      {/* Mobile Overlay with fade */}
      {!isWeb && mobileMenuOpen && (
        <Animated.View 
          style={[styles.overlay, { opacity: mobileOverlayAnim }]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity 
            style={styles.overlayTouch}
            activeOpacity={1} 
            onPress={() => setMobileMenuOpen(false)} 
          />
        </Animated.View>
      )}

      {/* Mobile Sidebar */}
      {!isWeb && (
        <Animated.View 
          style={[
            styles.mobileSidebarContainer, 
            { transform: [{ translateX: mobileSlideAnim }] }
          ]}
        >
          <Sidebar isMobile={true} />
        </Animated.View>
      )}

      {/* Main Layout with animated margin */}
      <Animated.View style={[styles.mainContent, isWeb && { marginLeft: mainMarginLeft }]}>
        {isWeb && <Sidebar />}
        
        <View style={styles.tabsContainer}>
          <Tabs
            initialRouteName='index'
            screenOptions={{
              headerShown: false,
              headerStyle: { backgroundColor: colors.header.background },
              headerTitleStyle: { color: colors.header.text, fontSize: 20, fontWeight: '600' },
              headerTintColor: colors.header.text,
              headerShadowVisible: false,
              tabBarStyle: !isWeb ? {
                backgroundColor: colors.card,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                paddingBottom: 8,
                paddingTop: 8,
                height: 65,
              } : { display: 'none' },
              tabBarActiveTintColor: colors.accent.primary,
              tabBarInactiveTintColor: isDark ? '#94A3B8' : '#64748B',
            }}
          >
            <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} /> }} />
            <Tabs.Screen name="announcements" options={{ title: 'Announcements', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "megaphone" : "megaphone-outline"} size={24} color={color} /> }} />
            <Tabs.Screen name="attendance" options={{ title: 'Attendance', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "calendar" : "calendar-outline"} size={24} color={color} /> }} />
            <Tabs.Screen name="events" options={{ title: 'Events', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "calendar" : "calendar-outline"} size={24} color={color} /> }} />
            <Tabs.Screen name="users" options={{ title: 'Users', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "people" : "people-outline"} size={24} color={color} /> }} />
            <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} /> }} />
          </Tabs>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mainContent: { flex: 1, flexDirection: 'row' },
  tabsContainer: { flex: 1 },
  sidebarContainer: { 
    height: '100%', 
    position: 'fixed', 
    left: 0, 
    top: 0, 
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  sidebarContent: { flex: 1, paddingVertical: 20 },
  collapseButton: { 
    alignSelf: 'flex-end', 
    padding: 8, 
    borderRadius: 8, 
    marginRight: 16, 
    marginBottom: 16, 
    width: 34, 
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  collapseButtonCollapsed: {
    alignSelf: 'center',
    marginRight: 0,
  },
  logoSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 20 },
  logoSectionCollapsed: { justifyContent: 'center', paddingHorizontal: 8 },
  logoWrapper: { marginRight: 12 },
  logoBackground: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  logoImage: { width: 50, height: 50, borderRadius: 25 },
  adminInfo: { flex: 1 },
  adminTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  adminSubtitle: { fontSize: 12, marginBottom: 8 },
  statusContainer: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 11, fontWeight: '500' },
  quickStats: { flexDirection: 'row', borderRadius: 12, padding: 12, marginHorizontal: 16, marginBottom: 12 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, marginHorizontal: 8 },
  roleBreakdown: { borderRadius: 8, padding: 10, marginHorizontal: 16, marginBottom: 16 },
  roleItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 3 },
  roleDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  roleText: { fontSize: 11 },
  navItems: { flex: 1, paddingHorizontal: 8 },
  navItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    marginVertical: 2, 
    borderRadius: 12,
    position: 'relative',
  },
  navItemCollapsed: { justifyContent: 'center', paddingHorizontal: 0 },
  activeNavItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  activeIndicator: {
    position: 'absolute',
    right: 0,
    top: '25%',
    width: 3,
    height: '50%',
    borderRadius: 2,
  },
  navIconWrapper: { width: 32, alignItems: 'center', justifyContent: 'center' },
  navIconWrapperCollapsed: { width: 'auto' },
  navText: { marginLeft: 12, fontSize: 15, fontWeight: '500' },
  sidebarFooter: { paddingHorizontal: 8, paddingBottom: 20, borderTopWidth: 1, marginTop: 20, paddingTop: 20 },
  logoutButton: { marginTop: 5 },
  logoutText: { color: '#EF4444' },
  mobileHeader: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    height: 60, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    zIndex: 1000, 
    elevation: 5,
    borderBottomWidth: 1,
  },
  hamburgerButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  mobileLogoContainer: { flex: 1, alignItems: 'center' },
  mobileLogo: { width: 40, height: 40 },
  mobileHeaderRight: { width: 40 },
  overlay: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    zIndex: 1001 
  },
  overlayTouch: {
    flex: 1,
  },
  mobileSidebarContainer: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    bottom: 0, 
    width: 280, 
    zIndex: 1002, 
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
});
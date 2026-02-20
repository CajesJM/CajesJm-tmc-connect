import { Ionicons } from '@expo/vector-icons';
import { Href, router, Tabs, usePathname } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface MenuItem {
  name: string;
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  route: Href; 
}

const menuItems: MenuItem[] = [
  { name: 'index', title: 'Dashboard', icon: 'home', route: '/main_admin' },
  { name: 'announcements', title: 'Announcements', icon: 'megaphone', route: '/main_admin/announcements' },
  { name: 'attendance', title: 'Attendance', icon: 'calendar', route: '/main_admin/attendance' },
  { name: 'events', title: 'Events', icon: 'calendar', route: '/main_admin/events' },
  { name: 'users', title: 'Users', icon: 'people', route: '/main_admin/users' },
  { name: 'profile', title: 'Profile', icon: 'person', route: '/main_admin/profile' },
];

export default function MainAdminLayout() {
  const pathname = usePathname();
  const isWeb = Platform.OS === 'web';
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-300)).current;

  const sidebarWidth = collapsed ? 80 : 260;

  // Enhanced color palette
  const colors = {
    sidebar: {
      background: '#0A0F1E',
      border: '#1E2A45',
      text: {
        primary: '#FFFFFF',
        secondary: '#8B98B5',
        muted: '#5A6B8C',
      },
      icon: {
        active: '#FFFFFF',
        inactive: '#5A6B8C',
      },
    },
    accent: {
      primary: '#3B82F6',
      hover: '#2563EB',
    },
    header: {
      background: '#FFFFFF',
      text: '#0A0F1E',
      border: '#EFF2F6',
    }
  };

  // Animate mobile menu
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: mobileMenuOpen ? 0 : -300,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [mobileMenuOpen]);

  const isRouteActive = (route: Href) => {
    const routeString = route.toString();
    if (routeString === '/main_admin') {
      return pathname === '/main_admin' || pathname === '/main_admin/';
    }
    return pathname.includes(routeString.replace('/main_admin/', ''));
  };

  const handleNavigation = (route: Href) => {
    router.push(route);
    if (!isWeb) {
      setMobileMenuOpen(false);
    }
  };

  // Sidebar Component
  const Sidebar = ({ isMobile }: { isMobile?: boolean }) => (
    <View style={[
      styles.sidebarContainer,
      { backgroundColor: colors.sidebar.background, width: sidebarWidth },
      isMobile && { width: 280 } 
    ]}>
      <View style={styles.sidebarContent}>
        {isWeb && !isMobile && !collapsed && (
          <TouchableOpacity
            onPress={() => setCollapsed(!collapsed)}
            style={styles.collapseButton}
          >
            <Ionicons
              name="chevron-back"
              size={18}
              color={colors.sidebar.text.muted}
            />
          </TouchableOpacity>
        )}
        
        {isWeb && !isMobile && collapsed && (
          <TouchableOpacity
            onPress={() => setCollapsed(!collapsed)}
            style={styles.collapseButtonCentered}
          >
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.sidebar.text.muted}
            />
          </TouchableOpacity>
        )}

        {/* Logo Section */}
        <View style={[
          styles.logoSection,
          collapsed && styles.logoSectionCollapsed
        ]}>
          <View style={styles.logoWrapper}>
            <View style={[styles.logoBackground, collapsed && { marginRight: 0 }]}>
              <Ionicons 
                name="school" 
                size={collapsed ? 24 : 28} 
                color="#FFFFFF" 
              />
            </View>
          </View>

          {!collapsed && (
            <View style={styles.adminInfo}>
              <Text style={styles.adminTitle}>Admin Panel</Text>
              <Text style={styles.adminSubtitle}>TMC Campus Hub</Text>
              <View style={styles.statusContainer}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Online</Text>
              </View>
            </View>
          )}
        </View>

        {isWeb && !collapsed && (
          <View style={styles.quickStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>New</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>284</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        )}

        {/* Navigation Items */}
        <View style={styles.navItems}>
          {menuItems.map((item) => {
            const isActive = isRouteActive(item.route);
            
            return (
              <TouchableOpacity
                key={item.name}
                style={[
                  styles.navItem,
                  collapsed && styles.navItemCollapsed,
                  isActive && styles.activeNavItem
                ]}
                onPress={() => handleNavigation(item.route)}
              >
                <View style={[
                  styles.navIconWrapper,
                  collapsed && styles.navIconWrapperCollapsed
                ]}>
                  <Ionicons 
                    name={item.icon} 
                    size={collapsed ? 24 : 20} 
                    color={isActive ? colors.accent.primary : colors.sidebar.icon.inactive}
                  />
                </View>
                {!collapsed && (
                  <Text style={[
                    styles.navText,
                    isActive && styles.activeNavText
                  ]}>
                    {item.title}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bottom Section */}
        <View style={styles.sidebarFooter}>
          <TouchableOpacity
            style={[
              styles.navItem,
              collapsed && styles.navItemCollapsed
            ]}
            onPress={() => router.push('/main_admin/settings' as Href)}
          >
            <View style={[
              styles.navIconWrapper,
              collapsed && styles.navIconWrapperCollapsed
            ]}>
              <Ionicons 
                name="settings-outline" 
                size={collapsed ? 24 : 20} 
                color={colors.sidebar.icon.inactive} 
              />
            </View>
            {!collapsed && <Text style={styles.navText}>Settings</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navItem,
              styles.logoutButton,
              collapsed && styles.navItemCollapsed
            ]}
            onPress={() => router.replace('/login' as Href)}
          >
            <View style={[
              styles.navIconWrapper,
              collapsed && styles.navIconWrapperCollapsed
            ]}>
              <Ionicons 
                name="log-out-outline" 
                size={collapsed ? 24 : 20} 
                color="#EF4444" 
              />
            </View>
            {!collapsed && <Text style={[styles.navText, styles.logoutText]}>Logout</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Mobile Header */}
      {!isWeb && (
        <View style={styles.mobileHeader}>
          <TouchableOpacity
            onPress={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={styles.hamburgerButton}
          >
            <Ionicons 
              name={mobileMenuOpen ? "close" : "menu"} 
              size={28} 
              color="#0A0F1E" 
            />
          </TouchableOpacity>
          <Text style={styles.mobileHeaderTitle}>Admin Panel</Text>
          <View style={styles.mobileHeaderRight} />
        </View>
      )}

      {/* Mobile Sidebar Overlay */}
      {!isWeb && mobileMenuOpen && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      {!isWeb && (
        <Animated.View
          style={[
            styles.mobileSidebarContainer,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <Sidebar isMobile={true} />
        </Animated.View>
      )}

      {/* Main Layout */}
      <View style={[
        styles.mainContent,
        isWeb && { marginLeft: sidebarWidth },
      ]}>
    
        {isWeb && <Sidebar />}

        <View style={styles.tabsContainer}>
          <Tabs 
            screenOptions={{
              headerShown: false,
              headerStyle: {
                backgroundColor: colors.header.background,
              },
              headerTitleStyle: {
                color: colors.header.text,
                fontSize: 20,
                fontWeight: '600',
              },
              headerTintColor: colors.header.text,
              headerShadowVisible: false,
              tabBarStyle: !isWeb ? {
                backgroundColor: '#FFFFFF',
                borderTopWidth: 1,
                borderTopColor: '#EFF2F6',
                paddingBottom: 8,
                paddingTop: 8,
                height: 65,
              } : {
                display: 'none', 
              },
              tabBarActiveTintColor: colors.accent.primary,
              tabBarInactiveTintColor: '#94A3B8',
            }}
          >
            <Tabs.Screen
              name="index"
              options={{
                title: 'Dashboard',
                tabBarIcon: ({ color, focused }) => (
                  <Ionicons 
                    name={focused ? "home" : "home-outline"} 
                    size={24} 
                    color={color} 
                  />
                ),
              }}
            />
            <Tabs.Screen
              name="announcements"
              options={{
                title: 'Announcements',
                tabBarIcon: ({ color, focused }) => (
                  <Ionicons 
                    name={focused ? "megaphone" : "megaphone-outline"} 
                    size={24} 
                    color={color} 
                  />
                ),
              }}
            />
            <Tabs.Screen
              name="attendance"
              options={{
                title: 'Attendance',
                tabBarIcon: ({ color, focused }) => (
                  <Ionicons 
                    name={focused ? "calendar" : "calendar-outline"} 
                    size={24} 
                    color={color} 
                  />
                ),
              }}
            />
            <Tabs.Screen
              name="events"
              options={{
                title: 'Events',
                tabBarIcon: ({ color, focused }) => (
                  <Ionicons 
                    name={focused ? "calendar" : "calendar-outline"} 
                    size={24} 
                    color={color} 
                  />
                ),
              }}
            />
            <Tabs.Screen
              name="users"
              options={{
                title: 'Users',
                tabBarIcon: ({ color, focused }) => (
                  <Ionicons 
                    name={focused ? "people" : "people-outline"} 
                    size={24} 
                    color={color} 
                  />
                ),
              }}
            />
            <Tabs.Screen
              name="profile"
              options={{
                title: 'Profile',
                tabBarIcon: ({ color, focused }) => (
                  <Ionicons 
                    name={focused ? "person" : "person-outline"} 
                    size={24} 
                    color={color} 
                  />
                ),
              }}
            />
          </Tabs>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  tabsContainer: {
    flex: 1,
  },
  // Web Sidebar
  sidebarContainer: {
    height: '100%',
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
  },
  sidebarContent: {
    flex: 1,
    paddingVertical: 20,
  },
  collapseButton: {
    alignSelf: 'flex-end',
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 16,
    marginBottom: 16,
    width: 34,
    alignItems: 'center',
  },
  collapseButtonCentered: {
    alignSelf: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 16,
    width: 34,
    alignItems: 'center',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  logoSectionCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  logoWrapper: {
    marginRight: 12,
  },
  logoBackground: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  adminInfo: {
    flex: 1,
  },
  adminTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  adminSubtitle: {
    color: '#8B98B5',
    fontSize: 12,
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '500',
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: '#8B98B5',
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#1E2A45',
    marginHorizontal: 8,
  },
  navItems: {
    flex: 1,
    paddingHorizontal: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 2,
    borderRadius: 8,
  },
  navItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  activeNavItem: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  navIconWrapper: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconWrapperCollapsed: {
    width: 'auto',
  },
  navText: {
    marginLeft: 12,
    fontSize: 15,
    color: '#8B98B5',
    fontWeight: '500',
  },
  activeNavText: {
    color: '#3B82F6',
  },
  sidebarFooter: {
    paddingHorizontal: 8,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#1E2A45',
    marginTop: 20,
    paddingTop: 20,
  },
  logoutButton: {
    marginTop: 5,
  },
  logoutText: {
    color: '#EF4444',
  },
  // Mobile
  mobileHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFF2F6',
    zIndex: 1000,
    elevation: 5,
  },
  hamburgerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  mobileHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0A0F1E',
  },
  mobileHeaderRight: {
    width: 40,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1001,
  },
  mobileSidebarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    zIndex: 1002,
    elevation: 10,
  },
});
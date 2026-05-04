import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { Href, router, Tabs, usePathname } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { collection, onSnapshot, query } from 'firebase/firestore'
import React, { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Image,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useAuth } from '../../src/Controller/context/AuthContext'
import { useTheme } from '../../src/Controller/context/ThemeContext'
import { db } from '../../src/Model/lib/firebaseConfig'
import LoadingScreen from '../../src/View/components/LoadingScreen'

interface MenuItem {
  name: string
  title: string
  icon: React.ComponentProps<typeof Ionicons>['name']
  activeIcon: React.ComponentProps<typeof Ionicons>['name']
  route: Href
}

interface UserStats {
  total: number
  newThisWeek: number
  mainAdmins: number
  assistantAdmins: number
  students: number
}

const SIDEBAR_FULL_WIDTH = 260
const SIDEBAR_COLLAPSED_WIDTH = 72
const MOBILE_SIDEBAR_WIDTH = 280

const menuItems: MenuItem[] = [
  {
    name: 'index',
    title: 'Dashboard',
    icon: 'home-outline',
    activeIcon: 'home',
    route: '/main_admin',
  },
  {
    name: 'announcements',
    title: 'Announcements',
    icon: 'megaphone-outline',
    activeIcon: 'megaphone',
    route: '/main_admin/announcements',
  },
  {
    name: 'events',
    title: 'Events',
    icon: 'calendar-outline',
    activeIcon: 'calendar',
    route: '/main_admin/events',
  },
  {
    name: 'attendance',
    title: 'Attendance',
    icon: 'checkmark-circle-outline',
    activeIcon: 'checkmark-circle',
    route: '/main_admin/attendance',
  },
  {
    name: 'users',
    title: 'Users',
    icon: 'people-outline',
    activeIcon: 'people',
    route: '/main_admin/users',
  },
  {
    name: 'profile',
    title: 'Profile',
    icon: 'person-outline',
    activeIcon: 'person',
    route: '/main_admin/profile',
  },
]

const SIDEBAR_GRADIENT_LIGHT = [
  '#ffffff',
  '#f0f6ff',
  '#e3eeff',
  '#d6e6ff',
] as const

const SIDEBAR_GRADIENT_DARK = [
  '#060c18',
  '#0a1528',
  '#0d1e3d',
  '#0f2456',
] as const

interface NavItemProps {
  item: MenuItem
  isActive: boolean
  collapsed: boolean
  isDark: boolean
  contentOpacity: Animated.Value
  onPress: () => void
  isWeb: boolean
  accentColor: string
}

const NavItem: React.FC<NavItemProps> = ({
  item,
  isActive,
  collapsed,
  isDark,
  contentOpacity,
  onPress,
  isWeb,
  accentColor,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current
  const bgAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current

  useEffect(() => {
    Animated.timing(bgAnim, {
      toValue: isActive ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start()
  }, [isActive])

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 30,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start()
  }

  const pillBg = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      'transparent',
      isDark ? 'rgba(59,130,246,0.18)' : 'rgba(37,99,235,0.12)',
    ],
  })

  const activeColor = accentColor
  const inactiveColor = isDark ? '#8ba3c7' : '#5c7aa8'
  const itemColor = isActive ? activeColor : inactiveColor

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        {...(isWeb
          ? {
              // @ts-ignore – web-only event handlers
              onMouseEnter: (e: any) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = isDark
                    ? 'rgba(255,255,255,0.05)'
                    : 'rgba(37,99,235,0.06)'
                }
              },
              onMouseLeave: (e: any) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              },
            }
          : {})}
      >
        {/* Pill background */}
        <Animated.View
          style={[
            styles.navItem,
            collapsed ? styles.navItemCollapsed : styles.navItemExpanded,
            { backgroundColor: pillBg },
            isActive && styles.navItemActive,
          ]}
        >
          {/* Left accent bar */}
          {isActive && !collapsed && (
            <View
              style={[styles.activeBar, { backgroundColor: accentColor }]}
            />
          )}

          {/* Icon container */}
          <View
            style={[
              styles.iconContainer,
              collapsed && styles.iconContainerCollapsed,
              isActive && {
                backgroundColor: isDark
                  ? 'rgba(59,130,246,0.22)'
                  : 'rgba(37,99,235,0.14)',
              },
            ]}
          >
            <Ionicons
              name={isActive ? item.activeIcon : item.icon}
              size={20}
              color={itemColor}
            />
          </View>

          {/* Label */}
          {!collapsed && (
            <Animated.Text
              style={[
                styles.navLabel,
                { color: itemColor, opacity: contentOpacity },
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Animated.Text>
          )}

          {isActive && collapsed && (
            <View
              style={[
                styles.collapsedActiveDot,
                { backgroundColor: accentColor },
              ]}
            />
          )}
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  )
}

// ─── Main Layout

export default function MainAdminLayout() {
  const pathname = usePathname()
  const isWeb = Platform.OS === 'web'

  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [settingsModalVisible, setSettingsModalVisible] = useState(false)
  const [isLayoutReady, setIsLayoutReady] = useState(false)
  const [userStats, setUserStats] = useState<UserStats>({
    total: 0,
    newThisWeek: 0,
    mainAdmins: 0,
    assistantAdmins: 0,
    students: 0,
  })

  const sidebarAnim = useRef(new Animated.Value(SIDEBAR_FULL_WIDTH)).current
  const contentOpacity = useRef(new Animated.Value(1)).current
  const mobileSlideAnim = useRef(
    new Animated.Value(-MOBILE_SIDEBAR_WIDTH)
  ).current
  const mobileOverlayAnim = useRef(new Animated.Value(0)).current

  const { userData, logout } = useAuth()
  const { colors, isDark, theme, setTheme, toggleTheme } = useTheme()

  const accentColor = isDark ? '#60a5fa' : '#2563eb'

  useEffect(() => {
    Animated.parallel([
      Animated.timing(sidebarAnim, {
        toValue: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_FULL_WIDTH,
        duration: 280,
        useNativeDriver: false,
      }),
      Animated.timing(contentOpacity, {
        toValue: collapsed ? 0 : 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start()
  }, [collapsed])

  useEffect(() => {
    Animated.parallel([
      Animated.spring(mobileSlideAnim, {
        toValue: mobileMenuOpen ? 0 : -MOBILE_SIDEBAR_WIDTH,
        useNativeDriver: true,
        speed: 14,
        bounciness: 6,
      }),
      Animated.timing(mobileOverlayAnim, {
        toValue: mobileMenuOpen ? 1 : 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start()
  }, [mobileMenuOpen])

  useEffect(() => {
    const t = setTimeout(() => setIsLayoutReady(true), 300)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const q = query(collection(db, 'users'))
    const unsub = onSnapshot(q, (snap) => {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      let mainAdmins = 0,
        assistantAdmins = 0,
        students = 0,
        newThisWeek = 0

      snap.docs.forEach((doc) => {
        const d = doc.data()
        if (d.role === 'main_admin') mainAdmins++
        else if (d.role === 'assistant_admin') assistantAdmins++
        else if (d.role === 'student') students++

        const ca = d.createdAt?.toDate?.() ?? d.createdAt
        if (ca && ca >= oneWeekAgo) newThisWeek++
      })

      setUserStats({
        total: snap.size,
        newThisWeek,
        mainAdmins,
        assistantAdmins,
        students,
      })
    })
    return () => unsub()
  }, [])

  const isRouteActive = (route: Href): boolean => {
    const r = route.toString()
    if (r === '/main_admin')
      return pathname === '/main_admin' || pathname === '/main_admin/'
    return pathname.includes(r.replace('/main_admin/', ''))
  }

  const handleNavigation = (route: Href) => {
    router.push(route)
    if (!isWeb) setMobileMenuOpen(false)
  }

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => mobileMenuOpen && g.dx < -20,
      onPanResponderMove: (_, g) => {
        if (g.dx < 0)
          mobileSlideAnim.setValue(Math.max(-MOBILE_SIDEBAR_WIDTH, g.dx))
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -80) {
          setMobileMenuOpen(false)
        } else {
          Animated.spring(mobileSlideAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start()
        }
      },
    })
  ).current

  const Sidebar = ({ isMobile = false }: { isMobile?: boolean }) => {
    const gradientColors = isDark
      ? SIDEBAR_GRADIENT_DARK
      : SIDEBAR_GRADIENT_LIGHT

    const dividerColor = isDark
      ? 'rgba(255,255,255,0.08)'
      : 'rgba(37,99,235,0.12)'
    const mutedText = isDark ? '#8ba3c7' : '#4d6a9a'
    const primaryText = isDark ? '#e2eaf8' : '#1e3a6e'

    return (
      <Animated.View
        style={[
          styles.sidebarContainer,
          { width: isMobile ? MOBILE_SIDEBAR_WIDTH : sidebarAnim },

          !isDark && {
            borderRightWidth: 1,
            borderRightColor: 'rgba(37,99,235,0.12)',
          },
        ]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: isDark ? 0 : 0.6, y: 1 }}
          locations={isDark ? [0, 0.35, 0.65, 1] : [0, 0.45, 0.8, 1]}
          style={styles.sidebarGradient}
        >
          {isDark && (
            <View style={StyleSheet.absoluteFill} pointerEvents='none'>
              <LinearGradient
                colors={['rgba(9,30,77,0.25)', 'transparent']}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </View>
          )}

          <View style={styles.sidebarContent}>
            {isWeb && !isMobile && (
              <TouchableOpacity
                onPress={() => setCollapsed(!collapsed)}
                style={[
                  styles.collapseBtn,
                  collapsed && styles.collapseBtnCollapsed,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(37,99,235,0.08)',
                  },
                ]}
                activeOpacity={0.75}
              >
                <Animated.View
                  style={{
                    transform: [
                      {
                        rotate: sidebarAnim.interpolate({
                          inputRange: [
                            SIDEBAR_COLLAPSED_WIDTH,
                            SIDEBAR_FULL_WIDTH,
                          ],
                          outputRange: ['180deg', '0deg'],
                        }),
                      },
                    ],
                  }}
                >
                  <Ionicons name='chevron-back' size={16} color={mutedText} />
                </Animated.View>
              </TouchableOpacity>
            )}

            <View
              style={[styles.brandRow, collapsed && styles.brandRowCollapsed]}
            >
              <View
                style={[
                  styles.logoWrap,
                  {
                    backgroundColor: isDark
                      ? 'rgba(96,165,250,0.12)'
                      : 'rgba(37,99,235,0.10)',
                    borderColor: isDark
                      ? 'rgba(96,165,250,0.2)'
                      : 'rgba(37,99,235,0.18)',
                  },
                ]}
              >
                <Image
                  source={require('../../assets/images/Logo/V_1.0.1.png')}
                  style={styles.logoImage}
                  resizeMode='contain'
                />
              </View>

              {!collapsed && (
                <Animated.View
                  style={[styles.brandText, { opacity: contentOpacity }]}
                >
                  <Text style={[styles.brandName, { color: primaryText }]}>
                    Admin Panel
                  </Text>
                  <Text style={[styles.brandSub, { color: mutedText }]}>
                    TMC Campus Hub
                  </Text>
                  <View style={styles.roleChip}>
                    <View
                      style={[
                        styles.roleDotIndicator,
                        { backgroundColor: '#10b981' },
                      ]}
                    />
                    <Text style={[styles.roleChipText, { color: '#10b981' }]}>
                      {userData?.role === 'main_admin'
                        ? 'Main Admin'
                        : 'Assistant Admin'}
                    </Text>
                  </View>
                </Animated.View>
              )}
            </View>

            {/* ── Quick Stats  */}
            {isWeb && !collapsed && (
              <Animated.View
                style={[
                  styles.statsCard,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255,255,255,0.04)'
                      : 'rgba(37,99,235,0.06)',
                    borderColor: dividerColor,
                    opacity: contentOpacity,
                  },
                ]}
              >
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: primaryText }]}>
                    {userStats.newThisWeek}
                  </Text>
                  <Text style={[styles.statLabel, { color: mutedText }]}>
                    New / week
                  </Text>
                </View>
                <View
                  style={[
                    styles.statDivider,
                    { backgroundColor: dividerColor },
                  ]}
                />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: primaryText }]}>
                    {userStats.total}
                  </Text>
                  <Text style={[styles.statLabel, { color: mutedText }]}>
                    Total users
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* ── Role breakdown */}
            {isWeb && !collapsed && userStats.total > 0 && (
              <Animated.View
                style={[styles.roleBreakdown, { opacity: contentOpacity }]}
              >
                {[
                  {
                    label: 'Main Admin',
                    count: userStats.mainAdmins,
                    color: '#8b5cf6',
                  },
                  {
                    label: 'Asst. Admin',
                    count: userStats.assistantAdmins,
                    color: '#f59e0b',
                  },
                  {
                    label: 'Students',
                    count: userStats.students,
                    color: '#0ea5e9',
                  },
                ].map((r) => (
                  <View key={r.label} style={styles.roleRow}>
                    <View
                      style={[styles.roleDot, { backgroundColor: r.color }]}
                    />
                    <Text style={[styles.roleLabel, { color: mutedText }]}>
                      {r.label}
                    </Text>
                    <Text style={[styles.roleCount, { color: primaryText }]}>
                      {r.count}
                    </Text>
                  </View>
                ))}
              </Animated.View>
            )}

            {/* ── Section label ── */}
            {!collapsed && (
              <Animated.Text
                style={[
                  styles.sectionLabel,
                  { color: mutedText, opacity: contentOpacity },
                ]}
              >
                NAVIGATION
              </Animated.Text>
            )}

            <View style={styles.navList}>
              {menuItems.map((item) => (
                <NavItem
                  key={item.name}
                  item={item}
                  isActive={isRouteActive(item.route)}
                  collapsed={collapsed}
                  isDark={isDark}
                  contentOpacity={contentOpacity}
                  onPress={() => handleNavigation(item.route)}
                  isWeb={isWeb}
                  accentColor={accentColor}
                />
              ))}
            </View>

            {/* ── Footer ── */}
            <View
              style={[styles.sidebarFooter, { borderTopColor: dividerColor }]}
            >
              <TouchableOpacity
                style={[
                  styles.footerItem,
                  collapsed && styles.footerItemCollapsed,
                ]}
                onPress={() => setSettingsModalVisible(true)}
                activeOpacity={0.75}
                {...(isWeb
                  ? {
                      // @ts-ignore
                      onMouseEnter: (e: any) => {
                        e.currentTarget.style.backgroundColor = isDark
                          ? 'rgba(255,255,255,0.05)'
                          : 'rgba(37,99,235,0.06)'
                      },
                      // @ts-ignore
                      onMouseLeave: (e: any) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      },
                    }
                  : {})}
              >
                <View
                  style={[
                    styles.iconContainer,
                    collapsed && styles.iconContainerCollapsed,
                  ]}
                >
                  <Ionicons
                    name='settings-outline'
                    size={20}
                    color={mutedText}
                  />
                </View>
                {!collapsed && (
                  <Animated.Text
                    style={[
                      styles.footerLabel,
                      { color: mutedText, opacity: contentOpacity },
                    ]}
                  >
                    Settings
                  </Animated.Text>
                )}
              </TouchableOpacity>

              {/* Logout – now with hover AND actual logout */}
              <TouchableOpacity
                style={[
                  styles.footerItem,
                  collapsed && styles.footerItemCollapsed,
                  styles.logoutItem,
                ]}
                onPress={async () => {
                  try {
                    await logout()
                    router.replace('/super-admin-login' as Href)
                  } catch (error) {
                    console.error('Logout failed:', error)
                  }
                }}
                activeOpacity={0.75}
                {...(isWeb
                  ? {
                      // @ts-ignore
                      onMouseEnter: (e: any) => {
                        e.currentTarget.style.backgroundColor = isDark
                          ? 'rgba(239,68,68,0.10)'
                          : 'rgba(239,68,68,0.06)'
                      },
                      // @ts-ignore
                      onMouseLeave: (e: any) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      },
                    }
                  : {})}
              >
                <View
                  style={[
                    styles.iconContainer,
                    styles.logoutIconContainer,
                    collapsed && styles.iconContainerCollapsed,
                  ]}
                >
                  <Ionicons name='log-out-outline' size={20} color='#ef4444' />
                </View>
                {!collapsed && (
                  <Animated.Text
                    style={[styles.logoutLabel, { opacity: contentOpacity }]}
                  >
                    Log Out
                  </Animated.Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    )
  }

  // ─── Loading gate ──────────────────────────────────────────────────────────
  if (!isLayoutReady) {
    return (
      <LoadingScreen
        message='Loading Dashboard'
        subMessage='Preparing your admin workspace'
      />
    )
  }

  const mainMarginLeft = sidebarAnim.interpolate({
    inputRange: [SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_FULL_WIDTH],
    outputRange: [SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_FULL_WIDTH],
  })

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.statusBar} />

      {/* Mobile header bar */}
      {!isWeb && (
        <View
          style={[
            styles.mobileHeader,
            {
              backgroundColor: colors.header.background,
              borderBottomColor: colors.header.border,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={styles.hamburger}
          >
            <Ionicons
              name={mobileMenuOpen ? 'close' : 'menu'}
              size={26}
              color={colors.header.text}
            />
          </TouchableOpacity>

          <View style={styles.mobileLogoBox}>
            <Image
              source={require('../../assets/images/Logo/V_1.0.1.png')}
              style={styles.mobileLogo}
              resizeMode='contain'
            />
          </View>

          <View style={{ width: 40 }} />
        </View>
      )}

      {/* Mobile overlay */}
      {!isWeb && mobileMenuOpen && (
        <Animated.View
          style={[styles.mobileOverlay, { opacity: mobileOverlayAnim }]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setMobileMenuOpen(false)}
          />
        </Animated.View>
      )}

      {/* Mobile drawer */}
      {!isWeb && (
        <Animated.View
          style={[
            styles.mobileDrawer,
            { transform: [{ translateX: mobileSlideAnim }] },
          ]}
        >
          <Sidebar isMobile />
        </Animated.View>
      )}

      {/* Main content area */}
      <Animated.View
        style={[styles.mainContent, isWeb && { marginLeft: mainMarginLeft }]}
      >
        {isWeb && <Sidebar />}

        {/* Tab content */}
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <Tabs
            initialRouteName='index'
            screenOptions={{
              headerShown: false,
              tabBarStyle: !isWeb
                ? {
                    backgroundColor: colors.card,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    paddingBottom: 8,
                    paddingTop: 8,
                    height: 65,
                  }
                : { display: 'none' },
              tabBarActiveTintColor: accentColor,
              tabBarInactiveTintColor: isDark ? '#94a3b8' : '#64748b',
            }}
          >
            {menuItems.map((item) => (
              <Tabs.Screen
                key={item.name}
                name={item.name}
                options={{
                  title: item.title,
                  tabBarIcon: ({ color, focused }) => (
                    <Ionicons
                      name={focused ? item.activeIcon : item.icon}
                      size={22}
                      color={color}
                    />
                  ),
                }}
              />
            ))}
          </Tabs>
        </View>
      </Animated.View>

      {/* ── Settings Modal ─────────────────────────────────────────────────── */}
      <Modal
        visible={settingsModalVisible}
        transparent
        animationType='fade'
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <BlurView
          intensity={70}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setSettingsModalVisible(false)}
          />
        </BlurView>

        <View style={styles.modalCentered}>
          <View
            style={[
              styles.modalCard,
              {
                borderColor: isDark
                  ? 'rgba(255,255,255,0.12)'
                  : 'rgba(37,99,235,0.15)',
                shadowColor: isDark ? '#000' : '#1e3a6e',
              },
            ]}
          >
            {/* Modal header gradient */}
            <LinearGradient
              colors={isDark ? ['#0d1e3d', '#060c18'] : ['#ffffff', '#e3eeff']}
              style={styles.modalHeaderGradient}
            >
              <View style={styles.modalHeaderRow}>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: isDark ? '#e2eaf8' : '#1e3a6e' },
                  ]}
                >
                  Settings
                </Text>
                <TouchableOpacity
                  onPress={() => setSettingsModalVisible(false)}
                >
                  <Ionicons name='close-circle' size={26} color={accentColor} />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalBody}
              style={{
                backgroundColor: isDark
                  ? 'rgba(10,18,36,0.92)'
                  : 'rgba(248,251,255,0.95)',
              }}
            >
              {/* Appearance */}
              <View
                style={[
                  styles.modalSection,
                  {
                    borderColor: isDark
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(37,99,235,0.10)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.modalSectionTitle,
                    { color: isDark ? '#e2eaf8' : '#1e3a6e' },
                  ]}
                >
                  Appearance
                </Text>

                {/* Dark mode toggle */}
                <View
                  style={[
                    styles.modalRow,
                    {
                      borderBottomColor: isDark
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(37,99,235,0.08)',
                    },
                  ]}
                >
                  <View style={styles.modalRowLeft}>
                    <Ionicons
                      name={isDark ? 'moon' : 'sunny'}
                      size={22}
                      color={accentColor}
                    />
                    <Text
                      style={[
                        styles.modalRowText,
                        { color: isDark ? '#cbd5e1' : '#334155' },
                      ]}
                    >
                      {isDark ? 'Dark Mode' : 'Light Mode'}
                    </Text>
                  </View>
                  <Switch
                    value={isDark}
                    onValueChange={toggleTheme}
                    trackColor={{ false: '#767577', true: accentColor }}
                    thumbColor='#fff'
                  />
                </View>

                {/* Theme options */}
                <Text
                  style={[
                    styles.modalSubLabel,
                    { color: isDark ? '#8ba3c7' : '#4d6a9a' },
                  ]}
                >
                  THEME PREFERENCE
                </Text>

                {(
                  [
                    {
                      value: 'light',
                      label: 'Light Mode',
                      icon: 'sunny-outline',
                    },
                    { value: 'dark', label: 'Dark Mode', icon: 'moon-outline' },
                    {
                      value: 'system',
                      label: 'System Default',
                      icon: 'phone-portrait-outline',
                    },
                  ] as const
                ).map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.themeOption,
                      theme === opt.value && {
                        backgroundColor: isDark
                          ? 'rgba(59,130,246,0.15)'
                          : 'rgba(37,99,235,0.10)',
                      },
                    ]}
                    onPress={() => setTheme(opt.value)}
                  >
                    <View style={styles.themeOptionLeft}>
                      <Ionicons
                        name={opt.icon}
                        size={20}
                        color={
                          theme === opt.value
                            ? accentColor
                            : isDark
                              ? '#8ba3c7'
                              : '#4d6a9a'
                        }
                      />
                      <Text
                        style={[
                          styles.themeOptionText,
                          {
                            color:
                              theme === opt.value
                                ? accentColor
                                : isDark
                                  ? '#cbd5e1'
                                  : '#334155',
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </View>
                    {theme === opt.value && (
                      <Ionicons
                        name='checkmark-circle'
                        size={20}
                        color={accentColor}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* About */}
              <View
                style={[
                  styles.modalSection,
                  {
                    borderColor: isDark
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(37,99,235,0.10)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.modalSectionTitle,
                    { color: isDark ? '#e2eaf8' : '#1e3a6e' },
                  ]}
                >
                  About
                </Text>
                <View style={styles.modalRow}>
                  <Text
                    style={{
                      color: isDark ? '#8ba3c7' : '#4d6a9a',
                      fontSize: 15,
                    }}
                  >
                    Version
                  </Text>
                  <Text
                    style={{
                      color: isDark ? '#e2eaf8' : '#1e3a6e',
                      fontSize: 15,
                      fontWeight: '600',
                    }}
                  >
                    2.0.0
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  sidebarContainer: {
    height: '100%',
    position: 'fixed' as any,
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 10,
    overflow: 'hidden',
    shadowColor: '#1e3a6e',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  sidebarGradient: { flex: 1 },
  sidebarContent: { flex: 1, paddingVertical: 2 },

  // Collapse button
  collapseBtn: {
    alignSelf: 'flex-end',
    marginRight: 14,
    marginBottom: 12,
    padding: 6,
    borderRadius: 8,
    width: 30,
    alignItems: 'center',
  },
  collapseBtnCollapsed: {
    alignSelf: 'center',
    marginRight: 0,
  },

  // Brand row
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  brandRowCollapsed: { justifyContent: 'center', paddingHorizontal: 0 },
  logoWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  logoImage: { width: 36, height: 36, borderRadius: 18 },
  brandText: { flex: 1 },
  brandName: { fontSize: 15, fontWeight: '700', letterSpacing: -0.3 },
  brandSub: { fontSize: 11, marginTop: 1, marginBottom: 6 },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: 'rgba(16,185,129,0.12)',
  },
  roleDotIndicator: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  roleChipText: { fontSize: 10, fontWeight: '600' },

  // Stats card
  statsCard: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 10, marginTop: 2 },
  statDivider: { width: 1, marginHorizontal: 10 },

  // Role breakdown
  roleBreakdown: {
    marginHorizontal: 12,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  roleDot: { width: 7, height: 7, borderRadius: 3.5, marginRight: 8 },
  roleLabel: { flex: 1, fontSize: 11 },
  roleCount: { fontSize: 11, fontWeight: '600' },

  // Section label
  sectionLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginHorizontal: 20,
    marginBottom: 4,
    marginTop: 2,
  },

  // Nav list
  navList: { flex: 1, paddingHorizontal: 8 },

  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
    borderRadius: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  navItemExpanded: {
    paddingVertical: 10,
    paddingLeft: 6,
    paddingRight: 12,
  },
  navItemCollapsed: {
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navItemActive: {
    paddingLeft: 10,
  },

  activeBar: {
    position: 'absolute',
    left: 0,
    top: '20%',
    width: 3,
    height: '60%',
    borderRadius: 2,
  },

  collapsedActiveDot: {
    position: 'absolute',
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
  },

  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  iconContainerCollapsed: { marginRight: 0 },

  // Nav label
  navLabel: { fontSize: 14, fontWeight: '600', flex: 1 },

  // Footer
  sidebarFooter: {
    borderTopWidth: 1,
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    marginVertical: 2,
  },
  footerItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  footerLabel: { fontSize: 14, fontWeight: '500', marginLeft: 10 },
  logoutItem: { marginTop: 4 },
  logoutIconContainer: { backgroundColor: 'rgba(239,68,68,0.10)' },
  logoutLabel: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },

  // Main content
  mainContent: { flex: 1, flexDirection: 'row' },

  // Mobile header
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
  hamburger: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  mobileLogoBox: { flex: 1, alignItems: 'center' },
  mobileLogo: { width: 36, height: 36 },

  // Mobile overlay + drawer
  mobileOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 1001,
  },
  mobileDrawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: MOBILE_SIDEBAR_WIDTH,
    zIndex: 1002,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },

  // Settings modal
  modalCentered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 14,
  },
  modalHeaderGradient: {},
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  modalTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
  modalBody: { paddingBottom: 24 },
  modalSection: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  modalSubLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalRowText: { fontSize: 15, fontWeight: '500' },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 8,
    marginVertical: 3,
    borderRadius: 12,
  },
  themeOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  themeOptionText: { fontSize: 14, fontWeight: '500' },
})

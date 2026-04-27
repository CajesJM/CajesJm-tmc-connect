import React, { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

interface NavLink {
  label: string
  href: string
}

interface Feature {
  icon: string
  title: string
  description: string
}

interface Stat {
  value: string
  label: string
}

const NAV_LINKS: NavLink[] = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
]

const FEATURES: Feature[] = [
  {
    icon: '',
    title: 'Geolocation Attendance',
    description:
      'Verify student presence at campus events with precise GPS-based location checks — no more proxy attendance.',
  },
  {
    icon: '',
    title: 'QR Code Check-In',
    description:
      'Generate and scan unique QR codes for instant, seamless event check-ins directly from your mobile device.',
  },
  {
    icon: '',
    title: 'Event Management',
    description:
      'Discover, register, and track campus events all in one place — from academic seminars to org activities.',
  },
  {
    icon: '',
    title: 'Secure Authentication',
    description:
      'Role-based access for students, faculty, and administrators backed by Firebase secure authentication.',
  },
  {
    icon: '',
    title: 'Real-Time Analytics',
    description:
      'Organizers get instant attendance reports and participation insights to power data-driven decisions.',
  },
  {
    icon: '',
    title: 'Cross-Platform',
    description:
      'Works flawlessly on iOS, Android, and the web — one app for every device on campus.',
  },
]

const STATS: Stat[] = [
  { value: '100%', label: 'Attendance Accuracy' },
  { value: '3s', label: 'Average Check-In Time' },
  { value: 'iOS & Android', label: 'Platform Support' },
  { value: 'Real-Time', label: 'Data Syncing' },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Create or Join an Event',
    body: 'Faculty publish events; students browse the campus feed and register with one tap.',
  },
  {
    step: '02',
    title: 'Arrive & Check In',
    body: 'On arrival, scan the event QR code. The app confirms your GPS location matches the venue.',
  },
  {
    step: '03',
    title: 'Attendance Logged',
    body: 'Your attendance is recorded instantly in the cloud. No paper forms, no manual counting.',
  },
]

const useWindowWidth = () => {
  const [width, setWidth] = useState(Dimensions.get('window').width)
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) =>
      setWidth(window.width)
    )
    return () => sub?.remove()
  }, [])
  return width
}

const DesktopNav: React.FC<{ onNavPress: (href: string) => void }> = ({
  onNavPress,
}) => (
  <View style={styles.desktopNav}>
    {/* Logo */}
    <Image
      source={require('../assets/images/Logo/TMC-Coonect-V.2.png')}
      style={styles.logoImage}
      resizeMode='contain'
    />

    {/* Links */}
    <View style={styles.navLinks}>
      {NAV_LINKS.map((link) => (
        <TouchableOpacity
          key={link.href}
          onPress={() => onNavPress(link.href)}
          style={styles.navLinkBtn}
        >
          <Text style={styles.navLinkText}>{link.label}</Text>
        </TouchableOpacity>
      ))}
    </View>

    {/* CTA */}
    <TouchableOpacity style={styles.navCTA}>
      <Text style={styles.navCTAText}>Get the App →</Text>
    </TouchableOpacity>
  </View>
)

/** Mobile navigation bar with hamburger */
const MobileNav: React.FC<{ onNavPress: (href: string) => void }> = ({
  onNavPress,
}) => {
  const [open, setOpen] = useState(false)
  const anim = useRef(new Animated.Value(0)).current

  const toggle = () => {
    Animated.timing(anim, {
      toValue: open ? 0 : 1,
      duration: 240,
      useNativeDriver: false,
    }).start()
    setOpen((v) => !v)
  }

  const menuHeight = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, NAV_LINKS.length * 52 + 72],
  })

  const menuOpacity = anim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0, 1],
  })

  return (
    <View style={styles.mobileNavContainer}>
      <View style={styles.mobileNavBar}>
        {/* Logo */}
        <Image
          source={require('../assets/images/Logo/TMC-Coonect-V.2.png')}
          style={styles.logoImage}
          resizeMode='contain'
        />

        {/* Hamburger */}
        <TouchableOpacity
          style={styles.hamburger}
          onPress={toggle}
          accessibilityLabel='Toggle navigation menu'
        >
          <HamburgerIcon open={open} />
        </TouchableOpacity>
      </View>

      {/* Dropdown menu */}
      <Animated.View
        style={[
          styles.mobileMenu,
          { maxHeight: menuHeight, opacity: menuOpacity },
        ]}
      >
        {NAV_LINKS.map((link) => (
          <TouchableOpacity
            key={link.href}
            style={styles.mobileMenuLink}
            onPress={() => {
              onNavPress(link.href)
              toggle()
            }}
          >
            <Text style={styles.mobileMenuLinkText}>{link.label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.mobileMenuCTA}>
          <Text style={styles.navCTAText}>Get the App →</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

/** Animated 3-line → X hamburger icon */
const HamburgerIcon: React.FC<{ open: boolean }> = ({ open }) => (
  <View style={styles.hamburgerIcon}>
    <View
      style={[
        styles.bar,
        open && { transform: [{ rotate: '45deg' }, { translateY: 8 }] },
      ]}
    />
    <View style={[styles.bar, open && { opacity: 0 }]} />
    <View
      style={[
        styles.bar,
        open && { transform: [{ rotate: '-45deg' }, { translateY: -8 }] },
      ]}
    />
  </View>
)

/** System-announcement hero banner */
const SystemBanner: React.FC = () => (
  <View style={styles.systemBanner}>
    <Text style={styles.bannerBadge}>System Notice</Text>
    <Text style={styles.bannerText}>
      TMC Connect v2.0 is now live for all students and faculty.{' '}
      <Text style={styles.bannerLink}>
        Download the app and register today.
      </Text>
    </Text>
  </View>
)

/** Feature card */
const FeatureCard: React.FC<Feature> = ({ icon, title, description }) => (
  <View style={styles.featureCard}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <Text style={styles.featureTitle}>{title}</Text>
    <Text style={styles.featureDesc}>{description}</Text>
  </View>
)

/** Stat item */
const StatItem: React.FC<Stat> = ({ value, label }) => (
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
)

/** Step card */
const StepCard: React.FC<(typeof HOW_IT_WORKS)[0] & { isLast: boolean }> = ({
  step,
  title,
  body,
  isLast,
}) => (
  <View style={styles.stepRow}>
    <View style={styles.stepLeft}>
      <View style={styles.stepCircle}>
        <Text style={styles.stepNumber}>{step}</Text>
      </View>
      {!isLast && <View style={styles.stepLine} />}
    </View>
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepBody}>{body}</Text>
    </View>
  </View>
)

// ─── Main Component ───────────────────────────────────────────────────────────

const TMCConnectLanding: React.FC = () => {
  const width = useWindowWidth()
  const isDesktop = width >= 768

  // Fade-in for hero on mount
  const heroAnim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(heroAnim, {
      toValue: 1,
      duration: 900,
      useNativeDriver: true,
    }).start()
  }, [])

  const handleNavPress = (href: string) => {
    // On web this scrolls to section; on native it is a no-op
    if (Platform.OS === 'web') {
      const el = document.querySelector(href)
      el?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <View style={styles.root}>
      {/* ── Sticky Navigation ── */}
      <View style={styles.navWrapper}>
        {isDesktop ? (
          <DesktopNav onNavPress={handleNavPress} />
        ) : (
          <MobileNav onNavPress={handleNavPress} />
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── System Banner ── */}
        <SystemBanner />

        {/* ── Hero Section ── */}
        <View style={styles.hero} nativeID='hero'>
          {/* decorative blobs */}
          <View style={styles.blob1} />
          <View style={styles.blob2} />

          <Animated.View style={[styles.heroInner, { opacity: heroAnim }]}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Campus Digital Hub</Text>
            </View>

            <Text style={styles.heroHeadline}>
              Attendance{'\n'}
              <Text style={styles.heroAccent}>Reimagined</Text>
              {'\n'}for Campus Life.
            </Text>

            <Text style={styles.heroSubtitle}>
              TMC Connect brings QR check-ins, GPS verification, and event
              management together into one seamless campus experience — built
              for students and faculty alike.
            </Text>

            <View style={styles.heroCTAs}>
              <TouchableOpacity style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Download the App</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>Learn More ↓</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Hero illustration card */}
          <View style={styles.heroCard}>
            <View style={styles.heroCardHeader}>
              <View style={[styles.dot, { backgroundColor: '#FF6B6B' }]} />
              <View style={[styles.dot, { backgroundColor: '#FFE66D' }]} />
              <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
            </View>
            <View style={styles.heroCardBody}>
              <Text style={styles.cardEvent}>Campus TechnoDays 2026</Text>
              <View style={styles.cardDivider} />
              <Text style={styles.cardStatus}>Checked In</Text>
              <Text style={styles.cardTime}>08:00 AM • Main Campus</Text>
              <View style={styles.cardQRBox}>
                <Text style={styles.cardQRText}>▣</Text>
                <Text style={styles.cardQRLabel}>Scan QR to verify</Text>
              </View>
              <View style={styles.cardGPSRow}>
                <Text style={styles.cardGPS}>📍 Location confirmed</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Stats Banner ── */}
        <View style={styles.statsBanner}>
          {STATS.map((s) => (
            <StatItem key={s.label} {...s} />
          ))}
        </View>

        {/* ── Features Section ── */}
        <View style={styles.section} nativeID='features'>
          <Text style={styles.sectionTag}>Features</Text>
          <Text style={styles.sectionHeading}>
            Everything campus attendance needs
          </Text>
          <Text style={styles.sectionSub}>
            Designed for Philippine campuses — fast, accurate, and offline-ready
            when the wifi goes out.
          </Text>

          <View
            style={[
              styles.featuresGrid,
              isDesktop && styles.featuresGridDesktop,
            ]}
          >
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </View>
        </View>

        {/* ── How It Works ── */}
        <View style={styles.howSection} nativeID='how-it-works'>
          <View style={styles.howContent}>
            <Text style={styles.sectionTag}>How It Works</Text>
            <Text style={styles.sectionHeadingLight}>
              From event to attendance in 3 steps
            </Text>
            <View style={styles.steps}>
              {HOW_IT_WORKS.map((s, i) => (
                <StepCard
                  key={s.step}
                  {...s}
                  isLast={i === HOW_IT_WORKS.length - 1}
                />
              ))}
            </View>
          </View>
        </View>

        {/* ── About / CTA Section ── */}
        <View style={styles.aboutSection} nativeID='about'>
          <View style={styles.blob3} />
          <Text style={styles.sectionTag}>About TMC Connect</Text>
          <Text style={styles.sectionHeading}>
            Built by students,{'\n'}for the campus community.
          </Text>
          <Text style={styles.aboutBody}>
            TMC Connect started as a thesis project to solve one of the most
            persistent campus problems — unreliable attendance. Now it's a
            full-featured platform covering event management, QR check-in, GPS
            verification, and real-time reporting. Open for all departments.
          </Text>
          <TouchableOpacity style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Get TMC Connect →</Text>
          </TouchableOpacity>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer} nativeID='contact'>
          <Image
            source={require('../assets/images/Logo/TMC-Coonect-V.2.png')}
            style={styles.logoImageButtom}
            resizeMode='contain'
          />
          <Text style={styles.footerTagline}>
            Empowering campus communities through smart attendance technology.
          </Text>
          <Text style={styles.footerCopy}>
            © {new Date().getFullYear()} TMC Connect · All rights reserved
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const NAV_HEIGHT = 64

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F0F7FF',
  },

  // ── Navigation
  navWrapper: {
    position: 'absolute' as any,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'rgba(240,247,255,0.92)',
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(12px)' } as any) : {}),
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  logoImage: {
    width: 150,
    height: 200,
  },
  logoImageButtom: {
    width: 200,
    height: 250,
    marginBottom: -100,
    marginTop: -70,
  },
  desktopNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: NAV_HEIGHT,
    paddingHorizontal: 48,
  },
  mobileNavContainer: {
    overflow: 'hidden',
  },
  mobileNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: NAV_HEIGHT,
    paddingHorizontal: 20,
  },
  logoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoMark: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  logoMarkText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  logoLabel: {
    color: '#1E293B',
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: -0.3,
  },
  navLinks: {
    flexDirection: 'row',
    gap: 4,
  },
  navLinkBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  navLinkText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '500',
  },
  navCTA: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  navCTAText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  hamburger: {
    padding: 8,
  },
  hamburgerIcon: {
    width: 24,
    height: 20,
    justifyContent: 'space-between',
  },
  bar: {
    height: 2.5,
    backgroundColor: '#1E293B',
    borderRadius: 2,
  },
  mobileMenu: {
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 20,
  },
  mobileMenuLink: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  mobileMenuLinkText: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '500',
  },
  mobileMenuCTA: {
    backgroundColor: '#1D4ED8',
    marginVertical: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },

  // ── Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: NAV_HEIGHT,
  },

  // ── System Banner
  systemBanner: {
    backgroundColor: '#1D4ED8',
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  bannerBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    overflow: 'hidden',
  },
  bannerText: {
    color: '#BFDBFE',
    fontSize: 13,
    flex: 1,
  },
  bannerLink: {
    color: '#fff',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  // ── Hero
  hero: {
    backgroundColor: '#EFF6FF',
    paddingTop: 64,
    paddingBottom: 80,
    paddingHorizontal: 24,
    overflow: 'hidden',
    minHeight: 600,
    alignItems: 'center',
    position: 'relative',
  },
  blob1: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: '#BFDBFE',
    opacity: 0.4,
    top: -80,
    right: -120,
  },
  blob2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#93C5FD',
    opacity: 0.25,
    bottom: 0,
    left: -80,
  },
  heroInner: {
    maxWidth: 600,
    alignItems: 'center',
    zIndex: 1,
  },
  heroBadge: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#93C5FD',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
    marginTop: -10,
  },
  heroBadgeText: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '600',
  },
  heroHeadline: {
    fontSize: 44,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 52,
    letterSpacing: -1.5,
    marginBottom: 20,
  },
  heroAccent: {
    color: '#1D4ED8',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 480,
    marginBottom: 36,
  },
  heroCTAs: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  primaryBtn: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  secondaryBtnText: {
    color: '#1D4ED8',
    fontSize: 15,
    fontWeight: '600',
  },

  // Hero card (mock UI)
  heroCard: {
    marginTop: 52,
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    zIndex: 1,
    overflow: 'hidden',
  },
  heroCardHeader: {
    flexDirection: 'row',
    gap: 6,
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },
  heroCardBody: {
    padding: 20,
    gap: 10,
  },
  cardEvent: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  cardStatus: {
    fontSize: 15,
    color: '#16A34A',
    fontWeight: '700',
  },
  cardTime: {
    fontSize: 12,
    color: '#94A3B8',
  },
  cardQRBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  cardQRText: {
    fontSize: 40,
    color: '#1D4ED8',
  },
  cardQRLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  cardGPSRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardGPS: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '600',
  },

  // ── Stats
  statsBanner: {
    backgroundColor: '#1D4ED8',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingVertical: 36,
    paddingHorizontal: 24,
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 120,
  },
  statValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    color: '#93C5FD',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },

  // ── Generic section
  section: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  sectionTag: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.8,
    marginBottom: 14,
  },
  sectionSub: {
    color: '#64748B',
    fontSize: 15,
    textAlign: 'center',
    maxWidth: 520,
    lineHeight: 24,
    marginBottom: 48,
  },

  // Features grid
  featuresGrid: {
    width: '100%',
    maxWidth: 960,
    gap: 16,
  },
  featuresGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
    maxWidth: 280,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  featureDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 21,
  },

  // ── How It Works
  howSection: {
    backgroundColor: '#0F172A',
    paddingVertical: 80,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  howContent: {
    maxWidth: 560,
    width: '100%',
  },
  sectionHeadingLight: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.8,
    marginBottom: 40,
  },
  steps: {
    gap: 0,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 20,
  },
  stepLeft: {
    alignItems: 'center',
    width: 44,
  },
  stepCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stepLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#334155',
    marginVertical: 4,
    marginBottom: 0,
    minHeight: 40,
  },
  stepContent: {
    flex: 1,
    paddingBottom: 36,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
    lineHeight: 24,
  },
  stepBody: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 22,
  },

  // ── About / CTA
  aboutSection: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 80,
    paddingHorizontal: 24,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  blob3: {
    position: 'absolute',
    width: 480,
    height: 480,
    borderRadius: 240,
    backgroundColor: '#BFDBFE',
    opacity: 0.35,
    top: -120,
    right: -160,
  },
  aboutBody: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    maxWidth: 560,
    lineHeight: 26,
    marginBottom: 36,
    zIndex: 1,
  },

  // ── Footer
  footer: {
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 12,
  },
  footerTagline: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 380,
    lineHeight: 22,
  },
  footerCopy: {
    color: '#334155',
    fontSize: 12,
    marginTop: 8,
  },
})

export default TMCConnectLanding

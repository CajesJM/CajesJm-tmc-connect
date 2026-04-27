import React, { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

const APK_DOWNLOAD_URL =
  'https://github.com/CajesJM/CajesJm-tmc-connect/releases/download/v2.0.0/TMC_Connect_v2.0.0.apk'
const CONTACT_EMAIL = 'developertmcconnect@gmail.com'
const NAV_HEIGHT = 64

interface NavLink {
  label: string
  href: string
}

interface Feature {
  icon: React.ReactNode
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

const MapPinIcon = ({ size = 28, color = '#1D4ED8' }) => (
  <View style={{ width: size, height: size }}>
    <Text
      style={{
        fontSize: size * 0.85,
        color,
        fontWeight: '300',
        lineHeight: size,
      }}
    >
      {'\u{1F4CD}'}
    </Text>
  </View>
)
const IconGeo = ({
  color = '#1D4ED8',
  size = 28,
}: {
  color?: string
  size?: number
}) => (
  <View
    style={{
      width: size,
      height: size,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <View
      style={{
        width: size * 0.55,
        height: size * 0.55,
        borderRadius: size * 0.275,
        borderWidth: 2.5,
        borderColor: color,
      }}
    />
    <View
      style={{
        width: 2.5,
        height: size * 0.3,
        backgroundColor: color,
        marginTop: -3,
        borderRadius: 2,
      }}
    />
  </View>
)

const IconQR = ({
  color = '#1D4ED8',
  size = 28,
}: {
  color?: string
  size?: number
}) => (
  <View
    style={{
      width: size,
      height: size,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <View style={{ flexDirection: 'row', gap: 2 }}>
      <View
        style={{
          width: size * 0.35,
          height: size * 0.35,
          borderWidth: 2,
          borderColor: color,
          borderRadius: 2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: size * 0.12,
            height: size * 0.12,
            backgroundColor: color,
            borderRadius: 1,
          }}
        />
      </View>
      <View style={{ gap: 2 }}>
        <View
          style={{
            width: size * 0.13,
            height: size * 0.13,
            backgroundColor: color,
            borderRadius: 1,
          }}
        />
        <View
          style={{
            width: size * 0.13,
            height: size * 0.13,
            backgroundColor: color,
            borderRadius: 1,
            opacity: 0.4,
          }}
        />
      </View>
    </View>
    <View style={{ flexDirection: 'row', gap: 2, marginTop: 2 }}>
      <View
        style={{
          width: size * 0.13,
          height: size * 0.13,
          backgroundColor: color,
          borderRadius: 1,
          opacity: 0.4,
        }}
      />
      <View
        style={{
          width: size * 0.13,
          height: size * 0.13,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
      <View
        style={{
          width: size * 0.35,
          height: size * 0.13,
          backgroundColor: color,
          borderRadius: 1,
          opacity: 0.6,
        }}
      />
    </View>
  </View>
)

const IconCalendar = ({
  color = '#1D4ED8',
  size = 28,
}: {
  color?: string
  size?: number
}) => (
  <View
    style={{
      width: size,
      height: size,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <View
      style={{
        width: size * 0.8,
        height: size * 0.72,
        borderWidth: 2,
        borderColor: color,
        borderRadius: 3,
      }}
    >
      <View
        style={{
          height: size * 0.2,
          backgroundColor: color,
          borderTopLeftRadius: 1,
          borderTopRightRadius: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          paddingHorizontal: 3,
        }}
      >
        <View
          style={{
            width: 2,
            height: size * 0.25,
            backgroundColor: '#fff',
            borderRadius: 1,
          }}
        />
        <View
          style={{
            width: 2,
            height: size * 0.25,
            backgroundColor: '#fff',
            borderRadius: 1,
          }}
        />
      </View>
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 2,
          padding: 3,
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <View
            key={i}
            style={{
              width: size * 0.12,
              height: size * 0.12,
              backgroundColor: i === 3 ? color : color + '30',
              borderRadius: 1,
            }}
          />
        ))}
      </View>
    </View>
  </View>
)

const IconShield = ({
  color = '#1D4ED8',
  size = 28,
}: {
  color?: string
  size?: number
}) => (
  <View
    style={{
      width: size,
      height: size,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <View
      style={{
        width: size * 0.65,
        height: size * 0.75,
        borderWidth: 2.5,
        borderColor: color,
        borderRadius: size * 0.15,
        borderBottomLeftRadius: size * 0.32,
        borderBottomRightRadius: size * 0.32,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: size * 0.22,
          height: size * 0.14,
          borderBottomWidth: 2.5,
          borderLeftWidth: 2.5,
          borderColor: color,
          transform: [{ rotate: '-45deg' }],
          marginTop: 4,
        }}
      />
    </View>
  </View>
)

const IconChart = ({
  color = '#1D4ED8',
  size = 28,
}: {
  color?: string
  size?: number
}) => (
  <View
    style={{
      width: size,
      height: size,
      alignItems: 'flex-end',
      justifyContent: 'flex-end',
      flexDirection: 'row',
      gap: 3,
      paddingBottom: 2,
    }}
  >
    {[0.35, 0.6, 0.45, 0.8, 0.55].map((h, i) => (
      <View
        key={i}
        style={{
          width: size * 0.1,
          height: size * h,
          backgroundColor: i === 3 ? color : color + '70',
          borderRadius: 2,
        }}
      />
    ))}
  </View>
)

const IconGlobe = ({
  color = '#1D4ED8',
  size = 28,
}: {
  color?: string
  size?: number
}) => (
  <View
    style={{
      width: size,
      height: size,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <View
      style={{
        width: size * 0.75,
        height: size * 0.75,
        borderRadius: size * 0.375,
        borderWidth: 2,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: size * 0.4,
          height: size * 0.75 - 4,
          borderRadius: size * 0.2,
          borderWidth: 1.5,
          borderColor: color + '80',
          position: 'absolute',
        }}
      />
      <View
        style={{
          width: size * 0.75 - 4,
          height: 1.5,
          backgroundColor: color + '60',
          position: 'absolute',
        }}
      />
    </View>
  </View>
)

const FEATURES: Feature[] = [
  {
    icon: <IconGeo color='#1D4ED8' size={30} />,
    title: 'Geolocation Attendance',
    description:
      'Verify student presence at campus events with precise GPS-based location checks — no more proxy attendance.',
  },
  {
    icon: <IconQR color='#1D4ED8' size={30} />,
    title: 'QR Code Check-In',
    description:
      'Generate and scan unique QR codes for instant, seamless event check-ins directly from your mobile device.',
  },
  {
    icon: <IconCalendar color='#1D4ED8' size={30} />,
    title: 'Event Management',
    description:
      'Discover, register, and track campus events all in one place — from academic seminars to org activities.',
  },
  {
    icon: <IconShield color='#1D4ED8' size={30} />,
    title: 'Secure Authentication',
    description:
      'Role-based access for students, faculty, and administrators backed by Firebase secure authentication.',
  },
  {
    icon: <IconChart color='#1D4ED8' size={30} />,
    title: 'Real-Time Analytics',
    description:
      'Organizers get instant attendance reports and participation insights to power data-driven decisions.',
  },
  {
    icon: <IconGlobe color='#1D4ED8' size={30} />,
    title: 'Cross-Platform',
    description:
      'Works flawlessly on iOS, Android, and the web — one app for every device on campus.',
  },
]

const STATS: Stat[] = [
  { value: '100%', label: 'Attendance Accuracy' },
  { value: '< 3s', label: 'Average Check-In Time' },
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
    body: 'Your attendance is recorded instantly in the firestore. No paper forms, no manual counting.',
  },
]

// LEARN MORE modal content
const LEARN_MORE_SECTIONS = [
  {
    title: 'Built for Philippine Campuses',
    body: 'TMC Connect was designed specifically with local campus realities in mind — from spotty WiFi to large student populations. The app uses optimized cloud sync and offline fallback so check-ins never fail.',
  },
  {
    title: 'Firebase-Powered Backend',
    body: 'The entire backend runs on Google Firebase — Firestore for real-time data, Firebase Auth for role-based access, and Firebase Storage for event assets. Secure, scalable, and battle-tested.',
  },
  {
    title: 'Thesis → Production',
    body: 'What started as a thesis project has become a full production platform. The v2.0 release includes a redesigned UI, performance improvements, and new admin analytics dashboard.',
  },
  {
    title: 'Open for All Departments',
    body: "Any department or student organization can create events on TMC Connect. Faculty can generate attendance reports in seconds. Administrators get a bird's eye view of campus engagement.",
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

// Breakpoints
const BP = { sm: 480, md: 768, lg: 1024 }

const handleDownload = () => {
  Linking.openURL(APK_DOWNLOAD_URL).catch(console.error)
}

const LearnMoreModal: React.FC<{ visible: boolean; onClose: () => void }> = ({
  visible,
  onClose,
}) => {
  const slideAnim = useRef(new Animated.Value(80)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 80,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [visible])

  return (
    <Modal
      visible={visible}
      transparent
      animationType='none'
      onRequestClose={onClose}
    >
      <Animated.View style={[modalStyles.overlay, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[
            modalStyles.sheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Header */}
          <View style={modalStyles.header}>
            <View>
              <Text style={modalStyles.headerTag}>LEARN MORE</Text>
              <Text style={modalStyles.headerTitle}>About TMC Connect</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
              <View style={modalStyles.closeIcon}>
                <View
                  style={[
                    modalStyles.closeBar,
                    { transform: [{ rotate: '45deg' }] },
                  ]}
                />
                <View
                  style={[
                    modalStyles.closeBar,
                    { transform: [{ rotate: '-45deg' }], position: 'absolute' },
                  ]}
                />
              </View>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={modalStyles.body}
          >
            {/* Hero stat row */}
            <View style={modalStyles.statRow}>
              {[
                { v: 'v2.0', l: 'Latest Release' },
                { v: 'Expo', l: 'Framework' },
                { v: 'Firebase', l: 'Backend' },
              ].map((s) => (
                <View key={s.l} style={modalStyles.miniStat}>
                  <Text style={modalStyles.miniStatVal}>{s.v}</Text>
                  <Text style={modalStyles.miniStatLabel}>{s.l}</Text>
                </View>
              ))}
            </View>

            {LEARN_MORE_SECTIONS.map((sec, i) => (
              <View key={i} style={modalStyles.infoBlock}>
                <View style={modalStyles.infoNumber}>
                  <Text style={modalStyles.infoNumberText}>
                    {String(i + 1).padStart(2, '0')}
                  </Text>
                </View>
                <View style={modalStyles.infoContent}>
                  <Text style={modalStyles.infoTitle}>{sec.title}</Text>
                  <Text style={modalStyles.infoBody}>{sec.body}</Text>
                </View>
              </View>
            ))}

            {/* Tech stack */}
            <View style={modalStyles.techSection}>
              <Text style={modalStyles.techHeading}>Tech Stack</Text>
              <View style={modalStyles.techGrid}>
                {[
                  'React Native',
                  'Expo',
                  'TypeScript',
                  'Firebase',
                  'Firestore',
                  'Firebase Auth',
                ].map((t) => (
                  <View key={t} style={modalStyles.techTag}>
                    <Text style={modalStyles.techTagText}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={modalStyles.downloadBtn}
              onPress={handleDownload}
            >
              <Text style={modalStyles.downloadBtnText}>
                Download TMC Connect →
              </Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#1D4ED8',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBar: {
    width: 16,
    height: 2,
    backgroundColor: '#475569',
    borderRadius: 1,
  },
  body: { paddingHorizontal: 24 },
  statRow: { flexDirection: 'row', gap: 12, paddingVertical: 20 },
  miniStat: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  miniStatVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1D4ED8',
    marginBottom: 2,
  },
  miniStatLabel: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  infoBlock: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoNumber: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  infoNumberText: { fontSize: 11, fontWeight: '800', color: '#1D4ED8' },
  infoContent: { flex: 1 },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  infoBody: { fontSize: 13, color: '#64748B', lineHeight: 21 },
  techSection: { paddingVertical: 20 },
  techHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  techGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  techTag: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
  },
  techTagText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  downloadBtn: {
    backgroundColor: '#1D4ED8',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  downloadBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
})

const DesktopNav: React.FC<{ onNavPress: (href: string) => void }> = ({
  onNavPress,
}) => (
  <View style={styles.desktopNav}>
    <Image
      source={require('../assets/images/Logo/TMC-Coonect-V.2.png')}
      style={styles.logoImage}
      resizeMode='contain'
    />
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
    <TouchableOpacity style={styles.navCTA} onPress={handleDownload}>
      <Text style={styles.navCTAText}>Get the App →</Text>
    </TouchableOpacity>
  </View>
)

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
        <Image
          source={require('../assets/images/Logo/TMC-Coonect-V.2.png')}
          style={styles.logoImage}
          resizeMode='contain'
        />
        <TouchableOpacity
          style={styles.hamburger}
          onPress={toggle}
          accessibilityLabel='Toggle navigation menu'
        >
          <HamburgerIcon open={open} />
        </TouchableOpacity>
      </View>
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
        <TouchableOpacity style={styles.mobileMenuCTA} onPress={handleDownload}>
          <Text style={styles.navCTAText}>Get the App →</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

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

const SystemBanner: React.FC = () => (
  <View style={styles.systemBanner}>
    <View style={styles.bannerBadgeWrap}>
      <Text style={styles.bannerBadge}>System Notice</Text>
    </View>
    <Text style={styles.bannerText}>
      TMC Connect v2.0 is now live.{' '}
      <Text style={styles.bannerLink} onPress={handleDownload}>
        Download and register today.
      </Text>
    </Text>
  </View>
)

const FeatureCard: React.FC<Feature & { index: number }> = ({
  icon,
  title,
  description,
  index,
}) => (
  <View
    style={[styles.featureCard, { animationDelay: `${index * 80}ms` }] as any}
  >
    <View style={styles.featureIconWrap}>{icon}</View>
    <Text style={styles.featureTitle}>{title}</Text>
    <Text style={styles.featureDesc}>{description}</Text>
  </View>
)

const StatItem: React.FC<Stat> = ({ value, label }) => (
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
)

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

const ContactSection: React.FC = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  const handleSend = () => {
    const subject = encodeURIComponent(
      `TMC Connect Inquiry from ${name || 'User'}`
    )
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    )
    Linking.openURL(
      `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`
    ).catch(console.error)
    setSent(true)
    setTimeout(() => setSent(false), 4000)
  }

  return (
    <View style={contactStyles.section} nativeID='contact'>
      <View style={contactStyles.inner}>
        {/* Left column */}
        <View style={contactStyles.infoCol}>
          <Text style={styles.sectionTag}>Get In Touch</Text>
          <Text style={contactStyles.heading}>
            We'd love{'\n'}to hear from you.
          </Text>
          <Text style={contactStyles.sub}>
            Have questions about TMC Connect, want to report a bug, or
            interested in integrating it with your campus? Reach out.
          </Text>

          <View style={contactStyles.contactItems}>
            <View style={contactStyles.contactItem}>
              <View style={contactStyles.contactItemIcon}>
                {/* Mail icon */}
                <View
                  style={{
                    width: 18,
                    height: 13,
                    borderWidth: 2,
                    borderColor: '#1D4ED8',
                    borderRadius: 3,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <View
                    style={{
                      width: 12,
                      height: 7,
                      borderTopWidth: 2,
                      borderTopColor: '#1D4ED8',
                      transform: [{ rotate: '180deg' }],
                    }}
                  />
                </View>
              </View>
              <View>
                <Text style={contactStyles.contactItemLabel}>Email</Text>
                <Text
                  style={contactStyles.contactItemValue}
                  onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
                >
                  {CONTACT_EMAIL}
                </Text>
              </View>
            </View>

            <View style={contactStyles.contactItem}>
              <View style={contactStyles.contactItemIcon}>
                {/* GitHub icon */}
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    borderWidth: 2,
                    borderColor: '#1D4ED8',
                  }}
                />
              </View>
              <View>
                <Text style={contactStyles.contactItemLabel}>
                  FB of the Developer
                </Text>
                <Text
                  style={contactStyles.contactItemValue}
                  onPress={() =>
                    Linking.openURL('https://www.facebook.com/arissuuu1')
                  }
                >
                  CajesJM / CajesJm-tmc-connect
                </Text>
              </View>
            </View>

            <View style={contactStyles.contactItem}>
              <View style={contactStyles.contactItemIcon}>
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: '#22C55E',
                  }}
                />
              </View>
              <View>
                <Text style={contactStyles.contactItemLabel}>Status</Text>
                <Text
                  style={[contactStyles.contactItemValue, { color: '#16A34A' }]}
                >
                  Active — v2.0 Live
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Right column — form */}
        <View style={contactStyles.formCol}>
          {sent ? (
            <View style={contactStyles.sentBox}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: '#DCFCE7',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 12,
                    borderLeftWidth: 3,
                    borderBottomWidth: 3,
                    borderColor: '#16A34A',
                    transform: [{ rotate: '-45deg' }],
                    marginTop: 4,
                  }}
                />
              </View>
              <Text style={contactStyles.sentTitle}>Message Sent!</Text>
              <Text style={contactStyles.sentBody}>
                Your email client should have opened. We'll get back to you
                soon.
              </Text>
            </View>
          ) : (
            <>
              <View style={contactStyles.formRow}>
                <View style={contactStyles.formField}>
                  <Text style={contactStyles.fieldLabel}>Your Name</Text>
                  <TextInput
                    style={contactStyles.input}
                    placeholder='Juan dela Cruz'
                    placeholderTextColor='#94A3B8'
                    value={name}
                    onChangeText={setName}
                  />
                </View>
                <View style={contactStyles.formField}>
                  <Text style={contactStyles.fieldLabel}>Email Address</Text>
                  <TextInput
                    style={contactStyles.input}
                    placeholder='juan@tmc.edu.ph'
                    placeholderTextColor='#94A3B8'
                    keyboardType='email-address'
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize='none'
                  />
                </View>
              </View>

              <View style={[contactStyles.formField, { marginBottom: 20 }]}>
                <Text style={contactStyles.fieldLabel}>Message</Text>
                <TextInput
                  style={[contactStyles.input, contactStyles.textarea]}
                  placeholder='Tell us what you need...'
                  placeholderTextColor='#94A3B8'
                  multiline
                  numberOfLines={5}
                  value={message}
                  onChangeText={setMessage}
                  textAlignVertical='top'
                />
              </View>

              <TouchableOpacity
                style={[
                  contactStyles.sendBtn,
                  (!name || !email || !message) &&
                    contactStyles.sendBtnDisabled,
                ]}
                onPress={handleSend}
                disabled={!name || !email || !message}
              >
                <Text style={contactStyles.sendBtnText}>Send Message →</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  )
}

const contactStyles = StyleSheet.create({
  section: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  inner: {
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row' as any,
    flexWrap: 'wrap' as any,
    gap: 48,
  },
  infoCol: { flex: 1, minWidth: 260 },
  formCol: {
    flex: 1.4,
    minWidth: 280,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 24,
  },
  heading: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 42,
    letterSpacing: -0.8,
    marginBottom: 14,
    marginTop: 8,
  },
  sub: { fontSize: 14, color: '#64748B', lineHeight: 24, marginBottom: 32 },
  contactItems: { gap: 20 },
  contactItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  contactItemIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  contactItemLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  contactItemValue: { fontSize: 13, fontWeight: '600', color: '#1D4ED8' },
  formRow: {
    flexDirection: 'row' as any,
    flexWrap: 'wrap' as any,
    gap: 14,
    marginBottom: 14,
  },
  formField: { flex: 1, minWidth: 180 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 7,
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FAFBFC',
  },
  textarea: { minHeight: 120, paddingTop: 12 },
  sendBtn: {
    backgroundColor: '#1D4ED8',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
  },
  sendBtnDisabled: { backgroundColor: '#93C5FD', shadowOpacity: 0 },
  sendBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  sentBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  sentTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  sentBody: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
})

const TMCConnectLanding: React.FC = () => {
  const scrollViewRef = useRef<ScrollView>(null)
  const width = useWindowWidth()
  const isDesktop = width >= BP.md
  const isWide = width >= BP.lg

  const [learnMoreVisible, setLearnMoreVisible] = useState(false)

  const heroAnim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(heroAnim, {
      toValue: 1,
      duration: 900,
      useNativeDriver: true,
    }).start()
  }, [])

  const handleNavPress = (href: string) => {
    if (Platform.OS !== 'web') return
    const elementId = href.replace('#', '')
    const element = document.getElementById(elementId)
    if (element && scrollViewRef.current) {
      const scrollNode =
        scrollViewRef.current.getScrollableNode() as HTMLElement
      if (scrollNode) {
        const elementRect = element.getBoundingClientRect()
        const scrollRect = scrollNode.getBoundingClientRect()
        const relativeTop =
          elementRect.top - scrollRect.top + scrollNode.scrollTop
        scrollViewRef.current.scrollTo({
          y: relativeTop - NAV_HEIGHT,
          animated: true,
        })
      }
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.navWrapper}>
        {isDesktop ? (
          <DesktopNav onNavPress={handleNavPress} />
        ) : (
          <MobileNav onNavPress={handleNavPress} />
        )}
      </View>

      <LearnMoreModal
        visible={learnMoreVisible}
        onClose={() => setLearnMoreVisible(false)}
      />

      <ScrollView
        ref={scrollViewRef}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <SystemBanner />

        {/* ─── Hero ─── */}
        <View style={[styles.hero, isWide && styles.heroWide]} nativeID='hero'>
          <View style={styles.blob1} />
          <View style={styles.blob2} />

          <Animated.View
            style={[
              styles.heroInner,
              { opacity: heroAnim },
              isWide && styles.heroInnerWide,
            ]}
          >
            <View style={styles.heroBadge}>
              <View style={styles.heroBadgeDot} />
              <Text style={styles.heroBadgeText}>
                Campus Digital Hub · v2.0
              </Text>
            </View>

            <Text
              style={[styles.heroHeadline, isDesktop && styles.heroHeadlineLg]}
            >
              Attendance{'\n'}
              <Text style={styles.heroAccent}>Reimagined</Text>
              {'\n'}for Campus Life.
            </Text>

            <Text style={styles.heroSubtitle}>
              TMC Connect brings QR check-ins, GPS verification, and event
              management into one seamless campus experience — built for
              students and faculty alike.
            </Text>

            <View style={styles.heroCTAs}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleDownload}
              >
                <Text style={styles.primaryBtnText}>Download the App</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => setLearnMoreVisible(true)}
              >
                <Text style={styles.secondaryBtnText}>Learn More ↓</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* App preview card */}
          <View style={[styles.heroCard, isWide && styles.heroCardWide]}>
            <View style={styles.heroCardHeader}>
              <View style={[styles.dot, { backgroundColor: '#FF6B6B' }]} />
              <View style={[styles.dot, { backgroundColor: '#FFE66D' }]} />
              <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.heroCardTitle}>TMC Connect</Text>
            </View>
            <View style={styles.heroCardBody}>
              <View style={styles.cardEventRow}>
                <View style={styles.cardEventDot} />
                <Text style={styles.cardEvent}>Campus TechnoDays 2026</Text>
              </View>
              <View style={styles.cardDivider} />
              <View style={styles.cardStatusRow}>
                <View style={styles.cardStatusBadge}>
                  <Text style={styles.cardStatusText}>✓ Checked In</Text>
                </View>
                <Text style={styles.cardTime}>08:00 AM</Text>
              </View>
              <Text style={styles.cardVenue}>Main Campus, Building A</Text>

              <View style={styles.cardQRBox}>
                {/* Geometric QR representation */}
                <View style={styles.qrGrid}>
                  {[1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1].map(
                    (on, i) => (
                      <View
                        key={i}
                        style={[
                          styles.qrCell,
                          { backgroundColor: on ? '#1D4ED8' : 'transparent' },
                        ]}
                      />
                    )
                  )}
                </View>
                <Text style={styles.cardQRLabel}>
                  Scan to verify attendance
                </Text>
              </View>

              <View style={styles.cardGPSRow}>
                {/* GPS dot */}
                <View style={styles.gpsDot} />
                <Text style={styles.cardGPS}>
                  Location confirmed — Main Campus
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ─── Stats ─── */}
        <View style={styles.statsBanner}>
          {STATS.map((s) => (
            <StatItem key={s.label} {...s} />
          ))}
        </View>

        {/* ─── Features ─── */}
        <View style={styles.section} nativeID='features'>
          <Text style={styles.sectionTag}>Features</Text>
          <Text style={styles.sectionHeading}>
            Everything campus attendance needs
          </Text>
          <Text style={styles.sectionSub}>
            Designed for Philippine campuses — fast, accurate, and resilient
            when the WiFi drops.
          </Text>
          <View
            style={[
              styles.featuresGrid,
              isDesktop && styles.featuresGridDesktop,
            ]}
          >
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} {...f} index={i} />
            ))}
          </View>
        </View>

        {/* ─── How It Works ─── */}
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

        {/* ─── About / CTA ─── */}
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
          <View style={styles.aboutCTARow}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleDownload}
            >
              <Text style={styles.primaryBtnText}>Get TMC Connect →</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => setLearnMoreVisible(true)}
            >
              <Text style={styles.secondaryBtnText}>Learn More</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Contact ─── */}
        <ContactSection />

        {/* ─── Footer ─── */}
        <View style={styles.footer}>
          <Image
            source={require('../assets/images/Logo/TMC-Coonect-V.2.png')}
            style={styles.logoImageBottom}
            resizeMode='contain'
          />
          <Text style={styles.footerTagline}>
            Empowering campus communities through smart attendance technology.
          </Text>
          <View style={styles.footerLinks}>
            <Text style={styles.footerLink} onPress={handleDownload}>
              Download
            </Text>
            <Text style={styles.footerDivider}>·</Text>
            <Text
              style={styles.footerLink}
              onPress={() =>
                Linking.openURL(
                  'https://github.com/CajesJM/CajesJm-tmc-connect'
                )
              }
            >
              GitHub
            </Text>
            <Text style={styles.footerDivider}>·</Text>
            <Text
              style={styles.footerLink}
              onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
            >
              Contact
            </Text>
          </View>
          <Text style={styles.footerCopy}>
            © {new Date().getFullYear()} TMC Connect · All rights reserved
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F7FF' },

  navWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'rgba(240,247,255,0.95)',
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(16px)' } as any) : {}),
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  logoImage: { width: 130, height: 100 },
  logoImageBottom: { width: 160, height: 64 },
  desktopNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: NAV_HEIGHT,
    paddingHorizontal: 48,
  },
  mobileNavContainer: { overflow: 'hidden' },
  mobileNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: NAV_HEIGHT,
    paddingHorizontal: 20,
  },
  navLinks: { flexDirection: 'row', gap: 4 },
  navLinkBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  navLinkText: { color: '#475569', fontSize: 14, fontWeight: '500' },
  navCTA: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  navCTAText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  hamburger: { padding: 8 },
  hamburgerIcon: { width: 24, height: 20, justifyContent: 'space-between' },
  bar: { height: 2.5, backgroundColor: '#1E293B', borderRadius: 2 },
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
  mobileMenuLinkText: { color: '#334155', fontSize: 15, fontWeight: '500' },
  mobileMenuCTA: {
    backgroundColor: '#1D4ED8',
    marginVertical: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: NAV_HEIGHT },

  // Banner
  systemBanner: {
    backgroundColor: '#1D4ED8',
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  bannerBadgeWrap: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  bannerBadge: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bannerText: { color: '#BFDBFE', fontSize: 13, flex: 1 },
  bannerLink: {
    color: '#fff',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  // Hero
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
  heroWide: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 48,
    paddingHorizontal: 64,
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
  heroInner: { maxWidth: 520, alignItems: 'center', zIndex: 1 },
  heroInnerWide: { alignItems: 'flex-start', flex: 1 },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#93C5FD',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 22,
    marginTop: -10,
  },
  heroBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#1D4ED8',
  },
  heroBadgeText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  heroHeadline: {
    fontSize: 40,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 50,
    letterSpacing: -1.5,
    marginBottom: 20,
  },
  heroHeadlineLg: { fontSize: 52, lineHeight: 62, textAlign: 'left' },
  heroAccent: { color: '#1D4ED8' },
  heroSubtitle: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 460,
    marginBottom: 36,
  },
  heroCTAs: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },

  // Buttons
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
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  secondaryBtnText: { color: '#1D4ED8', fontSize: 15, fontWeight: '600' },

  // Hero card
  heroCard: {
    marginTop: 48,
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    zIndex: 1,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  heroCardWide: { marginTop: 0, maxWidth: 340 },
  heroCardHeader: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  heroCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 8,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  heroCardBody: { padding: 18, gap: 10 },
  cardEventRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardEventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1D4ED8',
  },
  cardEvent: { fontSize: 13, fontWeight: '700', color: '#0F172A', flex: 1 },
  cardDivider: { height: 1, backgroundColor: '#F1F5F9' },
  cardStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardStatusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  cardStatusText: { fontSize: 12, color: '#16A34A', fontWeight: '700' },
  cardTime: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  cardVenue: { fontSize: 11, color: '#94A3B8' },
  cardQRBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  qrGrid: { flexDirection: 'row', flexWrap: 'wrap', width: 64, gap: 3 },
  qrCell: { width: 12, height: 12, borderRadius: 2 },
  cardQRLabel: { fontSize: 10, color: '#64748B', fontWeight: '500' },
  cardGPSRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gpsDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
  cardGPS: { fontSize: 11, color: '#16A34A', fontWeight: '600', flex: 1 },

  // Stats
  statsBanner: {
    backgroundColor: '#1D4ED8',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingVertical: 36,
    paddingHorizontal: 24,
    gap: 24,
  },
  statItem: { alignItems: 'center', minWidth: 110 },
  statValue: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    color: '#93C5FD',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },

  // Features
  section: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  sectionTag: {
    color: '#1D4ED8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 30,
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
  featuresGrid: { width: '100%', maxWidth: 960, gap: 16 },
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
    maxWidth: 284,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  featureIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  featureDesc: { fontSize: 13, color: '#64748B', lineHeight: 21 },

  // How it works
  howSection: {
    backgroundColor: '#0F172A',
    paddingVertical: 80,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  howContent: { maxWidth: 560, width: '100%' },
  sectionHeadingLight: {
    fontSize: 30,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.8,
    marginBottom: 40,
  },
  steps: { gap: 0 },
  stepRow: { flexDirection: 'row', gap: 20 },
  stepLeft: { alignItems: 'center', width: 44 },
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
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  stepLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#1E3A5F',
    marginVertical: 4,
    minHeight: 40,
    borderRadius: 1,
  },
  stepContent: { flex: 1, paddingBottom: 36 },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
    lineHeight: 24,
  },
  stepBody: { fontSize: 14, color: '#94A3B8', lineHeight: 22 },

  // About
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
  aboutCTARow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
    zIndex: 1,
  },

  // Footer
  footer: {
    backgroundColor: '#0F172A',
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 12,
  },
  footerTagline: {
    color: '#475569',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 380,
    lineHeight: 22,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  footerLink: { color: '#64748B', fontSize: 13, fontWeight: '600' },
  footerDivider: { color: '#334155', fontSize: 13 },
  footerCopy: { color: '#334155', fontSize: 12 },
})

export default TMCConnectLanding

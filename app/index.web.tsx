import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

const APK_URL =
  'https://github.com/CajesJM/CajesJm-tmc-connect/releases/download/v2.0.1/TMC_Connect_v2.0.1.apk'
const EMAIL = 'developertmcconnect@gmail.com'
const NAV_H = 64
const LOGO = require('../assets/images/Logo/TMC-Coonect-V.2.png')
const HERO_SMOKE = require('../assets/images/landing/blue-smoke-overlay.png')
const HERO_SMOKE_DARK = require('../assets/images/landing/blue-smoke-dark-overlay-v2.png')

type Theme = {
  canvas: string
  ink: string
  slate: string
  mute: string
  faint: string
  line: string
  paper: string
  white: string
  navy: string
  blue: string
  green: string
  greenBg: string
  inputBg: string
  iconChip: string
}

const Light: Theme = {
  canvas: '#FFFFFF',
  ink: '#102443',
  slate: '#344767',
  mute: '#536783',
  faint: '#647995',
  line: '#DCE5F0',
  paper: '#F2F6FB',
  white: '#FFFFFF',
  navy: '#0C2447',
  blue: '#174C94',
  green: '#166C53',
  greenBg: '#E7F5EF',
  inputBg: '#FFFFFF',
  iconChip: '#FFFFFF',
}

const Dark: Theme = {
  canvas: '#000000',
  ink: '#F3F7FC',
  slate: '#D0DEEE',
  mute: '#AABED6',
  faint: '#91A9C6',
  line: '#35445F',
  paper: '#202D44',
  white: '#19263D',
  navy: '#0B152B',
  blue: '#92BFFF',
  green: '#76DDB7',
  greenBg: '#173F3C',
  inputBg: '#102843',
  iconChip: '#173351',
}

type Mode = 'light' | 'dark'
type ThemeViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> }
}

const web = Platform.OS === 'web'
const F = {
  body: web
    ? { fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif" }
    : {},
  display: web
    ? { fontFamily: "'Manrope', 'DM Sans', system-ui, sans-serif" }
    : {},
} as any

type Icon = React.ComponentProps<typeof Ionicons>['name']

const NAV = [
  { label: 'Features', id: 'features' },
  { label: 'How it works', id: 'how-it-works' },
  { label: 'FAQ', id: 'faq' },
  { label: 'Contact', id: 'contact' },
]

const PROOF: { value: string; label: string }[] = [
  {
    value: 'QR + GPS verification',
    label: 'Each check-in pairs a scan with a location match.',
  },
  {
    value: 'Real-time records',
    label: 'Attendance syncs to Firestore as it happens.',
  },
  {
    value: 'Offline-tolerant',
    label: 'Check-ins queue when campus WiFi drops.',
  },
]

const FEATURES: { icon: Icon; title: string; body: string }[] = [
  {
    icon: 'location-outline',
    title: 'GPS verification',
    body: 'Confirm the device is at the venue before a check-in counts.',
  },
  {
    icon: 'qr-code-outline',
    title: 'QR check-in',
    body: 'One scan per event. No sign-up sheets passed down the row.',
  },
  {
    icon: 'calendar-outline',
    title: 'Event publishing',
    body: 'Departments and orgs post events with date, venue, and capacity.',
  },
  {
    icon: 'key-outline',
    title: 'Role-based access',
    body: 'Separate views for students, organizers, and administrators.',
  },
  {
    icon: 'document-text-outline',
    title: 'Attendance exports',
    body: 'Organizers pull per-event records without manual tallying.',
  },
  {
    icon: 'phone-portrait-outline',
    title: 'Android and web',
    body: 'Native app for check-ins, web access for review and admin.',
  },
]

const STEPS = [
  {
    n: '01',
    title: 'Register for the event',
    body: 'Students browse the feed and register. Organizers see headcount in advance.',
  },
  {
    n: '02',
    title: 'Scan on arrival',
    body: 'Scan the event QR at the venue. The app checks GPS against the event location.',
  },
  {
    n: '03',
    title: 'Record is saved',
    body: 'Attendance lands in Firestore immediately and appears in the organizer report.',
  },
]

const ROLES: { icon: Icon; who: string; blurb: string; points: string[] }[] = [
  {
    icon: 'school-outline',
    who: 'Students',
    blurb: 'One place for events and attendance history.',
    points: [
      'Browse events by department or org',
      'Register in one tap',
      'Check in with QR + location',
      'Review personal attendance record',
    ],
  },
  {
    icon: 'clipboard-outline',
    who: 'Faculty and organizers',
    blurb: 'Publish events and close out attendance the same day.',
    points: [
      'Create events with venue coordinates',
      'Monitor check-ins during the event',
      'Export attendance per event',
      'Send announcements to registrants',
    ],
  },
  {
    icon: 'shield-outline',
    who: 'Administrators',
    blurb: 'Oversight across departments without spreadsheets.',
    points: [
      'Manage users and roles',
      'Review events across departments',
      'Audit attendance records',
      'Configure system settings',
    ],
  },
]

const FAQ = [
  {
    q: 'What happens if the WiFi drops during check-in?',
    a: 'Check-ins are queued on the device and synced to Firestore when the connection returns. Organizers see the final record, not a failed attempt.',
  },
  {
    q: 'Why does the app request location?',
    a: 'Location is read once at check-in and compared against the event venue coordinates. It is not tracked in the background.',
  },
  {
    q: 'Who can create events?',
    a: 'Faculty accounts and approved organizers. Each event carries a venue, schedule, and organizer so records stay auditable.',
  },
  {
    q: 'How do I get an account?',
    a: 'Student accounts use a TMC email. If your department provisions accounts centrally, use the credentials they issue, then sign in on Android or web.',
  },
  {
    q: 'Which devices are supported?',
    a: 'Android for on-site check-in (v2.0.1 APK linked below) and any modern browser for browsing events and admin work. iOS builds ship via EAS on request.',
  },
]

const useWidth = () => {
  const [w, setW] = useState(Dimensions.get('window').width)
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) =>
      setW(window.width)
    )
    return () => sub?.remove()
  }, [])
  return w
}

const Wrap: React.FC<{ children: React.ReactNode; style?: any }> = ({
  children,
  style,
}) => (
  <View style={[{ width: '100%', maxWidth: 1120, alignSelf: 'center' }, style]}>
    {children}
  </View>
)

const ScrollReveal: React.FC<{
  children: React.ReactNode
  id: string
  reduceMotion: boolean
}> = ({ children, id, reduceMotion }) => {
  const progress = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current

  useEffect(() => {
    if (reduceMotion || !web || !('IntersectionObserver' in window)) {
      progress.setValue(1)
      return
    }

    const element = document.getElementById(id)
    if (!element) {
      progress.setValue(1)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        Animated.timing(progress, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start()
        observer.disconnect()
      },
      { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [id, progress, reduceMotion])

  return (
    <Animated.View
      nativeID={id}
      style={{
        opacity: progress,
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [22, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  )
}

type Ctx = { T: Theme; s: ReturnType<typeof makeStyles> }

const Eyebrow: React.FC<Ctx & { children: string }> = ({ T, s, children }) => (
  <Text style={[s.eyebrow, F.body, { color: T.blue }]}>{children}</Text>
)

const Btn: React.FC<
  Ctx & {
    label: string
    icon?: Icon
    onPress: () => void
    variant?: 'primary' | 'secondary'
  }
> = ({ T, s, label, icon, onPress, variant = 'primary' }) => (
  <TouchableOpacity
    accessibilityRole='button'
    onPress={onPress}
    style={[s.btn, variant === 'primary' ? s.btnPrimary : s.btnSecondary]}
  >
    {icon ? (
      <Ionicons
        name={icon}
        size={17}
        color={variant === 'primary' ? '#FFFFFF' : T.ink}
      />
    ) : null}
    <Text
      style={[
        s.btnText,
        F.body,
        { color: variant === 'primary' ? '#FFFFFF' : T.ink },
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
)

const ThemeToggle: React.FC<Ctx & { mode: Mode; onToggle: () => void }> = ({
  T,
  s,
  mode,
  onToggle,
}) => (
  <TouchableOpacity
    testID='theme-toggle'
    accessibilityRole='button'
    accessibilityLabel={
      mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
    }
    onPress={onToggle}
    activeOpacity={0.85}
    style={s.themeToggle}
  >
    <View style={s.themeToggleSurface}>
      <Ionicons
        name={mode === 'dark' ? 'sunny-outline' : 'moon-outline'}
        size={17}
        color={T.slate}
      />
    </View>
  </TouchableOpacity>
)

const EventCard: React.FC<Ctx & { wide: boolean }> = ({ T, s, wide }) => (
  <View style={s.eventCard}>
    <View style={s.eventTop}>
      <View style={s.traffic}>
        <View style={[s.dot, { backgroundColor: T.line }]} />
        <View style={[s.dot, { backgroundColor: T.line }]} />
        <View style={[s.dot, { backgroundColor: T.line }]} />
      </View>
      <Text style={[s.eventTopText, F.body]}>TMC Connect — Student</Text>
    </View>
    <View style={s.eventBody}>
      <View style={[s.eventMain, { flexDirection: wide ? 'row' : 'column' }]}>
        <View style={[s.eventDetails, wide && s.eventDetailsWide]}>
          <View>
            <Text style={[s.eventKicker, F.body]}>TODAY · MAIN CAMPUS</Text>
            <Text style={[s.eventTitle, F.display]}>
              Campus Technodays 2026
            </Text>
            <Text style={[s.eventMeta, F.body]}>
              Building A · 8:00 AM – 5:00 PM
            </Text>
          </View>
        </View>

        <View style={wide && s.eventCheckinWide}>
          <View style={s.qrBox}>
            <Ionicons
              name='qr-code-outline'
              size={wide ? 68 : 56}
              color={T.ink}
            />
            <Text style={[s.qrCaption, F.body]}>Event QR verified</Text>
          </View>
          <View style={s.statusRow}>
            <View style={s.statusPill}>
              <Ionicons name='checkmark-circle' size={16} color={T.blue} />
              <Text style={[s.statusText, F.body]}>Checked in · 8:02 AM</Text>
            </View>
          </View>
          <View style={s.locRow}>
            <Ionicons name='location-sharp' size={14} color={T.blue} />
            <Text style={[s.locText, F.body]}>
              Location match · Main Campus
            </Text>
          </View>
        </View>
      </View>
    </View>
  </View>
)

const Faq: React.FC<Ctx> = ({ T, s }) => {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <View style={{ width: '100%' }}>
      {FAQ.map((f, i) => {
        const isOpen = open === i
        return (
          <View key={f.q} style={s.faqItem}>
            <Pressable
              style={s.faqHead}
              onPress={() => setOpen(isOpen ? null : i)}
              accessibilityRole='button'
            >
              <Text style={[s.faqQ, F.body]}>{f.q}</Text>
              <Ionicons
                name={isOpen ? 'remove' : 'add'}
                size={20}
                color={T.slate}
              />
            </Pressable>
            {isOpen ? <Text style={[s.faqA, F.body]}>{f.a}</Text> : null}
          </View>
        )
      })}
    </View>
  )
}

const Contact: React.FC<Ctx> = ({ T, s }) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [sent, setSent] = useState(false)
  const ready = !!(name.trim() && email.trim() && msg.trim())

  const send = () => {
    const subject = encodeURIComponent(`TMC Connect inquiry from ${name}`)
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${msg}`)
    Linking.openURL(`mailto:${EMAIL}?subject=${subject}&body=${body}`).catch(
      console.error
    )
    setSent(true)
    setTimeout(() => setSent(false), 4000)
  }

  return (
    <View style={[s.sectionPaper]} nativeID='contact'>
      <Wrap
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 48,
        }}
      >
        <View style={{ flex: 1, minWidth: 260 }}>
          <Eyebrow T={T} s={s}>
            Contact
          </Eyebrow>
          <Text style={[s.h2, F.body, { textAlign: 'left' }]}>
            Report an issue or request access
          </Text>
          <Text style={[s.sub, F.body, { textAlign: 'left' }]}>
            Messages open in your email client and go directly to the
            maintainer.
          </Text>

          <Pressable
            style={s.contactRow}
            onPress={() => Linking.openURL(`mailto:${EMAIL}`)}
          >
            <Ionicons name='mail-outline' size={18} color={T.slate} />
            <View style={{ flex: 1 }}>
              <Text style={[s.contactLabel, F.body]}>Email</Text>
              <Text style={[s.contactValue, F.body]}>{EMAIL}</Text>
            </View>
          </Pressable>
          <Pressable
            style={s.contactRow}
            onPress={() =>
              Linking.openURL('https://github.com/CajesJM/CajesJm-tmc-connect')
            }
          >
            <Ionicons name='logo-github' size={18} color={T.slate} />
            <View style={{ flex: 1 }}>
              <Text style={[s.contactLabel, F.body]}>Releases and source</Text>
              <Text style={[s.contactValue, F.body]}>
                CajesJM / CajesJm-tmc-connect
              </Text>
            </View>
          </Pressable>

          <View style={s.reqBox}>
            <Text style={[s.reqTitle, F.body]}>Before you install</Text>
            {[
              'Android 8.0 or later',
              'Location permission granted at check-in',
              'TMC email or provisioned account',
            ].map((r) => (
              <View key={r} style={s.reqRow}>
                <Ionicons name='checkmark' size={15} color={T.green} />
                <Text style={[s.reqText, F.body]}>{r}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.form}>
          {sent ? (
            <View style={{ alignItems: 'flex-start', paddingVertical: 24 }}>
              <Ionicons name='checkmark-circle' size={32} color={T.green} />
              <Text style={[s.formTitle, F.body, { marginTop: 12 }]}>
                Your email app should be open
              </Text>
              <Text style={[s.formSub, F.body]}>
                Press send there to deliver the message.
              </Text>
            </View>
          ) : (
            <>
              <Text style={[s.formTitle, F.body]}>Send a message</Text>
              <Text style={[s.formSub, F.body]}>
                Typically replies within 2–3 working days.
              </Text>
              <View style={{ height: 18 }} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                <View style={{ flex: 1, minWidth: 170 }}>
                  <Text style={[s.label, F.body]}>Name</Text>
                  <TextInput
                    style={[s.input, F.body]}
                    placeholder='Juan dela Cruz'
                    placeholderTextColor={T.faint}
                    value={name}
                    onChangeText={setName}
                  />
                </View>
                <View style={{ flex: 1, minWidth: 170 }}>
                  <Text style={[s.label, F.body]}>Email</Text>
                  <TextInput
                    style={[s.input, F.body]}
                    placeholder='juan@tmc.edu.ph'
                    placeholderTextColor={T.faint}
                    keyboardType='email-address'
                    autoCapitalize='none'
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>
              <View style={{ height: 12 }} />
              <Text style={[s.label, F.body]}>Message</Text>
              <TextInput
                style={[s.input, F.body, { minHeight: 112, paddingTop: 10 }]}
                placeholder='Describe the issue or request…'
                placeholderTextColor={T.faint}
                multiline
                textAlignVertical='top'
                value={msg}
                onChangeText={setMsg}
              />
              <View style={{ height: 16 }} />
              <TouchableOpacity
                style={[
                  s.btn,
                  s.btnPrimary,
                  { justifyContent: 'center' },
                  !ready && { opacity: 0.45 },
                ]}
                disabled={!ready}
                onPress={send}
              >
                <Text style={[s.btnText, F.body, { color: '#FFFFFF' }]}>
                  Send message
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Wrap>
    </View>
  )
}

const TMCConnectLanding: React.FC = () => {
  const width = useWidth()
  const wide = width >= 960
  const desktop = width >= 768
  const [menu, setMenu] = useState(false)
  const themeTransitioning = useRef(false)
  const heroEntrance = useRef(new Animated.Value(0)).current
  const previewEntrance = useRef(new Animated.Value(0)).current
  const [reduceMotion, setReduceMotion] = useState(() =>
    Boolean(
      web &&
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    )
  )
  const [mode, setMode] = useState<Mode>(() => {
    if (!web) return 'light'
    try {
      const saved = localStorage.getItem('tmc-theme')
      if (saved === 'light' || saved === 'dark') return saved
    } catch {}
    try {
      if (window.matchMedia?.('(prefers-color-scheme: dark)').matches)
        return 'dark'
    } catch {}
    return 'light'
  })

  const T = mode === 'dark' ? Dark : Light
  const heroSmokeOpacity = mode === 'dark' ? 0.34 : 0.26
  const s = makeStyles(T)
  const toggle = async () => {
    if (themeTransitioning.current) return
    const nextMode = mode === 'dark' ? 'light' : 'dark'
    if (!web || reduceMotion) {
      setMode(nextMode)
      return
    }

    const button = document.querySelector('[data-testid="theme-toggle"]')
    const bounds = button?.getBoundingClientRect()
    const x = bounds ? bounds.left + bounds.width / 2 : window.innerWidth / 2
    const y = bounds ? bounds.top + bounds.height / 2 : 0
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )
    const root = document.documentElement
    const applyMode = () => {
      const background = nextMode === 'dark' ? Dark.canvas : Light.canvas
      root.style.backgroundColor = background
      document.body.style.backgroundColor = background
      flushSync(() => setMode(nextMode))
    }

    themeTransitioning.current = true
    root.style.setProperty('--theme-origin-x', `${x}px`)
    root.style.setProperty('--theme-origin-y', `${y}px`)
    root.style.setProperty('--theme-reveal-radius', `${radius}px`)
    root.classList.add('tmc-theme-changing')

    let fallbackReveal: HTMLDivElement | null = null
    try {
      const transitionDocument = document as ThemeViewTransitionDocument
      if (transitionDocument.startViewTransition) {
        await transitionDocument.startViewTransition(applyMode).finished
      } else {
        fallbackReveal = document.createElement('div')
        fallbackReveal.style.position = 'fixed'
        fallbackReveal.style.inset = '0'
        fallbackReveal.style.zIndex = '1000'
        fallbackReveal.style.pointerEvents = 'none'
        fallbackReveal.style.backgroundColor =
          nextMode === 'dark' ? Dark.canvas : Light.canvas
        fallbackReveal.style.clipPath = `circle(0 at ${x}px ${y}px)`
        fallbackReveal.style.opacity = '0.5'
        fallbackReveal.setAttribute('aria-hidden', 'true')
        document.body.appendChild(fallbackReveal)
        applyMode()
        await fallbackReveal.animate(
          [
            { clipPath: `circle(0 at ${x}px ${y}px)`, opacity: 0.5 },
            { clipPath: `circle(${radius}px at ${x}px ${y}px)`, opacity: 0 },
          ],
          { duration: 680, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
        ).finished
      }
    } catch (error) {
      console.error('Theme transition failed', error)
      applyMode()
    } finally {
      fallbackReveal?.remove()
      root.classList.remove('tmc-theme-changing')
      root.style.removeProperty('--theme-origin-x')
      root.style.removeProperty('--theme-origin-y')
      root.style.removeProperty('--theme-reveal-radius')
      themeTransitioning.current = false
    }
  }

  useEffect(() => {
    if (!web) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href =
      'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap'
    document.head.appendChild(link)
    return () => {
      if (document.head.contains(link)) document.head.removeChild(link)
    }
  }, [])

  useEffect(() => {
    if (!web) return
    const style = document.createElement('style')
    style.textContent = `
      [data-testid="landing-nav"] {
        -webkit-backdrop-filter: blur(16px);
        backdrop-filter: blur(16px);
      }
      ::view-transition-old(root), ::view-transition-new(root) {
        animation: none;
        mix-blend-mode: normal;
      }
      ::view-transition-old(root) { z-index: 1; }
      html.tmc-theme-changing::view-transition-new(root) {
        z-index: 2;
        animation: tmc-theme-reveal 680ms cubic-bezier(0.16, 1, 0.3, 1) both;
      }
      @keyframes tmc-theme-reveal {
        from {
          clip-path: circle(0 at var(--theme-origin-x) var(--theme-origin-y));
          opacity: 0.58;
        }
        to {
          clip-path: circle(var(--theme-reveal-radius) at var(--theme-origin-x) var(--theme-origin-y));
          opacity: 1;
        }
      }
    `
    document.head.appendChild(style)
    return () => style.remove()
  }, [])

  useEffect(() => {
    if (!web) return
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setReduceMotion(preference.matches)
    updatePreference()
    preference.addEventListener?.('change', updatePreference)
    return () => preference.removeEventListener?.('change', updatePreference)
  }, [])

  useEffect(() => {
    if (reduceMotion) {
      heroEntrance.setValue(1)
      previewEntrance.setValue(1)
      return
    }
    const entrance = Animated.parallel([
      Animated.timing(heroEntrance, {
        toValue: 1,
        duration: 620,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(previewEntrance, {
        toValue: 1,
        delay: 180,
        duration: 740,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ])
    entrance.start()
    return () => entrance.stop()
  }, [heroEntrance, previewEntrance, reduceMotion])

  useEffect(() => {
    if (!web) return
    try {
      localStorage.setItem('tmc-theme', mode)
    } catch {}
    try {
      document.documentElement.style.backgroundColor = T.canvas
      document.body.style.backgroundColor = T.canvas
    } catch {}
  }, [mode, T.white])

  const goTo = (id: string) => {
    setMenu(false)
    if (!web) return
    document.getElementById(id)?.scrollIntoView({
      behavior: reduceMotion ? 'instant' : 'smooth',
    })
  }

  const download = () => Linking.openURL(APK_URL).catch(console.error)

  return (
    <View style={{ flex: 1, backgroundColor: T.canvas }}>
      {/* Nav */}
      <View testID='landing-nav' style={s.nav}>
        <View style={s.navBar}>
          <Pressable
            onPress={() => {
              if (web) window.scrollTo?.({ top: 0, behavior: 'smooth' })
            }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
          >
            <Image
              source={LOGO}
              style={{ width: 52, height: 48 }}
              resizeMode='contain'
            />
            <Text style={[s.wordmark, F.display]}>TMC Connect</Text>
          </Pressable>
          {desktop ? (
            <>
              <View style={{ flexDirection: 'row', gap: 2 }}>
                {NAV.map((n) => (
                  <TouchableOpacity
                    key={n.id}
                    onPress={() => goTo(n.id)}
                    style={{ paddingHorizontal: 12, paddingVertical: 8 }}
                  >
                    <Text style={[s.navLink, F.body]}>{n.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                <ThemeToggle T={T} s={s} mode={mode} onToggle={toggle} />
                <Btn
                  T={T}
                  s={s}
                  label='Download APK'
                  icon='logo-android'
                  onPress={download}
                />
              </View>
            </>
          ) : (
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <ThemeToggle T={T} s={s} mode={mode} onToggle={toggle} />
              <TouchableOpacity
                onPress={() => setMenu(!menu)}
                accessibilityLabel='Toggle menu'
                style={{ padding: 8 }}
              >
                <Ionicons
                  name={menu ? 'close' : 'menu'}
                  size={24}
                  color={T.ink}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
        {!desktop && menu ? (
          <View style={s.mobileMenu}>
            {NAV.map((n) => (
              <TouchableOpacity
                key={n.id}
                onPress={() => goTo(n.id)}
                style={s.mobileLink}
              >
                <Text style={[s.navLink, F.body, { fontSize: 15 }]}>
                  {n.label}
                </Text>
              </TouchableOpacity>
            ))}
            <View style={{ paddingVertical: 12 }}>
              <Btn T={T} s={s} label='Download APK' onPress={download} />
            </View>
          </View>
        ) : null}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: NAV_H }}
      >
        {/* Hero */}
        <View style={[s.hero, { backgroundColor: T.canvas }]}>
          <Image
            source={mode === 'dark' ? HERO_SMOKE_DARK : HERO_SMOKE}
            style={[
              s.heroSmoke,
              { opacity: wide ? heroSmokeOpacity : heroSmokeOpacity * 0.65 },
            ]}
            resizeMode={wide ? 'stretch' : 'cover'}
            accessible={false}
          />
          <Wrap style={{ alignItems: 'center' }}>
            <Animated.View
              style={[
                s.heroContent,
                {
                  opacity: heroEntrance,
                  transform: [
                    {
                      translateY: heroEntrance.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={s.badge}>
                <View style={s.badgeDot} />
                <Text style={[s.badgeText, F.body]}>
                  v2.0 · Android build available
                </Text>
              </View>
              <Text style={[s.h1, F.display, !wide && s.h1Mobile]}>
                Campus attendance without the paper sheets.
              </Text>
              <Text style={[s.lead, F.body]}>
                TMC Connect records event attendance with a QR scan backed by
                GPS. Students check in from their phones. Organizers get a clean
                record in Firestore — no tallying.
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: 10,
                }}
              >
                <Btn
                  T={T}
                  s={s}
                  label='Download for Android'
                  icon='logo-android'
                  onPress={download}
                />
                <Btn
                  T={T}
                  s={s}
                  label='See how it works'
                  variant='secondary'
                  onPress={() => goTo('how-it-works')}
                />
              </View>
              <Text style={[s.heroMeta, F.body]}>
                v2.0.1 · APK via GitHub · Free for TMC use
              </Text>
            </Animated.View>
            <Animated.View
              style={[
                s.heroVisual,
                {
                  opacity: previewEntrance,
                  transform: [
                    {
                      translateY: previewEntrance.interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <EventCard T={T} s={s} wide={width >= 800} />
            </Animated.View>
          </Wrap>
        </View>

        {/* Proof strip */}
        <View style={s.strip}>
          <ScrollReveal id='proof-reveal' reduceMotion={reduceMotion}>
            <Wrap
              style={{
                flexDirection: wide ? 'row' : 'column',
                gap: wide ? 40 : 20,
              }}
            >
              {PROOF.map((x, i) => (
                <View
                  key={x.value}
                  style={[
                    { flex: 1 },
                    wide &&
                      i > 0 && {
                        borderLeftWidth: 1,
                        borderLeftColor: T.line,
                        paddingLeft: 40,
                      },
                  ]}
                >
                  <Text style={[s.stripValue, F.body]}>{x.value}</Text>
                  <Text style={[s.stripLabel, F.body]}>{x.label}</Text>
                </View>
              ))}
            </Wrap>
          </ScrollReveal>
        </View>

        {/* Features */}
        <View style={s.sectionPaper} nativeID='features'>
          <ScrollReveal id='features-reveal' reduceMotion={reduceMotion}>
            <Wrap>
              <View style={{ maxWidth: 640 }}>
                <Eyebrow T={T} s={s}>
                  Features
                </Eyebrow>
                <Text style={[s.h2, F.body, { textAlign: 'left' }]}>
                  Built to hold up on event day
                </Text>
                <Text style={[s.sub, F.body, { textAlign: 'left' }]}>
                  The parts that matter when 200 students arrive at once: fast
                  check-in, verifiable presence, and records you can audit.
                </Text>
              </View>
              <View style={{ height: 32 }} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
                {FEATURES.map((f) => (
                  <View key={f.title} style={[s.card, s.raisedCard]}>
                    <View style={[s.cardIcon, s.accentIcon]}>
                      <Ionicons name={f.icon} size={20} color={T.blue} />
                    </View>
                    <Text style={[s.cardTitle, F.body]}>{f.title}</Text>
                    <Text style={[s.cardBody, F.body]}>{f.body}</Text>
                  </View>
                ))}
              </View>
            </Wrap>
          </ScrollReveal>
        </View>

        {/* How it works */}
        <View style={s.sectionWhite} nativeID='how-it-works'>
          <ScrollReveal id='steps-reveal' reduceMotion={reduceMotion}>
            <Wrap>
              <View style={{ maxWidth: 640 }}>
                <Eyebrow T={T} s={s}>
                  How it works
                </Eyebrow>
                <Text style={[s.h2, F.body, { textAlign: 'left' }]}>
                  Three steps, no paperwork
                </Text>
              </View>
              <View style={{ height: 32 }} />
              <View
                style={{
                  flexDirection: wide ? 'row' : 'column',
                  gap: wide ? 32 : 24,
                }}
              >
                {STEPS.map((st) => (
                  <View key={st.n} style={{ flex: 1 }}>
                    <View style={s.stepTop}>
                      <Text style={[s.stepN, F.body]}>{st.n}</Text>
                    </View>
                    <Text style={[s.stepTitle, F.body]}>{st.title}</Text>
                    <Text style={[s.stepBody, F.body]}>{st.body}</Text>
                  </View>
                ))}
              </View>
            </Wrap>
          </ScrollReveal>
        </View>

        {/* Roles */}
        <View style={s.sectionPaper} nativeID='about'>
          <ScrollReveal id='roles-reveal' reduceMotion={reduceMotion}>
            <Wrap>
              <View style={{ maxWidth: 640 }}>
                <Eyebrow T={T} s={s}>
                  Who it&apos;s for
                </Eyebrow>
                <Text style={[s.h2, F.body, { textAlign: 'left' }]}>
                  One system, three views
                </Text>
                <Text style={[s.sub, F.body, { textAlign: 'left' }]}>
                  Started as a thesis project to replace sign-up sheets. Now
                  open to every department and student organization.
                </Text>
              </View>
              <View style={{ height: 32 }} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
                {ROLES.map((a) => (
                  <View key={a.who} style={[s.card, s.raisedCard]}>
                    <View style={[s.cardIcon, s.accentIcon]}>
                      <Ionicons name={a.icon} size={20} color={T.blue} />
                    </View>
                    <Text style={[s.cardTitle, F.body]}>{a.who}</Text>
                    <Text style={[s.roleBlurb, F.body]}>{a.blurb}</Text>
                    <View style={{ height: 12 }} />
                    {a.points.map((p) => (
                      <View key={p} style={s.checkRow}>
                        <Ionicons
                          name='checkmark'
                          size={15}
                          color={T.green}
                          style={{ marginTop: 3 }}
                        />
                        <Text style={[s.cardBody, F.body, { flex: 1 }]}>
                          {p}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </Wrap>
          </ScrollReveal>
        </View>

        {/* FAQ */}
        <View style={s.sectionWhite} nativeID='faq'>
          <ScrollReveal id='faq-reveal' reduceMotion={reduceMotion}>
            <Wrap
              style={{
                flexDirection: wide ? 'row' : 'column',
                gap: wide ? 64 : 24,
                alignItems: wide ? 'flex-start' : 'stretch',
              }}
            >
              <View style={{ flex: wide ? 0.85 : 1 }}>
                <Eyebrow T={T} s={s}>
                  FAQ
                </Eyebrow>
                <Text style={[s.h2, F.body, { textAlign: 'left' }]}>
                  Common questions
                </Text>
                <Text style={[s.sub, F.body, { textAlign: 'left' }]}>
                  Can&apos;t find an answer?{' '}
                  <Text
                    style={{ color: T.blue, fontWeight: '600' }}
                    onPress={() => goTo('contact')}
                  >
                    Send a message
                  </Text>
                  .
                </Text>
              </View>
              <View style={{ flex: 1.4 }}>
                <Faq T={T} s={s} />
              </View>
            </Wrap>
          </ScrollReveal>
        </View>

        <Contact T={T} s={s} />

        {/* Footer */}
        <View style={s.footer}>
          <Wrap>
            <View
              style={{
                flexDirection: wide ? 'row' : 'column',
                justifyContent: 'space-between',
                gap: 24,
              }}
            >
              <View style={{ maxWidth: 340 }}>
                <Text style={[s.footText, F.body]}>
                  QR + GPS attendance for TMC campus events.
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 40 }}>
                <View style={{ gap: 10 }}>
                  <Text style={[s.footHead, F.body]}>Product</Text>
                  <Text style={[s.footLink, F.body]} onPress={download}>
                    Download APK
                  </Text>
                  <Text
                    style={[s.footLink, F.body]}
                    onPress={() => goTo('features')}
                  >
                    Features
                  </Text>
                  <Text
                    style={[s.footLink, F.body]}
                    onPress={() => goTo('faq')}
                  >
                    FAQ
                  </Text>
                </View>
                <View style={{ gap: 10 }}>
                  <Text style={[s.footHead, F.body]}>Project</Text>
                  <Text
                    style={[s.footLink, F.body]}
                    onPress={() =>
                      Linking.openURL(
                        'https://github.com/CajesJM/CajesJm-tmc-connect'
                      )
                    }
                  >
                    GitHub
                  </Text>
                  <Text
                    style={[s.footLink, F.body]}
                    onPress={() => Linking.openURL(`mailto:${EMAIL}`)}
                  >
                    Contact
                  </Text>
                </View>
              </View>
            </View>
            <View style={s.footBottom}>
              <Text style={[s.footSmall, F.body]}>
                © {new Date().getFullYear()} TMC Connect · v2.0.1
              </Text>
              <Text style={[s.footSmall, F.body]}>
                Expo · Firebase · Firestore
              </Text>
            </View>
          </Wrap>
        </View>
      </ScrollView>
    </View>
  )
}

const makeStyles = (T: Theme) =>
  StyleSheet.create({
    nav: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      backgroundColor:
        T.white === '#FFFFFF' ? 'rgba(255,255,255,0.78)' : 'rgba(0,0,0,0.78)',
    },
    navBar: {
      height: NAV_H,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      width: '100%',
      maxWidth: 1200,
      alignSelf: 'center',
    },
    navLink: { color: T.slate, fontSize: 14, fontWeight: '600' },
    wordmark: {
      color: T.ink,
      fontSize: 17,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    mobileMenu: {
      paddingHorizontal: 24,
      backgroundColor: T.canvas,
      borderTopWidth: 1,
      borderTopColor: T.line,
    },
    mobileLink: {
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: T.line,
    },
    themeToggle: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    themeToggleSurface: {
      width: 38,
      height: 38,
      borderRadius: 19,
      borderWidth: 1,
      borderColor: T.line,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: T.white,
      boxShadow:
        T.white === '#FFFFFF'
          ? '0 3px 0 #D7E0EC, 0 6px 12px rgba(15,35,65,0.14), inset 0 1px 0 rgba(255,255,255,0.95)'
          : '0 3px 0 #081225, 0 6px 12px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.12)',
    },

    hero: {
      paddingTop: 64,
      paddingBottom: 84,
      paddingHorizontal: 24,
      overflow: 'hidden',
    },
    heroSmoke: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
    },
    heroContent: {
      width: '100%',
      maxWidth: 850,
      alignItems: 'center',
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'center',
      gap: 8,
      backgroundColor: T.white === '#FFFFFF' ? T.white : 'rgba(25,38,61,0.72)',
      borderWidth: 1,
      borderColor: T.line,
      borderRadius: 24,
      paddingHorizontal: 14,
      paddingVertical: 9,
      marginBottom: 22,
    },
    badgeDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: T.green,
    },
    badgeText: { fontSize: 13, fontWeight: '700', color: T.slate },
    h1: {
      fontSize: 64,
      lineHeight: 72,
      fontWeight: '800',
      color: T.ink,
      letterSpacing: -3,
      marginBottom: 20,
      maxWidth: 850,
      textAlign: 'center',
    },
    h1Mobile: { fontSize: 38, lineHeight: 45, letterSpacing: -1.6 },
    lead: {
      fontSize: 18,
      lineHeight: 30,
      color: T.white === '#FFFFFF' ? T.mute : T.slate,
      maxWidth: 690,
      marginBottom: 28,
      textAlign: 'center',
    },
    heroMeta: {
      fontSize: 13,
      color: T.mute,
      marginTop: 18,
      textAlign: 'center',
    },
    heroVisual: {
      width: '100%',
      maxWidth: 900,
      marginTop: 44,
      alignItems: 'center',
    },

    btn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      minHeight: 46,
      paddingHorizontal: 20,
      paddingVertical: 13,
      borderRadius: 12,
    },
    btnPrimary: {
      backgroundColor: T.white === '#FFFFFF' ? '#174C94' : '#2075CF',
    },
    btnSecondary: {
      borderWidth: 1,
      borderColor: T.line,
      backgroundColor: T.white === '#FFFFFF' ? T.white : 'rgba(11,21,43,0.42)',
    },
    btnText: { fontSize: 14, fontWeight: '600' },

    eventCard: {
      width: '100%',
      maxWidth: 900,
      backgroundColor: T.canvas === '#000000' ? '#0C0C0C' : T.white,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: T.canvas === '#000000' ? '#303030' : T.line,
      overflow: 'hidden',
      elevation: 8,
      boxShadow:
        T.white === '#FFFFFF'
          ? '0 18px 48px rgba(16,36,67,0.16), 0 3px 10px rgba(16,36,67,0.08)'
          : '0 20px 48px rgba(0,0,0,0.42), 0 4px 12px rgba(0,0,0,0.22)',
    },
    eventTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 24,
      paddingVertical: 14,
      backgroundColor: T.canvas === '#000000' ? '#1B1B1B' : T.paper,
      borderBottomWidth: 1,
      borderBottomColor: T.canvas === '#000000' ? '#303030' : T.line,
    },
    traffic: { flexDirection: 'row', gap: 6 },
    dot: { width: 9, height: 9, borderRadius: 5 },
    eventTopText: { fontSize: 13, fontWeight: '600', color: T.slate },
    eventBody: { padding: 28 },
    eventMain: { gap: 28 },
    eventDetails: { justifyContent: 'center' },
    eventDetailsWide: { flex: 1 },
    eventCheckinWide: { flex: 1.05 },
    eventKicker: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1,
      color: T.faint,
      marginBottom: 8,
    },
    eventTitle: {
      fontSize: 28,
      lineHeight: 35,
      fontWeight: '800',
      color: T.ink,
      letterSpacing: -0.8,
    },
    eventMeta: { fontSize: 14, color: T.mute, marginTop: 10 },
    qrBox: {
      alignItems: 'center',
      gap: 8,
      justifyContent: 'center',
      minHeight: 170,
      paddingVertical: 22,
      backgroundColor: T.canvas === '#000000' ? '#1B1B1B' : T.paper,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: T.canvas === '#000000' ? '#303030' : T.line,
      borderStyle: 'dashed',
    },
    qrCaption: { fontSize: 12, fontWeight: '600', color: T.slate },
    statusRow: { marginTop: 14 },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: T.canvas === '#000000' ? '#15283B' : '#E7F1FE',
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    statusText: { color: T.blue, fontSize: 13, fontWeight: '600' },
    locRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 10,
    },
    locText: { fontSize: 12, color: T.blue, fontWeight: '500' },
    strip: {
      backgroundColor: T.canvas,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: T.line,
      paddingVertical: 40,
      paddingHorizontal: 24,
    },
    stripValue: { color: T.ink, fontSize: 16, fontWeight: '800' },
    stripLabel: {
      color: T.mute,
      fontSize: 13,
      lineHeight: 20,
      marginTop: 4,
      maxWidth: 320,
    },

    sectionPaper: {
      backgroundColor: T.canvas,
      paddingVertical: 88,
      paddingHorizontal: 24,
    },
    sectionWhite: {
      backgroundColor: T.canvas,
      paddingVertical: 88,
      paddingHorizontal: 24,
    },
    eyebrow: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      marginBottom: 12,
    },
    h2: {
      fontSize: 34,
      lineHeight: 43,
      fontWeight: '800',
      color: T.ink,
      letterSpacing: -1.1,
      maxWidth: 640,
    },
    sub: {
      fontSize: 15,
      lineHeight: 25,
      color: T.mute,
      maxWidth: 560,
      marginTop: 12,
    },

    card: {
      flexBasis: 320,
      flexGrow: 1,
      backgroundColor: T.white,
      borderRadius: 18,
      padding: 28,
      borderWidth: 1,
      borderColor: T.line,
    },
    raisedCard: {
      backgroundColor: T.white === '#FFFFFF' ? T.white : '#0C0C0C',
      borderColor: T.white === '#FFFFFF' ? T.line : '#303030',
      boxShadow:
        T.white === '#FFFFFF'
          ? '0 14px 32px rgba(16,36,67,0.12), 0 3px 8px rgba(16,36,67,0.06)'
          : '0 16px 40px rgba(0,0,0,0.75), 0 0 22px rgba(255,255,255,0.07)',
    },
    cardIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: T.greenBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    accentIcon: {
      backgroundColor: T.white === '#FFFFFF' ? '#E8F1FC' : '#1B1B1B',
    },
    cardTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: T.ink,
      marginBottom: 8,
    },
    cardBody: { fontSize: 14, lineHeight: 22, color: T.mute },
    roleBlurb: {
      fontSize: 13,
      lineHeight: 20,
      color: T.slate,
      marginBottom: 2,
    },
    checkRow: { flexDirection: 'row', gap: 8, marginTop: 8 },

    stepTop: {
      borderTopWidth: 2,
      borderTopColor: T.blue,
      paddingTop: 14,
      marginBottom: 12,
    },
    stepN: {
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 1,
      color: T.faint,
    },
    stepTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: T.ink,
      marginBottom: 8,
    },
    stepBody: { fontSize: 14, lineHeight: 23, color: T.mute, maxWidth: 340 },

    faqItem: { borderBottomWidth: 1, borderBottomColor: T.line },
    faqHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 18,
      gap: 16,
    },
    faqQ: { flex: 1, fontSize: 15, fontWeight: '600', color: T.ink },
    faqA: {
      fontSize: 14,
      lineHeight: 23,
      color: T.mute,
      paddingBottom: 18,
      maxWidth: 640,
    },

    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: T.line,
    },
    contactLabel: { fontSize: 12, color: T.mute, marginBottom: 2 },
    contactValue: { fontSize: 14, fontWeight: '600', color: T.ink },
    reqBox: {
      marginTop: 24,
      backgroundColor: T.canvas === '#000000' ? '#0C0C0C' : T.white,
      borderWidth: 1,
      borderColor: T.canvas === '#000000' ? '#303030' : T.line,
      borderRadius: 12,
      padding: 18,
    },
    reqTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: T.ink,
      marginBottom: 10,
    },
    reqRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
    },
    reqText: { fontSize: 13, color: T.slate },

    form: {
      flex: 1.2,
      minWidth: 280,
      backgroundColor: T.canvas === '#000000' ? '#0C0C0C' : T.white,
      borderRadius: 12,
      padding: 26,
      borderWidth: 1,
      borderColor: T.canvas === '#000000' ? '#303030' : T.line,
      alignSelf: 'flex-start',
      width: '100%',
      maxWidth: 520,
    },
    formTitle: { fontSize: 16, fontWeight: '700', color: T.ink },
    formSub: { fontSize: 13, color: T.mute, marginTop: 4 },
    label: { fontSize: 13, fontWeight: '600', color: T.slate, marginBottom: 6 },
    input: {
      borderWidth: 1,
      borderColor: T.canvas === '#000000' ? '#303030' : T.line,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: T.ink,
      backgroundColor: T.canvas === '#000000' ? '#1B1B1B' : T.inputBg,
    },

    footer: {
      backgroundColor: T.canvas,
      paddingVertical: 48,
      paddingHorizontal: 24,
    },
    footText: { color: T.mute, fontSize: 13, lineHeight: 20 },
    footHead: {
      color: T.ink,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    footLink: { color: T.slate, fontSize: 14 },
    footBottom: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: T.line,
      marginTop: 32,
      paddingTop: 20,
    },
    footSmall: { color: T.mute, fontSize: 12 },
  })

export default TMCConnectLanding

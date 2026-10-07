import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useState } from 'react'
import {
  Dimensions,
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

type Theme = {
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
  ink: '#0F172A',
  slate: '#334155',
  mute: '#64748B',
  faint: '#94A3B8',
  line: '#E2E8F0',
  paper: '#F8FAFC',
  white: '#FFFFFF',
  navy: '#0B1B3A',
  blue: '#1D4ED8',
  green: '#15803D',
  greenBg: '#F0FDF4',
  inputBg: '#FFFFFF',
  iconChip: '#FFFFFF',
}

const Dark: Theme = {
  ink: '#F1F5F9',
  slate: '#CBD5E1',
  mute: '#94A3B8',
  faint: '#64748B',
  line: '#1E293B',
  paper: '#0F172A',
  white: '#0B1220',
  navy: '#060C1D',
  blue: '#60A5FA',
  green: '#4ADE80',
  greenBg: 'rgba(74,222,128,0.12)',
  inputBg: '#0F172A',
  iconChip: '#1E293B',
}

type Mode = 'light' | 'dark'

const web = Platform.OS === 'web'
const F = {
  body: web ? { fontFamily: "'Inter', system-ui, -apple-system, sans-serif" } : {},
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
    accessibilityRole='button'
    accessibilityLabel={
      mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
    }
    onPress={onToggle}
    style={s.themeToggle}
  >
    <Ionicons
      name={mode === 'dark' ? 'sunny-outline' : 'moon-outline'}
      size={18}
      color={T.slate}
    />
  </TouchableOpacity>
)

/** Flat product card — no phone frame, no fake notch. */
const EventCard: React.FC<Ctx> = ({ T, s }) => (
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
      <Text style={[s.eventKicker, F.body]}>TODAY · MAIN CAMPUS</Text>
      <Text style={[s.eventTitle, F.body]}>Campus Technodays 2026</Text>
      <Text style={[s.eventMeta, F.body]}>Building A · 8:00 AM – 5:00 PM</Text>

      <View style={s.qrBox}>
        <Ionicons name='qr-code-outline' size={56} color={T.ink} />
        <Text style={[s.qrCaption, F.body]}>Event QR verified</Text>
      </View>

      <View style={s.statusRow}>
        <View style={s.statusPill}>
          <Ionicons name='checkmark-circle' size={16} color={T.green} />
          <Text style={[s.statusText, F.body]}>Checked in · 8:02 AM</Text>
        </View>
      </View>
      <View style={s.locRow}>
        <Ionicons name='location-sharp' size={14} color={T.green} />
        <Text style={[s.locText, F.body]}>Location match · Main Campus</Text>
      </View>

      <View style={s.eventDivider} />
      <View style={s.eventFoot}>
        <Text style={[s.eventFootText, F.body]}>Attendance history</Text>
        <Ionicons name='chevron-forward' size={16} color={T.mute} />
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
  const [mode, setMode] = useState<Mode>(() => {
    if (!web) return 'light'
    try {
      const saved = localStorage.getItem('tmc-theme')
      if (saved === 'light' || saved === 'dark') return saved
    } catch {}
    try {
      if (
        window.matchMedia?.('(prefers-color-scheme: dark)').matches
      )
        return 'dark'
    } catch {}
    return 'light'
  })

  const T = mode === 'dark' ? Dark : Light
  const s = makeStyles(T)
  const toggle = () => setMode((m) => (m === 'dark' ? 'light' : 'dark'))

  useEffect(() => {
    if (!web) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href =
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
    document.head.appendChild(link)
    return () => {
      if (document.head.contains(link)) document.head.removeChild(link)
    }
  }, [])

  useEffect(() => {
    if (!web) return
    try {
      localStorage.setItem('tmc-theme', mode)
    } catch {}
    try {
      document.documentElement.style.backgroundColor = T.white
      document.body.style.backgroundColor = T.white
    } catch {}
  }, [mode])

  const goTo = (id: string) => {
    setMenu(false)
    if (!web) return
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const download = () => Linking.openURL(APK_URL).catch(console.error)

  return (
    <View style={{ flex: 1, backgroundColor: T.white }}>
      {/* Nav */}
      <View style={s.nav}>
        <View style={s.navBar}>
          <Pressable
            onPress={() => {
              if (web) window.scrollTo?.({ top: 0, behavior: 'smooth' })
            }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
          >
            <Image
              source={LOGO}
              style={{ width: 104, height: 40 }}
              resizeMode='contain'
            />
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
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
        <View style={s.hero}>
          <Wrap
            style={{
              flexDirection: wide ? 'row' : 'column',
              alignItems: wide ? 'flex-start' : 'stretch',
              gap: wide ? 64 : 40,
            }}
          >
            <View style={{ flex: 1.1 }}>
              <View style={s.badge}>
                <View style={s.badgeDot} />
                <Text style={[s.badgeText, F.body]}>
                  v2.0 · Android build available
                </Text>
              </View>
              <Text style={[s.h1, F.body, !wide && s.h1Mobile]}>
                Campus attendance without the paper sheets.
              </Text>
              <Text style={[s.lead, F.body]}>
                TMC Connect records event attendance with a QR scan backed by
                GPS. Students check in from their phones. Organizers get a
                clean record in Firestore — no tallying.
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
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
            </View>
            <View
              style={{
                flex: 1,
                alignItems: wide ? 'flex-end' : 'center',
              }}
            >
              <EventCard T={T} s={s} />
            </View>
          </Wrap>
        </View>

        {/* Proof strip */}
        <View style={s.strip}>
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
        </View>

        {/* Features */}
        <View style={s.sectionPaper} nativeID='features'>
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
                <View key={f.title} style={s.card}>
                  <View style={s.cardIcon}>
                    <Ionicons name={f.icon} size={20} color={T.slate} />
                  </View>
                  <Text style={[s.cardTitle, F.body]}>{f.title}</Text>
                  <Text style={[s.cardBody, F.body]}>{f.body}</Text>
                </View>
              ))}
            </View>
          </Wrap>
        </View>

        {/* How it works */}
        <View style={s.sectionWhite} nativeID='how-it-works'>
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
        </View>

        {/* Roles */}
        <View style={s.sectionPaper} nativeID='about'>
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
                <View key={a.who} style={[s.card, s.cardSolid]}>
                  <View style={s.cardIcon}>
                    <Ionicons name={a.icon} size={20} color={T.slate} />
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
                      <Text style={[s.cardBody, F.body, { flex: 1 }]}>{p}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </Wrap>
        </View>

        {/* FAQ */}
        <View style={s.sectionWhite} nativeID='faq'>
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
                <View style={s.footLogo}>
                  <Image
                    source={LOGO}
                    style={{ width: 112, height: 42 }}
                    resizeMode='contain'
                  />
                </View>
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
        T.white === '#FFFFFF' ? 'rgba(255,255,255,0.96)' : 'rgba(11,18,32,0.92)',
      borderBottomWidth: 1,
      borderBottomColor: T.line,
    },
    navBar: {
      height: NAV_H,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      width: '100%',
      maxWidth: 1168,
      alignSelf: 'center',
    },
    navLink: { color: T.slate, fontSize: 14, fontWeight: '500' },
    mobileMenu: {
      paddingHorizontal: 24,
      backgroundColor: T.white,
      borderTopWidth: 1,
      borderTopColor: T.line,
    },
    mobileLink: {
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: T.line,
    },
    themeToggle: {
      width: 38,
      height: 38,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: T.line,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },

    hero: {
      backgroundColor: T.white,
      paddingVertical: 64,
      paddingHorizontal: 24,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 8,
      backgroundColor: T.paper,
      borderWidth: 1,
      borderColor: T.line,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginBottom: 20,
    },
    badgeDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: T.green,
    },
    badgeText: { fontSize: 13, fontWeight: '500', color: T.slate },
    h1: {
      fontSize: 44,
      lineHeight: 50,
      fontWeight: '700',
      color: T.ink,
      letterSpacing: -0.8,
      marginBottom: 16,
      maxWidth: 520,
    },
    h1Mobile: { fontSize: 34, lineHeight: 40 },
    lead: {
      fontSize: 16,
      lineHeight: 26,
      color: T.slate,
      maxWidth: 500,
      marginBottom: 28,
    },
    heroMeta: { fontSize: 13, color: T.faint, marginTop: 16 },

    btn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 8,
    },
    btnPrimary: { backgroundColor: '#1D4ED8' },
    btnSecondary: {
      borderWidth: 1,
      borderColor: T.faint,
      backgroundColor: 'transparent',
    },
    btnText: { fontSize: 14, fontWeight: '600' },

    eventCard: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: T.paper === '#F8FAFC' ? '#FFFFFF' : '#111C33',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: T.line,
      overflow: 'hidden',
      ...(web
        ? ({
            boxShadow:
              T.white === '#FFFFFF'
                ? '0 1px 2px rgba(15,23,42,0.06), 0 12px 32px rgba(15,23,42,0.10)'
                : '0 1px 2px rgba(0,0,0,0.4), 0 12px 32px rgba(0,0,0,0.45)',
          } as any)
        : { elevation: 3 }),
    },
    eventTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: T.paper,
      borderBottomWidth: 1,
      borderBottomColor: T.line,
    },
    traffic: { flexDirection: 'row', gap: 6 },
    dot: { width: 9, height: 9, borderRadius: 5 },
    eventTopText: { fontSize: 13, fontWeight: '600', color: T.slate },
    eventBody: { padding: 20 },
    eventKicker: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      color: T.faint,
      marginBottom: 8,
    },
    eventTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: T.ink,
      letterSpacing: -0.3,
    },
    eventMeta: { fontSize: 13, color: T.mute, marginTop: 4 },
    qrBox: {
      alignItems: 'center',
      gap: 8,
      paddingVertical: 20,
      marginTop: 16,
      backgroundColor: T.paper,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: T.line,
      borderStyle: 'dashed',
    },
    qrCaption: { fontSize: 12, fontWeight: '600', color: T.slate },
    statusRow: { marginTop: 14 },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: T.greenBg,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    statusText: { color: T.green, fontSize: 13, fontWeight: '600' },
    locRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 10,
    },
    locText: { fontSize: 12, color: T.green, fontWeight: '500' },
    eventDivider: {
      height: 1,
      backgroundColor: T.line,
      marginTop: 16,
    },
    eventFoot: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 14,
    },
    eventFootText: { fontSize: 14, fontWeight: '600', color: T.ink },

    strip: {
      backgroundColor: T.white,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: T.line,
      paddingVertical: 32,
      paddingHorizontal: 24,
    },
    stripValue: { color: T.ink, fontSize: 15, fontWeight: '700' },
    stripLabel: {
      color: T.mute,
      fontSize: 13,
      lineHeight: 20,
      marginTop: 4,
      maxWidth: 320,
    },

    sectionPaper: {
      backgroundColor: T.paper,
      paddingVertical: 72,
      paddingHorizontal: 24,
    },
    sectionWhite: {
      backgroundColor: T.white,
      paddingVertical: 72,
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
      fontSize: 28,
      lineHeight: 36,
      fontWeight: '700',
      color: T.ink,
      letterSpacing: -0.4,
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
      flexBasis: 300,
      flexGrow: 1,
      backgroundColor: T.paper === '#F8FAFC' ? '#FFFFFF' : '#111C33',
      borderRadius: 12,
      padding: 22,
      borderWidth: 1,
      borderColor: T.line,
    },
    cardSolid: {},
    cardIcon: {
      width: 38,
      height: 38,
      borderRadius: 9,
      backgroundColor: T.iconChip,
      borderWidth: 1,
      borderColor: T.line,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    cardTitle: { fontSize: 15, fontWeight: '700', color: T.ink, marginBottom: 6 },
    cardBody: { fontSize: 14, lineHeight: 22, color: T.mute },
    roleBlurb: { fontSize: 13, lineHeight: 20, color: T.slate, marginBottom: 2 },
    checkRow: { flexDirection: 'row', gap: 8, marginTop: 8 },

    stepTop: {
      borderTopWidth: 2,
      borderTopColor: T.ink,
      paddingTop: 14,
      marginBottom: 12,
    },
    stepN: {
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 1,
      color: T.faint,
    },
    stepTitle: { fontSize: 16, fontWeight: '700', color: T.ink, marginBottom: 8 },
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
      backgroundColor: T.paper === '#F8FAFC' ? '#FFFFFF' : '#111C33',
      borderWidth: 1,
      borderColor: T.line,
      borderRadius: 12,
      padding: 18,
    },
    reqTitle: { fontSize: 13, fontWeight: '700', color: T.ink, marginBottom: 10 },
    reqRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    reqText: { fontSize: 13, color: T.slate },

    form: {
      flex: 1.2,
      minWidth: 280,
      backgroundColor: T.paper === '#F8FAFC' ? '#FFFFFF' : '#111C33',
      borderRadius: 12,
      padding: 26,
      borderWidth: 1,
      borderColor: T.line,
      alignSelf: 'flex-start',
      width: '100%',
      maxWidth: 520,
    },
    formTitle: { fontSize: 16, fontWeight: '700', color: T.ink },
    formSub: { fontSize: 13, color: T.mute, marginTop: 4 },
    label: { fontSize: 13, fontWeight: '600', color: T.slate, marginBottom: 6 },
    input: {
      borderWidth: 1,
      borderColor: T.line,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: T.ink,
      backgroundColor: T.inputBg,
    },

    footer: {
      backgroundColor: T.navy,
      paddingVertical: 48,
      paddingHorizontal: 24,
    },
    footLogo: {
      backgroundColor: '#FFFFFF',
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 5,
      alignSelf: 'flex-start',
      marginBottom: 14,
    },
    footText: { color: '#94A3B8', fontSize: 13, lineHeight: 20 },
    footHead: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    footLink: { color: '#CBD5E1', fontSize: 14 },
    footBottom: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.12)',
      marginTop: 32,
      paddingTop: 20,
    },
    footSmall: { color: '#64748B', fontSize: 12 },
  })

export default TMCConnectLanding

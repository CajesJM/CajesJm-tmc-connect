import React, { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import Svg, {
  Circle,
  Defs,
  Ellipse,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg'

const { width: SW, height: SH } = Dimensions.get('window')

function BarkieAvatarSvg({ size = 56 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox='0 0 100 100'>
      <Defs>
        <RadialGradient id='bodyGrad' cx='50%' cy='55%' r='50%'>
          <Stop offset='0%' stopColor='#F5C842' />
          <Stop offset='100%' stopColor='#D4971A' />
        </RadialGradient>
        <RadialGradient id='earGrad' cx='50%' cy='50%' r='50%'>
          <Stop offset='0%' stopColor='#E0A820' />
          <Stop offset='100%' stopColor='#B8860B' />
        </RadialGradient>
        <RadialGradient id='snoutGrad' cx='50%' cy='50%' r='50%'>
          <Stop offset='0%' stopColor='#FDEBC5' />
          <Stop offset='100%' stopColor='#F5C842' />
        </RadialGradient>
      </Defs>

      {/* Outer glow ring */}
      <Circle cx='50' cy='52' r='42' fill='rgba(245,200,66,0.15)' />

      {/* Left ear */}
      <Ellipse cx='22' cy='32' rx='14' ry='18' fill='url(#earGrad)' />
      <Ellipse cx='22' cy='34' rx='9' ry='13' fill='#C8940F' opacity={0.4} />

      {/* Right ear */}
      <Ellipse cx='78' cy='32' rx='14' ry='18' fill='url(#earGrad)' />
      <Ellipse cx='78' cy='34' rx='9' ry='13' fill='#C8940F' opacity={0.4} />

      {/* Head */}
      <Circle cx='50' cy='50' r='34' fill='url(#bodyGrad)' />

      {/* Forehead patch */}
      <Ellipse cx='50' cy='35' rx='16' ry='10' fill='#E0A820' opacity={0.35} />

      {/* Eyes */}
      {/* Left eye white */}
      <Circle cx='37' cy='45' r='8' fill='white' />
      {/* Left pupil */}
      <Circle cx='38.5' cy='45' r='5' fill='#2C1A0E' />
      {/* Left shine */}
      <Circle cx='40' cy='43' r='2' fill='white' />

      {/* Right eye white */}
      <Circle cx='63' cy='45' r='8' fill='white' />
      {/* Right pupil */}
      <Circle cx='64.5' cy='45' r='5' fill='#2C1A0E' />
      {/* Right shine */}
      <Circle cx='66' cy='43' r='2' fill='white' />

      {/* Snout */}
      <Ellipse cx='50' cy='60' rx='15' ry='11' fill='url(#snoutGrad)' />

      {/* Nose */}
      <Ellipse cx='50' cy='55' rx='6' ry='4' fill='#2C1A0E' />
      {/* Nose shine */}
      <Ellipse cx='48' cy='53.5' rx='2' ry='1.2' fill='rgba(255,255,255,0.5)' />

      {/* Smile */}
      <Path
        d='M 41 63 Q 50 72 59 63'
        fill='none'
        stroke='#2C1A0E'
        strokeWidth='2.5'
        strokeLinecap='round'
      />

      <Ellipse cx='50' cy='70' rx='5' ry='4' fill='#E05050' />
      <Path d='M 45 70 Q 50 74 55 70' fill='#C03030' stroke='none' />

      <Ellipse cx='30' cy='57' rx='6' ry='4' fill='#F4A0A0' opacity={0.4} />
      <Ellipse cx='70' cy='57' rx='6' ry='4' fill='#F4A0A0' opacity={0.4} />

      <Rect x='30' y='78' width='40' height='8' rx='4' fill='#2D7D3A' />
      <Rect x='47' y='77' width='6' height='10' rx='3' fill='#F5C842' />
      <Ellipse cx='50' cy='80' rx='2' ry='1.5' fill='rgba(255,255,255,0.5)' />
    </Svg>
  )
}

// ─── Paw print dots animation ─────────────────────────────────────────────────
function FloatingPaw({ delay, x, y }: { delay: number; x: number; y: number }) {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0.6,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -12,
            duration: 1200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.delay(2400 - delay),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [])

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        opacity,
        transform: [{ translateY }],
      }}
    >
      <Text style={{ fontSize: 10 }}>🐾</Text>
    </Animated.View>
  )
}

// ─── Main BarkieFloat Component
export default function BarkieFloat() {
  const [modalVisible, setModalVisible] = useState(false)

  const floatAnim = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(1)).current
  const pulseOpacity = useRef(new Animated.Value(0.7)).current
  const modalScale = useRef(new Animated.Value(0.7)).current
  const modalOpacity = useRef(new Animated.Value(0)).current
  const wagAnim = useRef(new Animated.Value(0)).current
  const earAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    // Continuous float bob
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start()

    // Pulse ring
    Animated.loop(
      Animated.parallel([
        Animated.timing(pulseAnim, {
          toValue: 1.5,
          duration: 1600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseOpacity, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [])

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(wagAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(wagAnim, {
          toValue: -1,
          duration: 300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(wagAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
      ])
    ).start()
  }, [])

  const wagRotation = wagAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-12deg', '0deg', '12deg'],
  })

  function handleOpen() {
    // Ear bounce
    Animated.sequence([
      Animated.timing(earAnim, {
        toValue: 1.15,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(earAnim, {
        toValue: 0.95,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(earAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start()

    setModalVisible(true)
    Animated.parallel([
      Animated.spring(modalScale, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start()
  }

  function handleClose() {
    Animated.parallel([
      Animated.timing(modalScale, {
        toValue: 0.7,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false)
      modalScale.setValue(0.7)
      modalOpacity.setValue(0)
    })
  }

  return (
    <>
      <Animated.View
        style={[
          styles.fabContainer,
          { transform: [{ translateY: floatAnim }, { scale: earAnim }] },
        ]}
      >
        {/* Pulse ring */}
        <Animated.View
          style={[
            styles.pulseRing,
            {
              transform: [{ scale: pulseAnim }],
              opacity: pulseOpacity,
            },
          ]}
        />

        {/* Tail wag */}
        <Animated.View
          style={[styles.tail, { transform: [{ rotate: wagRotation }] }]}
        >
          <Svg width={28} height={28} viewBox='0 0 28 28'>
            <Path
              d='M 6 24 Q 8 14 16 10 Q 22 7 24 4'
              fill='none'
              stroke='#D4971A'
              strokeWidth='5'
              strokeLinecap='round'
            />
          </Svg>
        </Animated.View>

        {/* Main button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={handleOpen}
          activeOpacity={0.85}
          accessibilityLabel='Open Barkie AI assistant'
          accessibilityRole='button'
        >
          <BarkieAvatarSvg size={52} />
        </TouchableOpacity>

        {/* "AI" badge */}
        <View style={styles.aiBadge}>
          <Text style={styles.aiBadgeText}>Barkie</Text>
        </View>
      </Animated.View>

      <View style={styles.pawContainer} pointerEvents='none'>
        <FloatingPaw delay={0} x={-24} y={-8} />
        <FloatingPaw delay={700} x={-32} y={-22} />
        <FloatingPaw delay={1400} x={-14} y={-30} />
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType='none'
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        <Pressable style={styles.backdrop} onPress={handleClose}>
          <Animated.View
            style={[
              styles.modalCard,
              {
                transform: [{ scale: modalScale }],
                opacity: modalOpacity,
              },
            ]}
          >
            <Pressable onPress={() => {}}>
              {/* Header glow */}
              <View style={styles.cardGlow} />

              {/* Avatar */}
              <View style={styles.modalAvatarWrap}>
                <BarkieAvatarSvg size={88} />
              </View>

              {/* Paw decorations */}
              <Text style={styles.pawLeft}>🐾</Text>
              <Text style={styles.pawRight}>🐾</Text>

              {/* Title */}
              <Text style={styles.modalTitle}>Hey there! I'm Barkie</Text>
              <Text style={styles.modalSubtitle}>
                Your TMC Connect AI Guide
              </Text>

              {/* Coming soon badge */}
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonDot}>●</Text>
                <Text style={styles.comingSoonText}>Coming Soon</Text>
              </View>

              {/* Description */}
              <Text style={styles.modalDesc}>
                I'm being trained to help you manage{'\n'}
                students, attendance, announcements,{'\n'}
                and everything TMC Connect.{'\n\n'}
                Stay tuned — I'll be ready soon! WOOOFF!!
              </Text>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Features preview */}
              <View style={styles.featureRow}>
                {['Attendance Help', 'Announcements', 'About TMC Connect'].map(
                  (f, i) => (
                    <View key={i} style={styles.featureChip}>
                      <Text style={styles.featureChipText}>{f}</Text>
                    </View>
                  )
                )}
              </View>

              {/* Close */}
              <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                <Text style={styles.closeBtnText}>Got it, thanks!</Text>
              </TouchableOpacity>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  )
}

const FAB_SIZE = 68
const BOTTOM = Platform.OS === 'ios' ? 130 : 110
const RIGHT = 20

const styles = StyleSheet.create({
  // FAB
  fabContainer: {
    position: 'absolute',
    bottom: BOTTOM,
    right: RIGHT,
    width: FAB_SIZE,
    height: FAB_SIZE,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    borderWidth: 2,
    borderColor: '#3B6D11',
    opacity: 0.7,
  },
  tail: {
    position: 'absolute',
    bottom: -10,
    right: -16,
    transformOrigin: 'top left',
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: '#FFFBEE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#D4971A',
    shadowColor: '#D4971A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 12,
    overflow: 'hidden',
  },
  aiBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#2D7D3A',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: 'white',
  },
  aiBadgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Paw particles container (positioned relative to FAB)
  pawContainer: {
    position: 'absolute',
    bottom: BOTTOM + FAB_SIZE / 2,
    right: RIGHT + FAB_SIZE / 2,
    width: 1,
    height: 1,
    zIndex: 998,
    overflow: 'visible',
  },

  // Modal
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFDF4',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 28,
    paddingTop: 20,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#F5C842',
  },
  cardGlow: {
    position: 'absolute',
    top: -60,
    left: -60,
    right: -60,
    height: 160,
    backgroundColor: '#FFF5CC',
    borderRadius: 999,
    opacity: 0.8,
  },
  modalAvatarWrap: {
    marginTop: 8,
    marginBottom: 12,
    shadowColor: '#D4971A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  pawLeft: {
    position: 'absolute',
    top: 28,
    left: 18,
    fontSize: 18,
    opacity: 0.3,
    transform: [{ rotate: '-20deg' }],
  },
  pawRight: {
    position: 'absolute',
    top: 28,
    right: 18,
    fontSize: 18,
    opacity: 0.3,
    transform: [{ rotate: '20deg' }],
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2C1A0E',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#8B6914',
    marginTop: 3,
    marginBottom: 14,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  comingSoonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E1',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A8D87C',
  },
  comingSoonDot: {
    fontSize: 8,
    color: '#3B6D11',
  },
  comingSoonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B6D11',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  modalDesc: {
    fontSize: 14,
    color: '#5C4A1E',
    lineHeight: 22,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0E0A0',
    width: '100%',
    marginVertical: 16,
  },
  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 20,
  },
  featureChip: {
    backgroundColor: '#FFF5CC',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#F5C842',
  },
  featureChipText: {
    fontSize: 11,
    color: '#8B6914',
    fontWeight: '500',
  },
  closeBtn: {
    backgroundColor: '#2D7D3A',
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 12,
    shadowColor: '#2D7D3A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  closeBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
})

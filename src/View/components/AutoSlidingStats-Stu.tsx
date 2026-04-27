import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useRef, useState } from 'react'
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useTheme } from '../../Controller/context/ThemeContext'

interface Tip {
  id: number
  title: string
  description: string
}

const TIPS: Tip[] = [
  {
    id: 1,
    title: 'View Events',
    description: 'Go to the Events tab to view the events.',
  },
  {
    id: 2,
    title: 'View Announcements',
    description: 'Go to the Announcements tab to view announcements.',
  },
  {
    id: 3,
    title: 'View Location of the events',
    description: 'From the events tab, click an event and click view on map.',
  },
  {
    id: 4,
    title: "View you're distance location from the events",
    description:
      'From the events tab, click an event and click check my location to verify if your on the range.',
  },
  {
    id: 5,
    title: 'View Penalties',
    description: 'Go to profile tab and click "My Penalties".',
  },
  {
    id: 6,
    title: 'Scan QR Code',
    description:
      'Tap the Scan tab and enable camera and your location and click open scanner.',
  },
]

const AutoSlidingTips = () => {
  const { isDark } = useTheme()
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollRef = useRef<ScrollView>(null)
  const timerRef = useRef<number | null>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  // Auto‑scroll
  useEffect(() => {
    if (containerWidth <= 0) return
    startAutoScroll()
    return () => stopAutoScroll()
  }, [containerWidth])

  const startAutoScroll = () => {
    stopAutoScroll()
    timerRef.current = setInterval(() => {
      const next = (currentIndex + 1) % TIPS.length
      scrollRef.current?.scrollTo({ x: next * containerWidth, animated: true })
      setCurrentIndex(next)
    }, 4500) as unknown as number
  }

  const stopAutoScroll = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const onLayout = (ev: any) => {
    const w = ev.nativeEvent.layout.width
    if (w && w !== containerWidth) setContainerWidth(w)
  }

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x
    const idx = Math.round(offsetX / containerWidth)
    setCurrentIndex(idx)
    // Restart auto‑scroll after user swipe
    stopAutoScroll()
    setTimeout(() => startAutoScroll(), 600)
  }

  const onScrollBeginDrag = () => stopAutoScroll()
  const onScrollEndDrag = () => {
    // If momentum isn't enough to move, restart timer
    setTimeout(() => {
      if (!timerRef.current) startAutoScroll()
    }, 1200)
  }

  return (
    <View style={styles.outerContainer} onLayout={onLayout}>
      <LinearGradient
        colors={
          isDark
            ? ['#1E293B', '#0F172A', '#1E1B4B']
            : ['#E0F2FE', '#BAE6FD', '#F0F9FF']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradientContainer,
          { height: (containerWidth > 400 ? 150 : 170) + 56 },
        ]}
      >
        {/* Decorative shapes (unchanged) */}
        <View
          style={[
            styles.shape,
            styles.shape1,
            {
              backgroundColor: isDark
                ? 'rgba(255,255,255,0.12)'
                : 'rgba(15,23,42,0.06)',
            },
          ]}
          pointerEvents='none'
        />
        <View
          style={[
            styles.shape,
            styles.shape2,
            {
              backgroundColor: isDark
                ? 'rgba(255,255,255,0.12)'
                : 'rgba(15,23,42,0.06)',
            },
          ]}
          pointerEvents='none'
        />
        <View
          style={[
            styles.shape,
            styles.shape3,
            {
              backgroundColor: isDark
                ? 'rgba(255,255,255,0.12)'
                : 'rgba(15,23,42,0.06)',
            },
          ]}
          pointerEvents='none'
        />

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumScrollEnd}
          onScrollBeginDrag={onScrollBeginDrag}
          onScrollEndDrag={onScrollEndDrag}
          scrollEventThrottle={16}
          decelerationRate='fast'
          disableIntervalMomentum
          snapToInterval={containerWidth}
          snapToAlignment='center'
          contentContainerStyle={{ alignItems: 'center' }}
        >
          {TIPS.map((tip) => (
            <View
              key={tip.id}
              style={[
                styles.tipWrapper,
                {
                  width: containerWidth,
                  height: containerWidth > 400 ? 150 : 170,
                },
              ]}
            >
              <View style={styles.content}>
                <Text
                  style={[
                    styles.title,
                    {
                      color: isDark ? '#FFF' : '#0F172A',
                      fontSize: containerWidth > 400 ? 18 : 16,
                    },
                  ]}
                  numberOfLines={2}
                >
                  {tip.title}
                </Text>
                <Text
                  style={[
                    styles.description,
                    {
                      color: isDark ? '#CBD5E1' : '#334155',
                      fontSize: containerWidth > 400 ? 14 : 12,
                    },
                  ]}
                >
                  {tip.description}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Indicator dots */}
        <View style={styles.indicatorContainer}>
          {TIPS.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    idx === currentIndex
                      ? isDark
                        ? '#FFF'
                        : '#0F172A'
                      : isDark
                        ? '#475569'
                        : '#CBD5E1',
                  width: idx === currentIndex ? 20 : 8,
                },
              ]}
            />
          ))}
        </View>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  outerContainer: {
    marginHorizontal: 8,
    marginVertical: 12,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  gradientContainer: {
    borderRadius: 24,
    paddingVertical: 0,
    position: 'relative',
    overflow: 'hidden',
  },
  tipWrapper: { paddingHorizontal: 24, justifyContent: 'center' },
  content: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  title: {
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.3,
    flexShrink: 1,
  },
  description: {
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.95,
    flexShrink: 1,
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: { height: 8, borderRadius: 4, marginHorizontal: 2 },
  shape: { position: 'absolute', borderRadius: 999, opacity: 0.4 },
  shape1: { width: 120, height: 120, top: -40, right: -30 },
  shape2: { width: 80, height: 80, bottom: -20, left: -20 },
  shape3: { width: 60, height: 60, top: '50%', right: 20, marginTop: -30 },
})

export default AutoSlidingTips

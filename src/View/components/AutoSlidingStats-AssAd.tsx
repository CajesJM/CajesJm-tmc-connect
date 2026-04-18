import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useRef, useState } from 'react'
import {
  Animated,
  FlatList,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
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
    title: 'Create Events',
    description:
      'Go to the Events tab to schedule new activities. Fill in title, description, location, and etc.',
  },
  {
    id: 2,
    title: 'Post Announcements',
    description: 'Go to the Announcements tab to send important updates.',
  },
  {
    id: 3,
    title: 'Manage Attendance',
    description: 'From the Generate tab, tap on an event to manage attendance.',
  },
  {
    id: 4,
    title: 'View Analytics',
    description:
      'Check the Analytics Overview chart to see participation trends over time.',
  },
  {
    id: 5,
    title: 'View Notifications',
    description: 'Check your notification center for updates and messages.',
  },
  {
    id: 6,
    title: 'View Chart Details',
    description:
      'Tap on any data point in the chart to see detailed information.',
  },
]

const AutoSlidingTips = () => {
  const { isDark } = useTheme()
  const [currentIndex, setCurrentIndex] = useState(0)
  const currentIndexRef = useRef(0)
  const listRef = useRef<FlatList<Tip> | null>(null)
  const timerRef = useRef<number | null>(null)
  const [containerWidth, setContainerWidth] = useState<number>(0)

  const scrollX = useRef(new Animated.Value(0)).current

  useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])

  useEffect(() => {
    startAutoScroll()
    return () => stopAutoScroll()
  }, [containerWidth])

  const startAutoScroll = () => {
    stopAutoScroll()
    timerRef.current = setInterval(() => {
      const next = (currentIndexRef.current + 1) % TIPS.length
      if (listRef.current && containerWidth > 0) {
        listRef.current.scrollToOffset({
          offset: next * containerWidth,
          animated: true,
        })
        setCurrentIndex(next)
      }
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
    if (w && w !== containerWidth) {
      setContainerWidth(w)
      // re-align immediately (no animation) after layout change
      setTimeout(() => {
        if (listRef.current) {
          listRef.current.scrollToOffset({
            offset: currentIndexRef.current * w,
            animated: false,
          })
        }
      }, 0)
    }
  }

  const onMomentumScrollBegin = () => {
    // user started a fling; stop auto-scroll to avoid fighting native momentum
    stopAutoScroll()
  }

  const onMomentumScrollEnd = (ev: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = ev.nativeEvent.contentOffset.x
    const idx = Math.round(offsetX / Math.max(1, containerWidth))
    setCurrentIndex(idx)
    // restart auto-scroll after momentum finishes
    setTimeout(() => startAutoScroll(), 600)
  }

  const onScrollBeginDrag = () => stopAutoScroll()
  const onScrollEndDrag = () => {
    // let momentum handlers decide when to restart
    // small safety restart if momentum doesn't fire
    setTimeout(() => {
      if (!timerRef.current) startAutoScroll()
    }, 1200)
  }

  const renderItem = ({ item }: ListRenderItemInfo<Tip>) => (
    <View
      style={[
        styles.tipWrapper,
        { width: containerWidth, height: containerWidth > 400 ? 150 : 170 },
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
          {item.title}
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
          {item.description}
        </Text>
      </View>
    </View>
  )

  const indicatorDots = TIPS.map((_, i) => {
    const inputRange = [
      (i - 1) * containerWidth,
      i * containerWidth,
      (i + 1) * containerWidth,
    ]
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [1, 1.6, 1],
      extrapolate: 'clamp',
    })
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.6, 1, 0.6],
      extrapolate: 'clamp',
    })
    return { scale, opacity }
  })

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

        <Animated.FlatList
          ref={listRef}
          data={TIPS}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          renderItem={renderItem}
          onMomentumScrollBegin={onMomentumScrollBegin}
          onMomentumScrollEnd={onMomentumScrollEnd}
          onScrollBeginDrag={onScrollBeginDrag}
          onScrollEndDrag={onScrollEndDrag}
          getItemLayout={(_, index) => ({
            length: containerWidth || 1,
            offset: (containerWidth || 1) * index,
            index,
          })}
          contentContainerStyle={{ alignItems: 'center' }}
          scrollEventThrottle={16}
          // native snapping physics
          decelerationRate='fast'
          snapToInterval={containerWidth}
          snapToAlignment='center'
          disableIntervalMomentum={true}
          // drive animated value from native scroll (useNativeDriver true)
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
        />

        <View style={styles.indicatorContainer}>
          {indicatorDots.map((anim, idx) => (
            <Animated.View
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
                  transform: [{ scale: anim.scale }],
                  opacity: anim.opacity,
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

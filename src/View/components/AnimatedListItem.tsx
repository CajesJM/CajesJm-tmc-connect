import React, { useEffect, useRef } from 'react'
import { Animated, Easing } from 'react-native'

interface AnimatedListItemProps {
  children: React.ReactNode
  index: number
  duration?: number
  delay?: number
  translateYDistance?: number
}

const AnimatedListItem = ({
  children,
  index,
  duration = 450,
  delay = 80,
  translateYDistance = 16,
}: AnimatedListItemProps) => {
  const itemAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(itemAnim, {
      toValue: 1,
      duration,
      delay: index * delay,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      useNativeDriver: true,
    }).start()
  }, [])

  const translateY = itemAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [translateYDistance, 0],
    extrapolate: 'clamp',
  })

  const scale = itemAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.97, 1],
    extrapolate: 'clamp',
  })

  const opacity = itemAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 1, 1],
    extrapolate: 'clamp',
  })

  return (
    <Animated.View
      renderToHardwareTextureAndroid
      shouldRasterizeIOS
      style={{
        opacity,
        transform: [{ translateY }, { scale }],
      }}
    >
      {children}
    </Animated.View>
  )
}

export default AnimatedListItem

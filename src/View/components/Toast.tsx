import { Feather } from '@expo/vector-icons'
import React, { useEffect, useRef } from 'react'
import { Animated, Platform, Text, TouchableOpacity, View } from 'react-native'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastProps {
  visible: boolean
  message: string
  type?: ToastType
  onDismiss: () => void
  duration?: number
}

const TOAST_COLORS: Record<
  ToastType,
  { bg: string; icon: string; text: string; border: string }
> = {
  success: {
    bg: '#ffffff',
    icon: '#16a34a',
    text: '#111827',
    border: '#e5e7eb',
  },
  error: { bg: '#ffffff', icon: '#dc2626', text: '#111827', border: '#e5e7eb' },
  info: { bg: '#ffffff', icon: '#6b7280', text: '#111827', border: '#e5e7eb' },
  warning: {
    bg: '#ffffff',
    icon: '#d97706',
    text: '#111827',
    border: '#e5e7eb',
  },
}

const TOAST_ICONS: Record<ToastType, string> = {
  success: 'check-circle',
  error: 'alert-circle',
  info: 'info',
  warning: 'alert-triangle',
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'info',
  onDismiss,
  duration = 3000,
}) => {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(-20)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start()

      const timer = setTimeout(() => hideToast(), duration)
      return () => clearTimeout(timer)
    }
  }, [visible])

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss())
  }

  if (!visible) return null

  const colors = TOAST_COLORS[type]

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: Platform.OS === 'ios' ? 56 : 40,
        right: 16,
        opacity,
        transform: [{ translateY }],
        zIndex: 9999,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.bg,
          borderRadius: 10,
          paddingVertical: 10,
          paddingHorizontal: 14,
          gap: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.12,
          shadowRadius: 10,
          elevation: 8,
          borderWidth: 1,
          borderColor: colors.border,
          maxWidth: 320,
          minWidth: 200,
        }}
      >
        <Feather
          name={TOAST_ICONS[type] as any}
          size={16}
          color={colors.icon}
        />
        <Text
          style={{
            fontSize: 14,
            color: colors.text,
            fontWeight: '400',
            flexShrink: 1,
            lineHeight: 20,
          }}
        >
          {message}
        </Text>
        <TouchableOpacity onPress={hideToast} style={{ marginLeft: 4 }}>
          <Feather name='x' size={14} color='#9ca3af' />
        </TouchableOpacity>
      </View>
    </Animated.View>
  )
}

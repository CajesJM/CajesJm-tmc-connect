import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as Location from 'expo-location'
import React, { useEffect, useRef, useState } from 'react'
import { Animated, Easing, Text, TouchableOpacity, View } from 'react-native'

// ─── Types ───────────────────────────────────────────────────────────────────

interface WeatherData {
  temperature: number
  feelsLike: number
  humidity: number
  windSpeed: number
  weatherCode: number
  description: string
  icon: string
  isDay: boolean
  cityName: string
}

interface WeatherWidgetProps {
  colors: any
  isDark: boolean
  isMobile: boolean
}

// ─── Weather code → description + Ionicons name ──────────────────────────────

const getWeatherInfo = (
  code: number,
  isDay: boolean
): { description: string; icon: string } => {
  if (code === 0)
    return {
      description: 'Clear Sky',
      icon: isDay ? 'sunny-outline' : 'moon-outline',
    }
  if (code <= 2)
    return {
      description: 'Partly Cloudy',
      icon: isDay ? 'partly-sunny-outline' : 'cloudy-night-outline',
    }
  if (code === 3) return { description: 'Overcast', icon: 'cloud-outline' }
  if (code <= 49) return { description: 'Foggy', icon: 'cloud-outline' }
  if (code <= 59) return { description: 'Drizzle', icon: 'rainy-outline' }
  if (code <= 69) return { description: 'Rainy', icon: 'rainy-outline' }
  if (code <= 79) return { description: 'Snowy', icon: 'snow-outline' }
  if (code <= 82)
    return { description: 'Rain Showers', icon: 'thunderstorm-outline' }
  if (code <= 86) return { description: 'Snow Showers', icon: 'snow-outline' }
  return { description: 'Thunderstorm', icon: 'thunderstorm-outline' }
}

const getCityName = async (lat: number, lon: number): Promise<string> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'TMCConnectApp/1.0',
          'Accept-Language': 'en',
        },
      }
    )
    if (!res.ok) throw new Error('Nominatim error')
    const data = await res.json()

    console.log('Nominatim address:', JSON.stringify(data.address))

    const addr = data.address
    return (
      addr?.city ||
      addr?.city_district ||
      addr?.town ||
      addr?.village ||
      addr?.suburb ||
      addr?.municipality ||
      addr?.district ||
      addr?.county ||
      addr?.state_district ||
      addr?.state ||
      data.display_name?.split(',')[0] ||
      'Your Location'
    )
  } catch {
    return 'Your Location'
  }
}

// ─── Main Widget ──────────────────────────────────────────────────────────────

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  colors,
  isDark,
  isMobile,
}) => {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(20)).current
  const pulseAnim = useRef(new Animated.Value(1)).current
  const spinAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [])

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start()
  }

  const startSpin = () => {
    spinAnim.setValue(0)
    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start()
  }

  // ✅ All async/await lives inside this regular async function
  const fetchWeather = async () => {
    setLoading(true)
    setError(null)
    startSpin()

    try {
      // ① Request location permission via expo-location
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        throw new Error('Location permission denied')
      }

      // ② Get current position
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      })
      const { latitude, longitude } = loc.coords

      // ③ Fetch weather from Open-Meteo (free, no API key needed)
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?` +
          `latitude=${latitude}&longitude=${longitude}` +
          `&current=temperature_2m,apparent_temperature,relative_humidity_2m,` +
          `wind_speed_10m,weather_code,is_day` +
          `&wind_speed_unit=kmh&timezone=auto`
      )

      if (!weatherRes.ok) throw new Error('Weather fetch failed')
      const weatherJson = await weatherRes.json()
      const c = weatherJson.current

      // ④ Get city name via reverse geocoding
      const cityName = await getCityName(latitude, longitude)

      const info = getWeatherInfo(c.weather_code, c.is_day === 1)

      setWeather({
        temperature: Math.round(c.temperature_2m),
        feelsLike: Math.round(c.apparent_temperature),
        humidity: c.relative_humidity_2m,
        windSpeed: Math.round(c.wind_speed_10m),
        weatherCode: c.weather_code,
        description: info.description,
        icon: info.icon,
        isDay: c.is_day === 1,
        cityName,
      })

      animateIn()
    } catch (err: any) {
      // Fallback: Tagbilaran, Bohol coordinates
      try {
        const fallbackRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?` +
            `latitude=9.6500&longitude=123.8500` +
            `&current=temperature_2m,apparent_temperature,relative_humidity_2m,` +
            `wind_speed_10m,weather_code,is_day` +
            `&wind_speed_unit=kmh&timezone=Asia/Manila`
        )
        const fallbackJson = await fallbackRes.json()
        const c = fallbackJson.current
        const info = getWeatherInfo(c.weather_code, c.is_day === 1)

        setWeather({
          temperature: Math.round(c.temperature_2m),
          feelsLike: Math.round(c.apparent_temperature),
          humidity: c.relative_humidity_2m,
          windSpeed: Math.round(c.wind_speed_10m),
          weatherCode: c.weather_code,
          description: info.description,
          icon: info.icon,
          isDay: c.is_day === 1,
          cityName: 'Tagbilaran (default)',
        })
        animateIn()
      } catch {
        setError('Unable to load weather')
      }
    } finally {
      setLoading(false)
    }
  }

  // ✅ useEffect calls fetchWeather — no bare await at component level
  useEffect(() => {
    fetchWeather()
    const interval = setInterval(fetchWeather, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const getGradientColors = (): [string, string] => {
    if (!weather)
      return isDark ? ['#1e293b', '#0f172a'] : ['#e0f2fe', '#bae6fd']

    const { weatherCode, isDay } = weather
    if (!isDay) return isDark ? ['#1e1b4b', '#0f0f2d'] : ['#1e1b4b', '#312e81']
    if (weatherCode === 0)
      return isDark ? ['#1e3a5f', '#0c2340'] : ['#0ea5e9', '#0284c7']
    if (weatherCode <= 3)
      return isDark ? ['#1e293b', '#0f172a'] : ['#64748b', '#475569']
    if (weatherCode >= 61 && weatherCode <= 82)
      return isDark ? ['#1e3040', '#0f1f2e'] : ['#334155', '#1e293b']
    return isDark ? ['#1e293b', '#0f172a'] : ['#3b82f6', '#1d4ed8']
  }

  if (loading) {
    return (
      <View
        style={{
          marginHorizontal: isMobile ? 16 : 24,
          marginBottom: 16,
          borderRadius: 20,
          overflow: 'hidden',
          backgroundColor: isDark ? '#1e293b' : '#e0f2fe',
          padding: 20,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 10,
          minHeight: 80,
        }}
      >
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Ionicons
            name='refresh'
            size={18}
            color={isDark ? '#94a3b8' : '#0ea5e9'}
          />
        </Animated.View>
        <Text
          style={{
            color: isDark ? '#94a3b8' : '#0369a1',
            fontSize: 14,
            fontWeight: '500',
          }}
        >
          Fetching weather…
        </Text>
      </View>
    )
  }

  if (error || !weather) {
    return (
      <View
        style={{
          marginHorizontal: isMobile ? 16 : 24,
          marginBottom: 16,
          borderRadius: 20,
          backgroundColor: isDark ? '#1e293b' : '#fef2f2',
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ color: isDark ? '#94a3b8' : '#ef4444', fontSize: 13 }}>
          {error || 'Weather unavailable'}
        </Text>
        <TouchableOpacity onPress={fetchWeather}>
          <Ionicons
            name='refresh-outline'
            size={18}
            color={isDark ? '#94a3b8' : '#ef4444'}
          />
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <Animated.View
      style={{
        marginHorizontal: isMobile ? 16 : 24,
        marginBottom: 16,
        borderRadius: 20,
        overflow: 'hidden',
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.4 : 0.15,
        shadowRadius: 12,
        elevation: 6,
      }}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 16 }}
      >
        {/* Top row: city name + refresh */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons
              name='location-outline'
              size={13}
              color='rgba(255,255,255,0.8)'
            />
            <Text
              style={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: 13,
                fontWeight: '500',
              }}
              numberOfLines={1}
            >
              {weather.cityName}
            </Text>
          </View>
          <TouchableOpacity
            onPress={fetchWeather}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name='refresh-outline'
              size={15}
              color='rgba(255,255,255,0.7)'
            />
          </TouchableOpacity>
        </View>

        {/* Temperature + icon */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View>
            <Text
              style={{
                color: '#ffffff',
                fontSize: isMobile ? 42 : 52,
                fontWeight: '700',
                letterSpacing: -2,
                lineHeight: isMobile ? 46 : 56,
              }}
            >
              {weather.temperature}°C
            </Text>
            <Text
              style={{
                color: 'rgba(255,255,255,0.85)',
                fontSize: 15,
                fontWeight: '500',
                marginTop: 2,
              }}
            >
              {weather.description}
            </Text>
            <Text
              style={{
                color: 'rgba(255,255,255,0.65)',
                fontSize: 12,
                marginTop: 2,
              }}
            >
              Feels like {weather.feelsLike}°C
            </Text>
          </View>

          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Ionicons
              name={weather.icon as any}
              size={isMobile ? 60 : 72}
              color='rgba(255,255,255,0.95)'
            />
          </Animated.View>
        </View>

        {/* Stat pills */}
        <View style={{ flexDirection: 'row', marginTop: 14, gap: 8 }}>
          {[
            {
              icon: 'water-outline',
              label: `${weather.humidity}%`,
              sublabel: 'Humidity',
            },
            {
              icon: 'speedometer-outline',
              label: `${weather.windSpeed} km/h`,
              sublabel: 'Wind',
            },
            {
              icon: weather.isDay ? 'sunny-outline' : 'moon-outline',
              label: weather.isDay ? 'Daytime' : 'Nighttime',
              sublabel: 'Period',
            },
          ].map((stat, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                backgroundColor: 'rgba(255,255,255,0.15)',
                borderRadius: 12,
                padding: 8,
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Ionicons
                name={stat.icon as any}
                size={16}
                color='rgba(255,255,255,0.9)'
              />
              <Text
                style={{ color: '#ffffff', fontSize: 12, fontWeight: '600' }}
              >
                {stat.label}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>
                {stat.sublabel}
              </Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </Animated.View>
  )
}

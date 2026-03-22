import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { fadeIn, scaleIn, slideUp } from '../utils/animations';

export const AnimatedStatCard = ({ title, value, icon, color, trend, subtitle, onPress, styles, dynamic, isDark }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const numberAnim = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = React.useState(0);

  useEffect(() => {
    Animated.parallel([
      fadeIn(fadeAnim, 500),
      scaleIn(scaleAnim, 400),
      slideUp(slideAnim, 500),
    ]).start();

    // Animate number counting
    const animateNumber = () => {
      const numericValue = parseFloat(value);
      if (isNaN(numericValue)) {
        setDisplayValue(value);
        return;
      }
      
      Animated.timing(numberAnim, {
        toValue: numericValue,
        duration: 800,
        useNativeDriver: false,
      }).start();
      
      numberAnim.addListener(({ value: animValue }) => {
        if (typeof numericValue === 'number') {
          if (Number.isInteger(numericValue)) {
            setDisplayValue(Math.floor(animValue));
          } else {
            setDisplayValue(animValue.toFixed(1));
          }
        }
      });
    };
    
    animateNumber();
    
    return () => {
      numberAnim.removeAllListeners();
    };
  }, [value]);

  return (
    <Animated.View
      style={[
        styles.statCard,
        {
          backgroundColor: dynamic.cardBg,
          borderLeftColor: color,
          borderRightColor: dynamic.statCardBorder,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <View style={styles.statCardHeader}>
          <Animated.View 
            style={[
              styles.statIconContainer, 
              { backgroundColor: `${color}15` },
              { transform: [{ scale: scaleAnim }] }
            ]}
          >
            {icon}
          </Animated.View>
          {trend !== undefined && (
            <Animated.View 
              style={[
                styles.trendBadge, 
                { backgroundColor: trend >= 0 ? '#10b98120' : '#ef444420' },
                { opacity: fadeAnim }
              ]}
            >
              <Feather name={trend >= 0 ? 'trending-up' : 'trending-down'} size={12} color={trend >= 0 ? '#10b981' : '#ef4444'} />
              <Text style={[styles.trendText, { color: trend >= 0 ? '#10b981' : '#ef4444' }]}>
                {Math.abs(trend).toFixed(1)}%
              </Text>
            </Animated.View>
          )}
        </View>

        <Animated.Text style={[styles.statNumber, { color: dynamic.textPrimary }]}>
          {displayValue}
        </Animated.Text>
        <Text style={[styles.statLabel, { color: dynamic.textSecondary }]}>{title}</Text>
        {subtitle && <Text style={[styles.statSubtext, { color: dynamic.textMuted }]}>{subtitle}</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
};
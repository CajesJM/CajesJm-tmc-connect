import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';

export const AnimatedActivityItem = ({ 
  activity, 
  index, 
  styles, 
  dynamic, 
  isDark, 
  getActivityIcon, 
  formatTimeAgo,
  isLast 
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  return (
    <Animated.View 
      style={[
        styles.activityItem,
        { 
          borderBottomColor: dynamic.borderColor,
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        },
        isLast && styles.lastActivityItem
      ]}
    >
      <View style={[styles.activityIcon, { backgroundColor: `${activity.color}${isDark ? '30' : '15'}` }]}>
        {getActivityIcon(activity)}
      </View>
      <View style={styles.activityContent}>
        <View style={styles.activityHeader}>
          <Text style={[styles.activityTitle, { color: dynamic.textPrimary }]}>{activity.title}</Text>
          <Text style={[styles.activityTime, { color: dynamic.textMuted }]}>{formatTimeAgo(activity.timestamp)}</Text>
        </View>
        <Text style={[styles.activityDescription, { color: dynamic.textSecondary }]}>{activity.description}</Text>
      </View>
    </Animated.View>
  );
};
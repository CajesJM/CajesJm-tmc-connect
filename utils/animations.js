import { Animated, Easing } from 'react-native';

export const fadeIn = (value, duration = 800) => {
  return Animated.timing(value, {
    toValue: 1,
    duration: duration,
    useNativeDriver: true,
    easing: Easing.out(Easing.cubic),
  });
};

export const slideUp = (value, duration = 600) => {
  return Animated.timing(value, {
    toValue: 1,
    duration: duration,
    useNativeDriver: true,
    easing: Easing.out(Easing.back(0.5)),
  });
};

export const scaleIn = (value, duration = 500) => {
  return Animated.spring(value, {
    toValue: 1,
    friction: 6,
    tension: 80,
    useNativeDriver: true,
  });
};

export const drawLine = (value, duration = 1000) => {
  return Animated.timing(value, {
    toValue: 1,
    duration: duration,
    useNativeDriver: false,
    easing: Easing.out(Easing.cubic),
  });
};

export const animateSequence = (animations, delay = 100) => {
  const sequence = [];
  animations.forEach((anim, index) => {
    sequence.push(
      Animated.delay(index * delay),
      anim
    );
  });
  return Animated.sequence(sequence);
};
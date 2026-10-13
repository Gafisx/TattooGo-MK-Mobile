import { useEffect, useRef } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/constants/theme';

interface SkeletonProps {
  style?: StyleProp<ViewStyle>;
}

/** Lightweight shimmer placeholder (no extra dependency). */
export function Skeleton({ style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ opacity, backgroundColor: colors.elevated, borderRadius: 16 }, style]}
    />
  );
}

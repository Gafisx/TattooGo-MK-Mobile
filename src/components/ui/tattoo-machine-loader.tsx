import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/constants/theme';

interface TattooMachineLoaderProps {
  size?: number;
  color?: string;
}

/**
 * "Máquina de tatuagem" — indicador de progresso nativo.
 *
 * Adaptação do loader do web (agulha pulsando + anel giratório) para
 * `react-native-reanimated`, sem dependências extras. Usado no lugar do
 * `ActivityIndicator` durante upload/publicação do portfólio.
 */
export function TattooMachineLoader({ size = 56, color = colors.accent }: TattooMachineLoaderProps) {
  const rotation = useSharedValue(0);
  const vibration = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1100, easing: Easing.linear }),
      -1,
      false,
    );
    vibration.value = withRepeat(
      withTiming(1, { duration: 70, easing: Easing.linear }),
      -1,
      true,
    );
    return () => {
      cancelAnimation(rotation);
      cancelAnimation(vibration);
    };
  }, [rotation, vibration]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const needleStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -vibration.value * (size * 0.06) }],
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.ring,
          { width: size, height: size, borderRadius: size / 2, borderColor: colors.elevated, borderTopColor: color },
          ringStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.needle,
          { width: Math.max(3, size * 0.07), height: size * 0.36, borderRadius: size * 0.04, backgroundColor: color },
          needleStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 3,
  },
  needle: {
    opacity: 0.9,
  },
});

import { Settings } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { TattooMachineGlyph } from '@/components/ui/tattoo-machine-glyph';
import { colors } from '@/constants/theme';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';

/** Física de spring especificada no design original (Next.js). */
const SPRING = { stiffness: 460, damping: 30 } as const;

export interface TattooMachineMenuTriggerProps {
  /** Estado da gaveta de perfil. Fechada -> máquina; aberta -> engrenagem. */
  open: boolean;
  onPress: () => void;
  /** Lado do botão. Nunca menor que o alvo Apple-tier de 44px. */
  size?: number;
  accessibilityLabel?: string;
  testID?: string;
}

/**
 * Gatilho do menu de perfil (morphing machine <-> settings).
 *
 * Port nativo do `TattooMachineMenuTrigger` web: com a gaveta fechada exibe o
 * glifo da máquina; ao abrir, faz uma rotação 3D de 180° (`rotateY`) com
 * cross-fade + escala para revelar o ícone de engrenagem (`Settings`). A física
 * usa `withSpring({ stiffness: 460, damping: 30 })`, idêntica ao original.
 */
export function TattooMachineMenuTrigger({
  open,
  onPress,
  size = 44,
  accessibilityLabel = 'Abrir menu de perfil',
  testID,
}: TattooMachineMenuTriggerProps) {
  const { triggerHaptic } = useHapticFeedback();
  const progress = useSharedValue(open ? 1 : 0);
  const diameter = Math.max(size, 44);

  useEffect(() => {
    progress.value = withSpring(open ? 1 : 0, SPRING);
  }, [open, progress]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateY: `${interpolate(progress.value, [0, 1], [0, 180])}deg` },
    ],
  }));

  const machineStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5], [1, 0], 'clamp'),
    transform: [{ scale: interpolate(progress.value, [0, 0.5], [1, 0.55], 'clamp') }],
  }));

  const settingsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.5, 1], [0, 1], 'clamp'),
    transform: [{ scale: interpolate(progress.value, [0.5, 1], [0.55, 1], 'clamp') }],
  }));

  const iconLayer = { width: diameter, height: diameter };

  return (
    <Pressable
      testID={testID}
      onPress={() => {
        void triggerHaptic('light');
        onPress();
      }}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ expanded: open }}
      style={{ width: diameter, height: diameter, minWidth: 44, minHeight: 44 }}
      className="items-center justify-center rounded-full border border-line bg-surface active:bg-elevated">
      <Animated.View
        style={[iconLayer, { alignItems: 'center', justifyContent: 'center' }, containerStyle]}>
        <Animated.View
          pointerEvents="none"
          style={[iconLayer, styles.layer, machineStyle]}>
          <TattooMachineGlyph size={Math.round(diameter * 0.5)} color={colors.ink} />
        </Animated.View>
        <Animated.View pointerEvents="none" style={[iconLayer, styles.layer, settingsStyle]}>
          <Settings size={Math.round(diameter * 0.48)} color={colors.accent} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = {
  layer: {
    position: 'absolute' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
};

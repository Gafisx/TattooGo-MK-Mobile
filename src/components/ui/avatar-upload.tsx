import { Image } from 'expo-image';
import { Camera } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, G, Line, RadialGradient, Rect, Stop } from 'react-native-svg';

import { TattooMachineGlyph } from '@/components/ui/tattoo-machine-glyph';
import { colors } from '@/constants/theme';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';

export interface AvatarUploadProps {
  /** URI da imagem já enviada/selecionada. Quando ausente, cai no fallback. */
  uri?: string | null;
  /** Diâmetro do avatar. Default: `96` (área de toque bem acima do mínimo). */
  size?: number;
  /** Disparado ao tocar — deve abrir o seletor de imagem. */
  onPress?: () => void;
  /** Exibe o overlay de carregamento durante o upload. Default: `false`. */
  loading?: boolean;
  /** Rótulo de acessibilidade. Default: `'Alterar foto de perfil'`. */
  accessibilityLabel?: string;
  disabled?: boolean;
  testID?: string;
}

/** `bg-orange-500/10` do halo web (RadialGradient para o blur-xl simulado). */
const HALO_COLOR = 'rgba(249, 115, 22, 1)';

/** Física de spring partilhada com o `TattooMachineMenuTrigger`. */
const SPRING = { stiffness: 460, damping: 30 } as const;

const MANDALA_SPOKES = Array.from({ length: 12 }, (_, index) => index * 30);
const MANDALA_DOTS = Array.from({ length: 12 }, (_, index) => index * 30 + 15);

/**
 * Halo laranja + mandala geométrica que preenchem o fallback do avatar.
 * Equivale ao `blur-xl bg-orange-500/10` + SVG de referência do Next.js.
 */
function FallbackBackdrop({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id="avatar-halo" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={HALO_COLOR} stopOpacity={0.28} />
          <Stop offset="55%" stopColor={HALO_COLOR} stopOpacity={0.12} />
          <Stop offset="100%" stopColor={HALO_COLOR} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100" height="100" fill="url(#avatar-halo)" />
      <Circle cx="50" cy="50" r="45" stroke={colors.line} strokeWidth="1" fill="none" />
      <Circle
        cx="50"
        cy="50"
        r="33"
        stroke={colors.accent}
        strokeWidth="0.8"
        fill="none"
        opacity={0.5}
      />
      <Circle cx="50" cy="50" r="21" stroke={colors.line} strokeWidth="1" fill="none" />
      <G opacity={0.45}>
        {MANDALA_SPOKES.map((angle) => (
          <Line
            key={angle}
            x1="50"
            y1="50"
            x2="50"
            y2="5"
            stroke={colors.accent}
            strokeWidth="0.6"
            transform={`rotate(${angle} 50 50)`}
          />
        ))}
        {MANDALA_DOTS.map((angle) => (
          <Circle
            key={angle}
            cx="50"
            cy="12"
            r="1.3"
            fill={colors.accentSoft}
            transform={`rotate(${angle} 50 50)`}
          />
        ))}
      </G>
    </Svg>
  );
}

/**
 * Avatar de perfil com intenção de upload.
 *
 * Port nativo do `AvatarUpload` web: anel `ring-2 ring-zinc-800`
 * (`border-2 border-line`), halo laranja (`bg-orange-500/10` + `blur-xl`,
 * reproduzido com `RadialGradient`), mandala de fundo e glifo da máquina.
 * A área de toque respeita um mínimo generoso (>= 80px) e responde ao toque
 * com feedback de escala (`withSpring`), simulando a intenção de troca de foto.
 */
export function AvatarUpload({
  uri,
  size = 96,
  onPress,
  loading = false,
  accessibilityLabel = 'Alterar foto de perfil',
  disabled = false,
  testID,
}: AvatarUploadProps) {
  const { triggerHaptic } = useHapticFeedback();
  const scale = useSharedValue(1);
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    scale.value = withSpring(pressed ? 0.94 : 1, SPRING);
  }, [pressed, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const diameter = Math.max(size, 80);
  const glyphSize = Math.round(diameter * 0.42);
  const isBusy = disabled || loading;

  const handlePress = () => {
    if (isBusy) return;
    void triggerHaptic('light');
    onPress?.();
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        testID={testID}
        onPress={handlePress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        disabled={isBusy}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: isBusy, busy: loading }}
        style={{ width: diameter, height: diameter, minWidth: 80, minHeight: 80 }}
        className={`items-center justify-center overflow-hidden rounded-full border-2 border-line bg-surface ${
          disabled ? 'opacity-50' : ''
        }`}>
        {uri ? (
          <Image
            source={{ uri }}
            style={{ width: diameter, height: diameter }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <>
            <View style={StyleSheet.absoluteFill}>
              <FallbackBackdrop size={diameter} />
            </View>
            <TattooMachineGlyph size={glyphSize} color={colors.ink} />
          </>
        )}

        {!loading ? (
          <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full border-2 border-line bg-elevated">
            <Camera size={14} color={colors.accent} />
          </View>
        ) : null}

        {loading ? (
          <View className="absolute inset-0 items-center justify-center bg-canvas/60">
            <View className="h-5 w-5 rounded-full border-2 border-elevated border-t-accent" />
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

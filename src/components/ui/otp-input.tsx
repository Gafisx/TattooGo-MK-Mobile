import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

/**
 * Estados da "maquininha" de verificação (port das animações `framer-motion`
 * de `TattooOTPInput` para `react-native-reanimated`):
 *  - `idle`    -> ocioso
 *  - `buzzing` -> shake de leitura (vibração da maquininha)
 *  - `error`   -> código recusado (vermelho)
 *  - `success` -> código aprovado (verde)
 */
export type OTPState = 'idle' | 'buzzing' | 'error' | 'success';

export interface OTPInputProps {
  value: string;
  onChangeText: (value: string) => void;
  /** Quantidade de dígitos. Default: 6. */
  length?: number;
  state?: OTPState;
  autoFocus?: boolean;
  editable?: boolean;
  /** Disparado quando todos os dígitos foram preenchidos. */
  onFilled?: (code: string) => void;
  accessibilityLabel?: string;
}

const SHAKE_STEPS = [-9, 9, -7, 7, 0];

function OtpCell({
  digit,
  state,
  active,
}: {
  digit: string;
  state: OTPState;
  active: boolean;
}) {
  const filled = digit.length > 0;
  const pop = useSharedValue(filled ? 1 : 0);

  useEffect(() => {
    pop.value = withSpring(filled ? 1 : 0, { damping: 14, stiffness: 240 });
  }, [filled, pop]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pop.value * 0.06 }],
  }));

  const isError = state === 'error';
  const isSuccess = state === 'success';
  const border = isError
    ? 'border-danger'
    : isSuccess
      ? 'border-success'
      : active || filled
        ? 'border-accent'
        : 'border-line';
  const background = isError
    ? 'bg-danger/10'
    : isSuccess
      ? 'bg-success/10'
      : filled || active
        ? 'bg-accent-glow'
        : 'bg-elevated';
  const textColor = isError ? 'text-danger' : isSuccess ? 'text-success' : 'text-ink';

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <View className={`h-14 w-full items-center justify-center rounded-xl border ${border} ${background}`}>
        {filled ? (
          <Text className={`text-2xl font-semibold ${textColor}`}>{digit}</Text>
        ) : active ? (
          <View className="h-6 w-0.5 rounded-full bg-accent" />
        ) : null}
      </View>
    </Animated.View>
  );
}

/**
 * Entrada de OTP nativa com teclado numérico e feedback tátil.
 *
 * O `TextInput` real fica invisível sobre as células; o estado controlado pelo
 * pai dispara as animações de shake (`buzzing`) e as cores de `error`/`success`,
 * enquanto o `expo-haptics` vibra no ritmo da maquininha.
 */
export function OTPInput({
  value,
  onChangeText,
  length = 6,
  state = 'idle',
  autoFocus = false,
  editable = true,
  onFilled,
  accessibilityLabel,
}: OTPInputProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const shake = useSharedValue(0);

  const digits = useMemo(() => {
    const sanitized = value.replace(/\D/g, '').slice(0, length);
    return Array.from({ length }, (_, index) => sanitized[index] ?? '');
  }, [value, length]);

  const firstEmpty = digits.findIndex((digit) => digit === '');
  const activeIndex = firstEmpty === -1 ? length - 1 : firstEmpty;

  const handleChange = useCallback(
    (text: string) => {
      const sanitized = text.replace(/\D/g, '').slice(0, length);
      onChangeText(sanitized);
      if (sanitized.length === length) onFilled?.(sanitized);
    },
    [length, onChangeText, onFilled],
  );

  useEffect(() => {
    if (state === 'buzzing') {
      shake.value = withSequence(
        withTiming(SHAKE_STEPS[0]!, { duration: 45 }),
        withTiming(SHAKE_STEPS[1]!, { duration: 45 }),
        withTiming(SHAKE_STEPS[2]!, { duration: 45 }),
        withTiming(SHAKE_STEPS[3]!, { duration: 45 }),
        withTiming(SHAKE_STEPS[4]!, { duration: 70 }),
      );
    } else {
      shake.value = withTiming(0, { duration: 120 });
    }
  }, [state, shake]);

  useEffect(() => {
    const feedback =
      state === 'buzzing'
        ? Haptics.NotificationFeedbackType.Warning
        : state === 'error'
          ? Haptics.NotificationFeedbackType.Error
          : state === 'success'
            ? Haptics.NotificationFeedbackType.Success
            : null;
    if (feedback === null) return;
    Haptics.notificationAsync(feedback).catch(() => undefined);
  }, [state]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  return (
    <View>
      <Animated.View style={shakeStyle}>
        <View className="flex-row gap-2">
          {digits.map((digit, index) => (
            <OtpCell
              key={index}
              digit={digit}
              state={state}
              active={focused && index === activeIndex}
            />
          ))}
        </View>
      </Animated.View>
      <TextInput
        ref={inputRef}
        value={digits.join('')}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        inputMode="numeric"
        textContentType="oneTimeCode"
        maxLength={length}
        autoFocus={autoFocus}
        editable={editable}
        caretHidden
        accessibilityLabel={accessibilityLabel}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0 }}
      />
    </View>
  );
}

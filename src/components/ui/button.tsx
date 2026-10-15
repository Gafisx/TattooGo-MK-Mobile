import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View, type PressableProps } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: Variant;
  loading?: boolean;
  /** Optional leading element (e.g. a lucide icon rendered by the caller). */
  icon?: ReactNode;
}

const variantClass: Record<Variant, string> = {
  primary: 'bg-accent active:bg-accent-strong',
  secondary: 'bg-elevated border border-line active:bg-surface',
  ghost: 'bg-transparent active:bg-elevated',
};

const labelClass: Record<Variant, string> = {
  primary: 'text-canvas',
  secondary: 'text-ink',
  ghost: 'text-accent',
};

/**
 * QA de toque (Apple-tier): alvo mínimo de 44px e `hitSlop` de 10px em todos os
 * lados para evitar toques falhos ("fat-finger") em ecrãs pequenos.
 */
const DEFAULT_HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 } as const;
const MIN_TOUCH_TARGET = { minHeight: 44 } as const;

/** Hardware-accelerated pressable used across the app. */
export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  className,
  icon,
  hitSlop = DEFAULT_HIT_SLOP,
  ...props
}: ButtonProps & { className?: string }) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      hitSlop={hitSlop}
      style={MIN_TOUCH_TARGET}
      className={`h-12 flex-row items-center justify-center rounded-xl px-5 ${variantClass[variant]} ${
        isDisabled ? 'opacity-50' : ''
      } ${className ?? ''}`}
      {...props}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#0a0a0a' : '#fafafa'} />
      ) : (
        <>
          {icon ? <View className="mr-2">{icon}</View> : null}
          <Text className={`text-base font-semibold ${labelClass[variant]}`}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

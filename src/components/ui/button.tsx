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

/** Hardware-accelerated pressable used across the app. */
export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  className,
  icon,
  ...props
}: ButtonProps & { className?: string }) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
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

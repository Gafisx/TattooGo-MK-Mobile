import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: Variant;
  loading?: boolean;
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
        <Text className={`text-base font-semibold ${labelClass[variant]}`}>{label}</Text>
      )}
    </Pressable>
  );
}

import { Text, type TextProps } from 'react-native';

type Variant = 'title' | 'heading' | 'body' | 'muted' | 'label';

interface AppTextProps extends TextProps {
  variant?: Variant;
}

const variantClass: Record<Variant, string> = {
  title: 'text-3xl font-bold text-ink',
  heading: 'text-xl font-semibold text-ink',
  body: 'text-base text-ink',
  muted: 'text-sm text-subtle',
  label: 'text-xs font-medium uppercase tracking-widest text-muted',
};

/** Typed text primitive so every screen shares the same type scale. */
export function AppText({ variant = 'body', className, ...props }: AppTextProps) {
  return <Text className={`${variantClass[variant]} ${className ?? ''}`} {...props} />;
}

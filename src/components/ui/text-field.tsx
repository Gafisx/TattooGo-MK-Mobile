import { forwardRef, type ReactNode } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors } from '@/constants/theme';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  /** Error copy rendered under the field and switching the border to danger. */
  error?: string;
  /** Neutral helper copy shown when there is no error. */
  hint?: string;
  /** Optional trailing element (e.g. a password visibility toggle). */
  rightAccessory?: ReactNode;
}

/**
 * QA de toque (Apple-tier): alvo mínimo de 44px e `hitSlop` de 10px para que o
 * foco não falhe em toques ligeiramente fora do campo.
 */
const DEFAULT_HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 } as const;
const MIN_TOUCH_TARGET = { minHeight: 44 } as const;

/**
 * Dark-luxury text input shared by the auth forms. `react-hook-form` passes the
 * field props straight through, so this stays a thin, fully-controlled wrapper.
 */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, hint, rightAccessory, className, style, hitSlop = DEFAULT_HIT_SLOP, ...props },
  ref,
) {
  const borderClass = error ? 'border-danger' : 'border-line';

  return (
    <View className="gap-2">
      {label ? <AppText variant="label">{label}</AppText> : null}
      <View className={`flex-row items-center gap-2 rounded-2xl border bg-surface px-4 ${borderClass}`}>
        <TextInput
          ref={ref}
          placeholderTextColor={colors.muted}
          hitSlop={hitSlop}
          className={`h-12 flex-1 text-base text-ink ${className ?? ''}`}
          style={[MIN_TOUCH_TARGET, style]}
          {...props}
        />
        {rightAccessory}
      </View>
      {error ? (
        <AppText variant="muted" className="text-xs text-danger">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="muted" className="text-xs">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
});

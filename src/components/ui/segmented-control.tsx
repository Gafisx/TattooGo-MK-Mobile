import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Extra classes for the container (safe for margins used by a given screen). */
  className?: string;
  /** Haptic fired on change. Pass `false` to disable. Default: `'selection'`. */
  haptic?: false | 'light' | 'selection';
  testID?: string;
}

/**
 * Segmented control nativo (Dark Luxury) — primitivo oficial do app.
 *
 * Substitui as implementações inline que existiam espalhadas pelas telas
 * (dashboard do tatuador, workspace de agenda/pagamentos e o roteador de abas
 * do estúdio). O item ativo usa `bg-accent` + `text-canvas`; o inativo mantém
 * `text-muted` com `active:bg-elevated`. Genérico sobre `T extends string` para
 * que os arrays de opções e `onChange` fiquem tipados de ponta a ponta.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  haptic = 'selection',
  testID,
}: SegmentedControlProps<T>) {
  const { triggerHaptic } = useHapticFeedback();

  return (
    <View
      testID={testID}
      accessibilityRole="tablist"
      className={`flex-row rounded-xl border border-line bg-surface p-1 ${className ?? ''}`}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => {
              if (selected) return;
              if (haptic) void triggerHaptic(haptic);
              onChange(option.value);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            className={`flex-1 rounded-lg py-2 ${selected ? 'bg-accent' : 'active:bg-elevated'}`}>
            <AppText
              variant="body"
              className={`text-center text-sm font-semibold ${
                selected ? 'text-canvas' : 'text-muted'
              }`}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

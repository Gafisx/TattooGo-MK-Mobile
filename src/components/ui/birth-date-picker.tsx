import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors } from '@/constants/theme';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';
import { formatBirthDateFromDate, parseBirthDate } from '@/lib/validation';

/**
 * Apple-tier touch contract shared with `TextField`/`Button`: a 44px minimum
 * target plus a 10px `hitSlop` so the picker never swallows a near-miss tap.
 */
const DEFAULT_HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 } as const;
const MIN_TOUCH_TARGET = { minHeight: 44 } as const;

export interface BirthDatePickerProps {
  /** Field label rendered above the trigger. */
  label?: string;
  /** Current value in the app's canonical `DD/MM/AAAA` format. */
  value?: string;
  /** Emits the selected date in `DD/MM/AAAA`. */
  onChange: (value: string) => void;
  /** Error copy rendered below the field (switches the border to danger). */
  error?: string;
  /** Neutral helper copy shown when there is no error. */
  hint?: string;
  placeholder?: string;
  /** Earliest selectable date. Default: 1900-01-01. */
  minimumDate?: Date;
  /** Latest selectable date. Default: today. */
  maximumDate?: Date;
  disabled?: boolean;
  testID?: string;
  /** Extra classes for the outer wrapper. */
  className?: string;
}

function defaultDate(): Date {
  const fallback = new Date();
  fallback.setHours(0, 0, 0, 0);
  return fallback;
}

/**
 * Native birth-date field.
 *
 * Renders a design-system trigger (same skin as `TextField`) that opens the
 * platform calendar: on Android the system dialog via `DateTimePickerAndroid`,
 * on iOS a dark bottom-sheet hosting the inline `DateTimePicker` spinner. The
 * component stays fully controlled and speaks the app's `DD/MM/AAAA` contract.
 */
export function BirthDatePicker({
  label,
  value,
  onChange,
  error,
  hint,
  placeholder = 'DD/MM/AAAA',
  minimumDate,
  maximumDate,
  disabled = false,
  testID,
  className,
}: BirthDatePickerProps) {
  const { triggerHaptic } = useHapticFeedback();
  const [iosVisible, setIosVisible] = useState(false);
  const [iosDraft, setIosDraft] = useState<Date>(() => defaultDate());

  const min = minimumDate ?? new Date(1900, 0, 1);
  const max = maximumDate ?? new Date();

  const selected = parseBirthDate(value ?? '') ?? null;
  const current = selected ?? max;

  const commit = (date: Date) => {
    void triggerHaptic('light');
    onChange(formatBirthDateFromDate(date));
  };

  const open = () => {
    if (disabled) return;
    void triggerHaptic('selection');

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode: 'date',
        display: 'calendar',
        minimumDate: min,
        maximumDate: max,
        onChange: (event: DateTimePickerEvent, date?: Date) => {
          if (event.type === 'set' && date) commit(date);
        },
      });
      return;
    }

    setIosDraft(current);
    setIosVisible(true);
  };

  const borderClass = error ? 'border-danger' : 'border-line';

  return (
    <View className={`gap-2 ${className ?? ''}`}>
      {label ? <AppText variant="label">{label}</AppText> : null}

      <Pressable
        testID={testID}
        onPress={open}
        disabled={disabled}
        hitSlop={DEFAULT_HIT_SLOP}
        accessibilityRole="button"
        accessibilityLabel={label ?? 'Data de nascimento'}
        accessibilityValue={{ text: selected ? formatBirthDateFromDate(selected) : placeholder }}
        accessibilityState={{ disabled }}
        style={MIN_TOUCH_TARGET}
        className={`h-12 flex-row items-center justify-between rounded-2xl border bg-surface px-4 active:bg-elevated ${borderClass} ${
          disabled ? 'opacity-50' : ''
        }`}>
        <AppText
          variant="body"
          className={selected ? 'text-base text-ink' : 'text-base text-muted'}>
          {selected ? formatBirthDateFromDate(selected) : placeholder}
        </AppText>
        <Ionicons name="calendar-outline" size={20} color={colors.muted} />
      </Pressable>

      {error ? (
        <AppText variant="muted" className="text-xs text-danger">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="muted" className="text-xs">
          {hint}
        </AppText>
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal
          visible={iosVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIosVisible(false)}>
          <Pressable
            style={StyleSheet.absoluteFill}
            className="bg-black/90"
            onPress={() => setIosVisible(false)}
            accessibilityRole="button"
            accessibilityLabel="Fechar seletor de data"
          />
          <View className="flex-1 justify-end">
            <View className="overflow-hidden rounded-t-3xl border border-zinc-800 bg-zinc-900 pb-6">
              <View className="flex-row items-center justify-between border-b border-zinc-800 px-5 py-4">
                <Pressable
                  hitSlop={12}
                  onPress={() => setIosVisible(false)}
                  accessibilityRole="button">
                  <AppText variant="body" className="text-muted">
                    Cancelar
                  </AppText>
                </Pressable>
                <AppText variant="body" className="font-semibold">
                  {label ?? 'Data de nascimento'}
                </AppText>
                <Pressable
                  hitSlop={12}
                  onPress={() => {
                    commit(iosDraft);
                    setIosVisible(false);
                  }}
                  accessibilityRole="button">
                  <AppText variant="body" className="font-semibold text-accent">
                    Concluir
                  </AppText>
                </Pressable>
              </View>

              <DateTimePicker
                value={iosDraft}
                mode="date"
                display="spinner"
                themeVariant="dark"
                accentColor={colors.accent}
                minimumDate={min}
                maximumDate={max}
                onChange={(_event: DateTimePickerEvent, date?: Date) => {
                  if (date) setIosDraft(date);
                }}
              />
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

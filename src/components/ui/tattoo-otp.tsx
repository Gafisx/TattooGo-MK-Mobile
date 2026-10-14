import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { OTPInput, type OTPState } from '@/components/ui/otp-input';

export interface TattooOTPInputProps {
  value: string;
  onChangeText: (value: string) => void;
  onFilled?: (code: string) => void;
  state?: OTPState;
  length?: number;
  label?: string;
  hint?: string;
  errorMessage?: string;
  successMessage?: string;
  autoFocus?: boolean;
  editable?: boolean;
}

/**
 * Wrapper "Tattoo" do `OTPInput`: adiciona rótulo e a mensagem de feedback
 * (dica / erro / sucesso) colorida conforme o estado da maquininha.
 */
export function TattooOTPInput({
  value,
  onChangeText,
  onFilled,
  state = 'idle',
  length = 6,
  label,
  hint,
  errorMessage,
  successMessage,
  autoFocus,
  editable,
}: TattooOTPInputProps) {
  const message =
    state === 'error' ? errorMessage : state === 'success' ? successMessage : hint;
  const messageClass =
    state === 'error' ? 'text-danger' : state === 'success' ? 'text-success' : 'text-muted';

  return (
    <View className="gap-2">
      {label ? <AppText variant="label">{label}</AppText> : null}
      <OTPInput
        value={value}
        onChangeText={onChangeText}
        onFilled={onFilled}
        state={state}
        length={length}
        autoFocus={autoFocus}
        editable={editable}
        accessibilityLabel={label}
      />
      {message ? (
        <AppText variant="muted" className={`text-xs ${messageClass}`}>
          {message}
        </AppText>
      ) : null}
    </View>
  );
}

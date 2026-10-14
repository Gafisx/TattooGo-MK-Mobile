import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { TattooOTPInput } from '@/components/ui/tattoo-otp';
import type { OTPState } from '@/components/ui/otp-input';

export interface AuthOtpPanelProps {
  title: string;
  subtitle: string;
  code: string;
  onChangeCode: (value: string) => void;
  onFilled?: (code: string) => void;
  state?: OTPState;
  hint?: string;
  errorMessage?: string;
  successMessage?: string;
  submitting?: boolean;
  verifyLabel?: string;
  onVerify: () => void;
  onResend?: () => void;
  onBack: () => void;
}

/**
 * Shared OTP step for sign-up/sign-in. It owns the reserved stage for the
 * interactive 3D tattoo-machine animation and hosts the `TattooOTPInput`.
 */
export function AuthOtpPanel({
  title,
  subtitle,
  code,
  onChangeCode,
  onFilled,
  state = 'idle',
  hint,
  errorMessage,
  successMessage,
  submitting = false,
  verifyLabel = 'Confirmar código',
  onVerify,
  onResend,
  onBack,
}: AuthOtpPanelProps) {
  return (
    <View className="flex-1">
      {/* TODO(3D): Inject 3D/Rive Tattoo Machine here */}
      <View className="h-64 w-full items-center justify-center rounded-3xl border border-line bg-surface/60">
        <AppText variant="muted" className="text-xs uppercase tracking-widest">
          Máquina de tatuagem
        </AppText>
      </View>

      <View className="mt-8 gap-2">
        <AppText variant="title">{title}</AppText>
        <AppText variant="muted">{subtitle}</AppText>
      </View>

      <View className="mt-8">
        <TattooOTPInput
          value={code}
          onChangeText={onChangeCode}
          onFilled={onFilled}
          state={state}
          autoFocus
          editable={!submitting}
          hint={hint}
          errorMessage={errorMessage}
          successMessage={successMessage}
        />
      </View>

      <View className="mt-auto gap-3 pb-6">
        <Button label={verifyLabel} loading={submitting} onPress={onVerify} />
        {onResend ? <Button label="Reenviar código" variant="ghost" disabled={submitting} onPress={onResend} /> : null}
        <Button label="Voltar" variant="ghost" disabled={submitting} onPress={onBack} />
      </View>
    </View>
  );
}

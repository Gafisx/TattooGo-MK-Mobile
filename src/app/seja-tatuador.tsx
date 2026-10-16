import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { colors } from '@/constants/theme';
import { OTP_LENGTH, formatCNPJ, isValidCNPJ, isValidOTP, onlyDigits } from '@/lib/validation';

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  maxLength,
  valid,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'number-pad';
  maxLength?: number;
  valid?: boolean;
}) {
  return (
    <View className="gap-2">
      <AppText variant="label">{label}</AppText>
      <View className="flex-row items-center gap-2 rounded-2xl border border-line bg-surface px-4">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          keyboardType={keyboardType ?? 'default'}
          maxLength={maxLength}
          className="h-12 flex-1 text-base text-ink"
        />
        {valid ? <Ionicons name="checkmark-circle" size={18} color={colors.success} /> : null}
      </View>
    </View>
  );
}

export default function SejaTatuadorScreen() {
  const [name, setName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [otp, setOtp] = useState('');

  const cnpjValid = useMemo(() => isValidCNPJ(cnpj), [cnpj]);
  const otpValid = useMemo(() => isValidOTP(otp), [otp]);
  const canSubmit = name.trim().length > 2 && cnpjValid && otpValid;

  return (
    <Screen>
      <View className="flex-row items-center justify-between py-2">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <AppText variant="heading">Seja um tatuador</AppText>
        <View style={{ width: 24 }} />
      </View>

      <View className="mt-6 gap-5">
        <Field label="Nome profissional" value={name} onChangeText={setName} placeholder="Seu nome" />
        <Field
          label="CNPJ"
          value={cnpj}
          onChangeText={(text) => setCnpj(formatCNPJ(text))}
          placeholder="00.000.000/0000-00"
          keyboardType="number-pad"
          maxLength={18}
          valid={cnpjValid}
        />
        <Field
          label={`Código enviado por SMS (${OTP_LENGTH} dígitos)`}
          value={otp}
          onChangeText={(text) => setOtp(onlyDigits(text))}
          placeholder="000000"
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          valid={otpValid}
        />
      </View>

      <View className="mt-auto pb-6">
        <Button label="Enviar para análise" disabled={!canSubmit} onPress={() => router.push('/kyc-verificacao')} />
      </View>
    </Screen>
  );
}

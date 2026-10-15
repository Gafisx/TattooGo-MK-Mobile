import { Ionicons } from '@expo/vector-icons';
import { useAuth, useSignIn } from '@clerk/clerk-expo';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthDevNotice } from '@/components/features/auth-dev-notice';
import { AuthOtpPanel } from '@/components/features/auth-otp-panel';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { MagicUsernameInput } from '@/components/ui/magic-username-input';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { colors } from '@/constants/theme';
import { clerkErrorMessage } from '@/lib/auth/clerk-errors';
import { loginSchema, type LoginFormValues } from '@/lib/auth/schemas';
import { wipeStaleSession } from '@/lib/auth/session';
import { isAuthConfigured } from '@/providers/app-providers';

type OtpStage = 'first' | 'second';
type IdentifierMode = 'email' | 'username';

interface PreparedFactor {
  stage: OtpStage;
  emailAddressId: string;
}

/** Alvo de toque Apple-tier partilhado pelos chips do seletor de identificador. */
const TOUCH_SLOP = { top: 10, bottom: 10, left: 10, right: 10 } as const;
const MIN_TOUCH_TARGET: ViewStyle = {
  minHeight: 44,
  minWidth: 44,
  alignItems: 'center',
  justifyContent: 'center',
};

/**
 * Tela de login nativa (SignIn + OTP). Faz `signIn.create` com
 * e-mail/@username + palavra-passe; quando o Clerk exige um factor de e-mail,
 * prepara o código (`prepareFirstFactor`/`prepareSecondFactor`) e conclui com
 * `attemptFirstFactor`/`attemptSecondFactor` seguido de `setActive`.
 */
function ClerkLoginScreen() {
  const { isLoaded: authLoaded, signOut } = useAuth();
  const { isLoaded: signInLoaded, signIn, setActive } = useSignIn();
  const isLoaded = authLoaded && signInLoaded;
  const insets = useSafeAreaInsets();

  const [factor, setFactor] = useState<PreparedFactor | null>(null);
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<IdentifierMode>('email');

  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const switchMode = (next: IdentifierMode) => {
    if (next === mode) return;
    setMode(next);
    setValue('identifier', '', { shouldValidate: false });
  };

  const beginOtp = (next: PreparedFactor) => {
    setFactor(next);
    setStep('otp');
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!isLoaded || !signIn || !setActive) return;
    setFormError(null);

    try {
      await wipeStaleSession({ signOut });

      // O Clerk identifica username sem o prefixo `@`.
      const rawIdentifier = values.identifier.trim();
      const attempt = await signIn.create({
        identifier: rawIdentifier.startsWith('@') ? rawIdentifier.slice(1) : rawIdentifier,
        password: values.password,
      });

      if (attempt.status === 'complete' && attempt.createdSessionId) {
        await setActive({ session: attempt.createdSessionId });
        router.replace('/');
        return;
      }

      const firstFactor = attempt.supportedFirstFactors?.find(
        (factor) => factor.strategy === 'email_code',
      );
      if (firstFactor && 'emailAddressId' in firstFactor) {
        await signIn.prepareFirstFactor({
          strategy: 'email_code',
          emailAddressId: firstFactor.emailAddressId,
        });
        beginOtp({ stage: 'first', emailAddressId: firstFactor.emailAddressId });
        return;
      }

      const secondFactor = attempt.supportedSecondFactors?.find(
        (factor) => factor.strategy === 'email_code',
      );
      if (secondFactor && 'emailAddressId' in secondFactor) {
        await signIn.prepareSecondFactor({
          strategy: 'email_code',
          emailAddressId: secondFactor.emailAddressId,
        });
        beginOtp({ stage: 'second', emailAddressId: secondFactor.emailAddressId });
        return;
      }

      setFormError('Não foi possível concluir a autenticação. Verifique os seus dados.');
    } catch (error) {
      setFormError(clerkErrorMessage(error));
    }
  });

  if (!isLoaded) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <AppText variant="muted">A preparar o login…</AppText>
        </View>
      </Screen>
    );
  }

  if (step === 'otp') {
    return (
      <Screen>
        <AuthOtpPanel
          mode="signIn"
          title="Verificação em dois passos"
          subtitle={`Introduza o código enviado para ${getValues('identifier')}.`}
          factorStage={factor?.stage}
          emailAddressId={factor?.emailAddressId}
          verifyLabel="Confirmar código"
          onBack={() => setStep('form')}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      {/*
        Keyboard Avoiding (QA humano): `padding` no iOS desloca o conteúdo com o
        teclado; `height` no Android encolhe a área. O ScrollView interno garante
        que o botão "Entrar" continua alcançável com o teclado aberto em ecrãs
        baixos (o utilizador pode rolar até ele).
      */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top}
        style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 32 + insets.bottom,
          }}>
          {/* Auth screen centralizado numa coluna `max-w-md` (mx-auto). */}
          <View className="mx-auto w-full max-w-md">
            <View className="mt-6 gap-2">
              <AppText variant="label">TattooGo MK</AppText>
              <AppText variant="title">Bem-vindo de volta</AppText>
              <AppText variant="muted">Entra para gerir a tua agenda e portfólio.</AppText>
            </View>

            {/* Seletor de identificador: e-mail ou @username. */}
            <View className="mt-6 flex-row gap-2">
              {(
                [
                  { value: 'email', label: 'E-mail', icon: 'mail-outline' },
                  { value: 'username', label: '@username', icon: 'at-outline' },
                ] as const
              ).map((option) => {
                const active = mode === option.value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => switchMode(option.value)}
                    hitSlop={TOUCH_SLOP}
                    style={MIN_TOUCH_TARGET}
                    className={`flex-1 flex-row items-center justify-center gap-2 rounded-2xl border px-4 py-2 ${
                      active ? 'border-accent bg-accent-glow' : 'border-line bg-surface'
                    }`}>
                    <Ionicons
                      name={option.icon}
                      size={18}
                      color={active ? colors.accent : colors.muted}
                    />
                    <AppText
                      className={`text-sm font-semibold ${
                        active ? 'text-accent' : 'text-muted'
                      }`}>
                      {option.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            <View className="mt-6 gap-5">
              <Controller
                control={control}
                name="identifier"
                render={({ field: { value, onChange, onBlur }, fieldState: { error } }) =>
                  mode === 'username' ? (
                    <MagicUsernameInput
                      label="Username"
                      value={value.replace(/^@/, '')}
                      onChangeText={(next) => onChange(next ? `@${next}` : '')}
                      onBlur={onBlur}
                      placeholder="oseuusername"
                      hint="Entra com o teu @username e palavra-passe."
                      error={error?.message}
                    />
                  ) : (
                    <TextField
                      label="E-mail"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="voce@email.com"
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      textContentType="emailAddress"
                      error={error?.message}
                    />
                  )
                }
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
                  <TextField
                    label="Palavra-passe"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="A sua palavra-passe"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="password"
                    error={error?.message}
                    rightAccessory={
                      <Pressable
                        onPress={() => setShowPassword((prev) => !prev)}
                        hitSlop={TOUCH_SLOP}
                        accessibilityRole="button"
                        accessibilityLabel={
                          showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'
                        }
                        style={MIN_TOUCH_TARGET}>
                        <Ionicons
                          name={showPassword ? 'eye-off' : 'eye'}
                          size={20}
                          color={colors.muted}
                        />
                      </Pressable>
                    }
                  />
                )}
              />
            </View>

            {formError ? (
              <AppText variant="muted" className="mt-4 text-xs text-danger">
                {formError}
              </AppText>
            ) : null}

            <View className="mt-6 gap-3">
              <Button label="Entrar" loading={isSubmitting} onPress={onSubmit} />
              <Button
                label="Criar uma conta"
                variant="ghost"
                disabled={isSubmitting}
                onPress={() => router.replace('/register')}
              />
            </View>

            {errors.root?.message ? (
              <AppText variant="muted" className="mt-3 text-xs text-danger">
                {errors.root.message}
              </AppText>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

export default function LoginScreen() {
  if (!isAuthConfigured) return <AuthDevNotice />;
  return <ClerkLoginScreen />;
}

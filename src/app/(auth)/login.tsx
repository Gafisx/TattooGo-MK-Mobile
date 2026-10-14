import { Ionicons } from '@expo/vector-icons';
import { useAuth, useSignIn } from '@clerk/clerk-expo';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';

import { AuthDevNotice } from '@/components/features/auth-dev-notice';
import { AuthOtpPanel } from '@/components/features/auth-otp-panel';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import type { OTPState } from '@/components/ui/otp-input';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { colors } from '@/constants/theme';
import { clerkErrorMessage } from '@/lib/auth/clerk-errors';
import { loginSchema, type LoginFormValues } from '@/lib/auth/schemas';
import { wipeStaleSession } from '@/lib/auth/session';
import { isAuthConfigured } from '@/providers/app-providers';

type OtpStage = 'first' | 'second';

interface PreparedFactor {
  stage: OtpStage;
  emailAddressId: string;
}

/**
 * Tela de login nativa (SignIn + OTP). Faz `signIn.create` com
 * e-mail/palavra-passe; quando o Clerk exige um factor de e-mail, prepara o
 * código (`prepareFirstFactor`/`prepareSecondFactor`) e conclui com
 * `attemptFirstFactor`/`attemptSecondFactor` seguido de `setActive`.
 */
function ClerkLoginScreen() {
  const { isLoaded: authLoaded, signOut } = useAuth();
  const { isLoaded: signInLoaded, signIn, setActive } = useSignIn();
  const isLoaded = authLoaded && signInLoaded;

  const [factor, setFactor] = useState<PreparedFactor | null>(null);
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [code, setCode] = useState('');
  const [otpState, setOtpState] = useState<OTPState>('idle');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const beginOtp = (next: PreparedFactor) => {
    setFactor(next);
    setCode('');
    setOtpState('idle');
    setOtpError(null);
    setStep('otp');
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!isLoaded || !signIn || !setActive) return;
    setFormError(null);

    try {
      await wipeStaleSession({ signOut });

      const attempt = await signIn.create({
        identifier: values.email,
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

  const handleVerify = async () => {
    if (!isLoaded || !signIn || !setActive) return;
    if (!factor) return;

    setSubmitting(true);
    setOtpError(null);
    setOtpState('idle');

    try {
      const result =
        factor.stage === 'second'
          ? await signIn.attemptSecondFactor({ strategy: 'email_code', code })
          : await signIn.attemptFirstFactor({ strategy: 'email_code', code });

      if (result.status === 'complete' && result.createdSessionId) {
        setOtpState('success');
        await setActive({ session: result.createdSessionId });
        router.replace('/');
        return;
      }

      if (result.status === 'needs_second_factor') {
        const secondFactor = result.supportedSecondFactors?.find(
          (candidate) => candidate.strategy === 'email_code',
        );
        if (secondFactor && 'emailAddressId' in secondFactor) {
          await signIn.prepareSecondFactor({
            strategy: 'email_code',
            emailAddressId: secondFactor.emailAddressId,
          });
          beginOtp({ stage: 'second', emailAddressId: secondFactor.emailAddressId });
          return;
        }
      }

      setOtpState('error');
      setOtpError('Código incorreto. Tente novamente.');
    } catch (error) {
      setOtpState('error');
      setOtpError(clerkErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!isLoaded || !signIn) return;
    if (!factor) return;

    setSubmitting(true);
    setOtpError(null);

    try {
      if (factor.stage === 'second') {
        await signIn.prepareSecondFactor({
          strategy: 'email_code',
          emailAddressId: factor.emailAddressId,
        });
      } else {
        await signIn.prepareFirstFactor({
          strategy: 'email_code',
          emailAddressId: factor.emailAddressId,
        });
      }
      setCode('');
      setOtpState('idle');
    } catch (error) {
      setOtpError(clerkErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

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
          title="Verificação em dois passos"
          subtitle={`Introduza o código enviado para ${getValues('email')}.`}
          code={code}
          onChangeCode={(value) => {
            setCode(value);
            if (otpState !== 'idle') setOtpState('idle');
            if (otpError) setOtpError(null);
          }}
          state={otpState}
          errorMessage={otpError ?? undefined}
          submitting={submitting}
          verifyLabel="Confirmar código"
          onVerify={handleVerify}
          onResend={handleResend}
          onBack={() => setStep('form')}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}>
          <View className="mt-6 gap-2">
            <AppText variant="label">TattooGo MK</AppText>
            <AppText variant="title">Bem-vindo de volta</AppText>
            <AppText variant="muted">Entra para gerir a tua agenda e portfólio.</AppText>
          </View>

          <View className="mt-8 gap-5">
            <Controller
              control={control}
              name="email"
              render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
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
              )}
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
                    <Pressable onPress={() => setShowPassword((prev) => !prev)} hitSlop={12}>
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
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

export default function LoginScreen() {
  if (!isAuthConfigured) return <AuthDevNotice />;
  return <ClerkLoginScreen />;
}

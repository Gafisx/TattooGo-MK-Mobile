import { useSignIn, useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import type { OTPState } from '@/components/ui/otp-input';
import { TattooMachine3D } from '@/components/ui/tattoo-machine-3d';
import { TattooOTPInput } from '@/components/ui/tattoo-otp';
import { clerkErrorMessage } from '@/lib/auth/clerk-errors';

/** Quantidade de dígitos do código OTP. */
const OTP_LENGTH = 6;
/** Pausa após o sucesso para a máquina concluir a animação antes do redirect. */
const SUCCESS_REDIRECT_DELAY_MS = 1800;
/** Tempo que o "spray" vermelho de erro fica no ecrã antes de voltar a idle. */
const ERROR_RESET_DELAY_MS = 2000;

export type AuthOtpMode = 'signIn' | 'signUp';

export interface AuthOtpPanelProps {
  /** Fluxo Clerk a concluir com o código: login ou registo. */
  mode: AuthOtpMode;
  title: string;
  subtitle: string;
  /** Estágio do factor de e-mail no login (`first` por omissão). */
  factorStage?: 'first' | 'second';
  /** Id do factor de e-mail, necessário para reenviar códigos no login. */
  emailAddressId?: string;
  verifyLabel?: string;
  resendLabel?: string;
  backLabel?: string;
  /** Invocado logo após `setActive`, para reconciliação local (role/KYC). */
  onAuthenticated?: () => void | Promise<void>;
  onBack: () => void;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Passo de OTP partilhado por login e registo. Além de alojar a animação 3D da
 * máquina de tatuagem, é ele que fala com o Clerk (`useSignIn`/`useSignUp`):
 *
 * - ao preencher o último dígito dispara a verificação automaticamente;
 * - enquanto a Promise do Clerk corre a máquina entra em `buzzing`;
 * - no sucesso mostra `success`, ativa a sessão e faz `router.replace`;
 * - no erro mostra `error` (spray vermelho), limpa o input e volta a `idle`.
 */
export function AuthOtpPanel({
  mode,
  title,
  subtitle,
  factorStage,
  emailAddressId,
  verifyLabel = mode === 'signUp' ? 'Confirmar registo' : 'Confirmar código',
  resendLabel = 'Reenviar código',
  backLabel = 'Voltar',
  onAuthenticated,
  onBack,
}: AuthOtpPanelProps) {
  const router = useRouter();
  const signInFlow = useSignIn();
  const signUpFlow = useSignUp();

  const isSignUp = mode === 'signUp';
  const isLoaded = isSignUp ? signUpFlow.isLoaded : signInFlow.isLoaded;
  const setActive = isSignUp ? signUpFlow.setActive : signInFlow.setActive;

  const [code, setCode] = useState('');
  const [otpState, setOtpState] = useState<OTPState>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stage, setStage] = useState<'first' | 'second'>(factorStage ?? 'first');
  const [factorId, setFactorId] = useState<string | undefined>(emailAddressId);

  const verifyingRef = useRef(false);
  const mountedRef = useRef(true);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearResetTimer = useCallback(() => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearResetTimer();
    };
  }, [clearResetTimer]);

  /** Recolhe o teclado para dar visão limpa do modelo 3D a reagir. */
  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const showError = useCallback(
    (message: string) => {
      if (!mountedRef.current) return;
      setOtpState('error');
      setErrorMessage(message);
      setCode('');
      clearResetTimer();
      resetTimerRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        setOtpState('idle');
        setErrorMessage(null);
      }, ERROR_RESET_DELAY_MS);
    },
    [clearResetTimer],
  );

  const handleVerifyOTP = useCallback(
    async (nextCode: string) => {
      if (verifyingRef.current || !isLoaded || !setActive) return;
      if (nextCode.length !== OTP_LENGTH) return;

      dismissKeyboard();
      clearResetTimer();
      verifyingRef.current = true;
      setSubmitting(true);
      setErrorMessage(null);
      setOtpState('buzzing');

      const finalize = async (sessionId: string) => {
        // Deixa a animação de comemoração/tinta final correr antes de ativar a
        // sessão: assim o `AuthGate` não redireciona e corta o `success`.
        setOtpState('success');
        await delay(SUCCESS_REDIRECT_DELAY_MS);
        await setActive({ session: sessionId });
        await onAuthenticated?.();
        if (mountedRef.current) router.replace('/(tabs)');
      };

      try {
        if (isSignUp) {
          const signUp = signUpFlow.signUp;
          if (!signUp) return;
          const result = await signUp.attemptVerification({
            strategy: 'email_code',
            code: nextCode,
          });
          if (result.status === 'complete' && result.createdSessionId) {
            await finalize(result.createdSessionId);
            return;
          }
          showError(
            'Não foi possível concluir o registo. Verifique o código e tente novamente.',
          );
          return;
        }

        const signIn = signInFlow.signIn;
        if (!signIn) return;
        const result =
          stage === 'second'
            ? await signIn.attemptSecondFactor({ strategy: 'email_code', code: nextCode })
            : await signIn.attemptFirstFactor({ strategy: 'email_code', code: nextCode });

        if (result.status === 'complete' && result.createdSessionId) {
          await finalize(result.createdSessionId);
          return;
        }

        if (result.status === 'needs_second_factor') {
          const second = result.supportedSecondFactors?.find(
            (candidate) => candidate.strategy === 'email_code',
          );
          if (second && 'emailAddressId' in second) {
            await signIn.prepareSecondFactor({
              strategy: 'email_code',
              emailAddressId: second.emailAddressId,
            });
            setStage('second');
            setFactorId(second.emailAddressId);
            setCode('');
            setOtpState('idle');
            return;
          }
        }

        showError('Código incorreto. Tente novamente.');
      } catch (error) {
        showError(clerkErrorMessage(error));
      } finally {
        verifyingRef.current = false;
        if (mountedRef.current) setSubmitting(false);
      }
    },
    [
      clearResetTimer,
      dismissKeyboard,
      isLoaded,
      isSignUp,
      onAuthenticated,
      router,
      setActive,
      showError,
      signInFlow.signIn,
      signUpFlow.signUp,
      stage,
    ],
  );

  const handleChangeCode = useCallback(
    (value: string) => {
      if (verifyingRef.current) return;
      setCode(value.replace(/\D/g, '').slice(0, OTP_LENGTH));
      if (errorMessage) setErrorMessage(null);
      clearResetTimer();
      setOtpState('idle');
    },
    [clearResetTimer, errorMessage],
  );

  const handleResend = useCallback(async () => {
    if (!isLoaded || submitting) return;
    setSubmitting(true);
    setErrorMessage(null);
    clearResetTimer();

    try {
      if (isSignUp) {
        const signUp = signUpFlow.signUp;
        if (!signUp) return;
        await signUp.prepareVerification({ strategy: 'email_code' });
      } else {
        const signIn = signInFlow.signIn;
        if (!signIn || !factorId) return;
        if (stage === 'second') {
          await signIn.prepareSecondFactor({ strategy: 'email_code', emailAddressId: factorId });
        } else {
          await signIn.prepareFirstFactor({ strategy: 'email_code', emailAddressId: factorId });
        }
      }
      setCode('');
      setOtpState('idle');
    } catch (error) {
      showError(clerkErrorMessage(error));
    } finally {
      if (mountedRef.current) setSubmitting(false);
    }
  }, [
    clearResetTimer,
    factorId,
    isLoaded,
    isSignUp,
    showError,
    signInFlow.signIn,
    signUpFlow.signUp,
    stage,
    submitting,
  ]);

  return (
    <View className="flex-1">
      {/* Máquina de tatuagem 3D: reage ao estado do código OTP (idle/buzzing/error/success). */}
      <View className="h-64 w-full overflow-hidden rounded-3xl border border-line bg-surface/60">
        <TattooMachine3D
          status={otpState}
          currentDigit={code.length > 0 ? code[code.length - 1] : undefined}
          drawKey={code.length}
          style={{ flex: 1 }}
        />
      </View>

      <View className="mt-8 gap-2">
        <AppText variant="title">{title}</AppText>
        <AppText variant="muted">{subtitle}</AppText>
      </View>

      <View className="mt-8">
        <TattooOTPInput
          value={code}
          onChangeText={handleChangeCode}
          onFilled={handleVerifyOTP}
          state={otpState}
          length={OTP_LENGTH}
          autoFocus
          editable={!submitting}
          errorMessage={errorMessage ?? undefined}
        />
      </View>

      <View className="mt-auto gap-3 pb-6">
        <Button
          label={verifyLabel}
          loading={submitting}
          disabled={code.length !== OTP_LENGTH}
          onPress={() => handleVerifyOTP(code)}
        />
        <Button
          label={resendLabel}
          variant="ghost"
          disabled={submitting}
          onPress={handleResend}
        />
        <Button label={backLabel} variant="ghost" disabled={submitting} onPress={onBack} />
      </View>
    </View>
  );
}

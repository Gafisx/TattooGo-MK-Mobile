import { Ionicons } from '@expo/vector-icons';
import { useAuth, useSignUp } from '@clerk/clerk-expo';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';

import { AuthDevNotice } from '@/components/features/auth-dev-notice';
import { AuthOtpPanel } from '@/components/features/auth-otp-panel';
import { RoleSelector } from '@/components/features/role-selector';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { colors } from '@/constants/theme';
import { clerkErrorMessage } from '@/lib/auth/clerk-errors';
import { registerSchema, type RegisterFormValues } from '@/lib/auth/schemas';
import { wipeStaleSession } from '@/lib/auth/session';
import { reconcileSession } from '@/lib/session-store';
import type { AppRole } from '@/lib/utils/dashboard-gate';
import { formatBirthDate, formatCNPJ, formatCPF, onlyDigits } from '@/lib/validation';
import { isAuthConfigured } from '@/providers/app-providers';

function initialKycStatus(role: AppRole): 'nao_aplicavel' | 'pendente' {
  return role === 'cliente' ? 'nao_aplicavel' : 'pendente';
}

/**
 * Tela de registo nativa. Traduz o fluxo da Web para o Clerk Expo:
 * `signUp.create` -> `signUp.prepareVerification` -> `signUp.attemptVerification`
 * -> `setActive`. O `RoleSelector` define a `role` (unsafeMetadata) e o documento
 * exigido (CPF para cliente, CNPJ para tatuador/estúdio).
 */
function ClerkRegisterScreen() {
  const { isLoaded: authLoaded, signOut } = useAuth();
  const { isLoaded: signUpLoaded, signUp } = useSignUp();
  const isLoaded = authLoaded && signUpLoaded;

  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'cliente',
      nome: '',
      email: '',
      password: '',
      cpf: '',
      cnpj: '',
      dataNascimento: '',
    },
  });

  const role = useWatch({ control, name: 'role' }) ?? 'cliente';

  const onSubmit = handleSubmit(async (values) => {
    if (!isLoaded || !signUp) return;
    setFormError(null);

    try {
      // A sessão presa no dispositivo faz o Clerk recusar com `session_exists`.
      await wipeStaleSession({ signOut });

      const [firstName, ...rest] = values.nome.trim().split(/\s+/);
      const lastName = rest.join(' ') || undefined;

      await signUp.create({
        emailAddress: values.email,
        password: values.password,
        firstName,
        lastName,
        unsafeMetadata: {
          role: values.role,
          nome: values.nome,
          cpf: values.role === 'cliente' ? onlyDigits(values.cpf) : undefined,
          cnpj: values.role === 'cliente' ? undefined : onlyDigits(values.cnpj),
          dataNascimento: values.dataNascimento,
        },
      });

      await signUp.prepareVerification({ strategy: 'email_code' });

      setStep('otp');
    } catch (error) {
      setFormError(clerkErrorMessage(error));
    }
  });

  if (!isLoaded) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <AppText variant="muted">A preparar o registo…</AppText>
        </View>
      </Screen>
    );
  }

  if (step === 'otp') {
    return (
      <Screen>
        <AuthOtpPanel
          mode="signUp"
          title="Confirme o seu e-mail"
          subtitle={`Enviámos um código de verificação para ${getValues('email')}.`}
          verifyLabel="Confirmar registo"
          onAuthenticated={() => {
            const createdRole = getValues('role');
            reconcileSession({ role: createdRole, kycStatus: initialKycStatus(createdRole) });
          }}
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
          contentContainerStyle={{ paddingBottom: 32 }}>
          <View className="flex-row items-center justify-between py-2">
            <Pressable onPress={() => router.replace('/login')} hitSlop={12}>
              <Ionicons name="arrow-back" size={24} color={colors.ink} />
            </Pressable>
            <AppText variant="heading">Criar conta</AppText>
            <View style={{ width: 24 }} />
          </View>

          <View className="mt-4 gap-5">
            <Controller
              control={control}
              name="role"
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <RoleSelector value={value} onChange={onChange} error={error?.message} />
              )}
            />

            <Controller
              control={control}
              name="nome"
              render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
                <TextField
                  label="Nome completo"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Como devemos chamar-te"
                  autoCapitalize="words"
                  error={error?.message}
                />
              )}
            />

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
                  placeholder="Mínimo de 8 caracteres"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
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

            {role === 'cliente' ? (
              <Controller
                control={control}
                name="cpf"
                render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
                  <TextField
                    label="CPF"
                    value={value}
                    onChangeText={(text) => onChange(formatCPF(text))}
                    onBlur={onBlur}
                    placeholder="000.000.000-00"
                    keyboardType="number-pad"
                    maxLength={14}
                    error={error?.message}
                  />
                )}
              />
            ) : (
              <Controller
                control={control}
                name="cnpj"
                render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
                  <TextField
                    label="CNPJ"
                    value={value}
                    onChangeText={(text) => onChange(formatCNPJ(text))}
                    onBlur={onBlur}
                    placeholder="00.000.000/0000-00"
                    keyboardType="number-pad"
                    maxLength={18}
                    error={error?.message}
                  />
                )}
              />
            )}

            <Controller
              control={control}
              name="dataNascimento"
              render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
                <TextField
                  label="Data de nascimento"
                  value={value}
                  onChangeText={(text) => onChange(formatBirthDate(text))}
                  onBlur={onBlur}
                  placeholder="DD/MM/AAAA"
                  keyboardType="number-pad"
                  maxLength={10}
                  hint="É necessário ter 18 anos ou mais."
                  error={error?.message}
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
            <Button label="Criar conta" loading={isSubmitting} onPress={onSubmit} />
            <Button
              label="Já tens conta? Entrar"
              variant="ghost"
              disabled={isSubmitting}
              onPress={() => router.replace('/login')}
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

export default function RegisterScreen() {
  if (!isAuthConfigured) return <AuthDevNotice />;
  return <ClerkRegisterScreen />;
}

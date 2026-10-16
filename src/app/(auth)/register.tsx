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
import { BirthDatePicker } from '@/components/ui/birth-date-picker';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { TermsModal, TermsSection } from '@/components/ui/terms-modal';
import { TextField } from '@/components/ui/text-field';
import { colors } from '@/constants/theme';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';
import { clerkErrorMessage } from '@/lib/auth/clerk-errors';
import { registerSchema, type RegisterFormValues } from '@/lib/auth/schemas';
import { wipeStaleSession } from '@/lib/auth/session';
import { reconcileSession } from '@/lib/session-store';
import type { AppRole } from '@/lib/utils/dashboard-gate';
import { formatCNPJ, formatCPF, onlyDigits } from '@/lib/validation';
import { isAuthConfigured } from '@/providers/app-providers';

function initialKycStatus(role: AppRole): 'nao_aplicavel' | 'pendente' {
  return role === 'cliente' ? 'nao_aplicavel' : 'pendente';
}

/**
 * Native copy of the "Termos e Condições" document shown in the registration
 * `TermsModal`. Kept declarative so the modal body stays a pure render.
 */
const TERMS_SECTIONS: readonly { heading: string; body: string }[] = [
  {
    heading: '1. Aceitação dos Termos',
    body: 'Ao criar uma conta no TattooGo MK declaras que leste, compreendeste e aceitas integralmente estes Termos e Condições, bem como a Política de Privacidade da plataforma.',
  },
  {
    heading: '2. Elegibilidade',
    body: 'O registo é reservado a maiores de 18 anos. Ao submeteres a tua data de nascimento confirmas a veracidade da informação, que pode ser verificada durante o processo de KYC.',
  },
  {
    heading: '3. Perfil e Documentos',
    body: 'Clientes fornecem CPF; tatuadores e estúdios fornecem CNPJ. Os documentos são validados para garantir a segurança de toda a comunidade e a conformidade legal.',
  },
  {
    heading: '4. Uso da Plataforma',
    body: 'Comprometes-te a utilizar a plataforma de forma lícita, sem publicar conteúdo ofensivo, ilícito ou que viole direitos de terceiros, e a respeitar os demais utilizadores.',
  },
  {
    heading: '5. Privacidade e Dados',
    body: 'Os teus dados pessoais são tratados de acordo com a LGPD/GDPR, armazenados de forma segura e utilizados apenas para a prestação dos serviços da plataforma.',
  },
];

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
  const [termsVisible, setTermsVisible] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { triggerHaptic } = useHapticFeedback();

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
    if (!acceptedTerms) {
      setFormError('É necessário aceitar os Termos e Condições para continuar.');
      void triggerHaptic('warning');
      return;
    }
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
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <BirthDatePicker
                  label="Data de nascimento"
                  value={value}
                  onChange={onChange}
                  hint="É necessário ter 18 anos ou mais."
                  error={error?.message}
                />
              )}
            />
          </View>

          <View className="mt-5 flex-row items-center gap-3">
            <Pressable
              onPress={() => {
                void triggerHaptic('light');
                setAcceptedTerms((prev) => !prev);
                if (formError) setFormError(null);
              }}
              hitSlop={12}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: acceptedTerms }}
              accessibilityLabel="Aceitar os Termos e Condições"
              className="flex-row items-center gap-2">
              <Ionicons
                name={acceptedTerms ? 'checkbox' : 'square-outline'}
                size={22}
                color={acceptedTerms ? colors.accent : colors.muted}
              />
            </Pressable>
            <AppText variant="muted" className="flex-1 text-xs">
              Li e aceito os{' '}
              <AppText
                variant="muted"
                className="text-xs font-semibold text-accent"
                onPress={() => {
                  void triggerHaptic('light');
                  setTermsVisible(true);
                }}>
                Termos e Condições
              </AppText>
            </AppText>
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

      <TermsModal
        visible={termsVisible}
        onClose={() => setTermsVisible(false)}
        title="Termos e Condições"
        subtitle="TattooGo MK"
        footer={
          <Button
            label="Aceitar e continuar"
            onPress={() => {
              setAcceptedTerms(true);
              setTermsVisible(false);
            }}
          />
        }>
        <AppText variant="muted" className="leading-relaxed">
          Bem-vindo ao TattooGo MK. Antes de criares a tua conta, lê atentamente as condições
          abaixo.
        </AppText>
        {TERMS_SECTIONS.map((section) => (
          <TermsSection key={section.heading} heading={section.heading}>
            {section.body}
          </TermsSection>
        ))}
      </TermsModal>
    </Screen>
  );
}

export default function RegisterScreen() {
  if (!isAuthConfigured) return <AuthDevNotice />;
  return <ClerkRegisterScreen />;
}

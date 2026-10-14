import { AlertCircle, BadgeCheck, Building2, ShieldCheck } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { GlassContainer } from '@/components/ui/glass-container';
import { colors } from '@/constants/theme';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';
import { useI18n } from '@/hooks/use-i18n';
import { useStudioCompliance } from '@/hooks/use-studio-compliance';
import { formatCNPJ, isValidCNPJ, onlyDigits } from '@/lib/validation';

/** Fundo/borda de destaque do cartão de CNPJ validado (verde de conformidade). */
const COMPLIANCE_SURFACE_STYLE = {
  backgroundColor: 'rgba(34, 197, 94, 0.10)',
  borderColor: 'rgba(34, 197, 94, 0.40)',
} as const;

function ComplianceCard({
  razaoSocial,
  cnpjMasked,
  statusLabel,
}: {
  razaoSocial: string;
  cnpjMasked: string;
  statusLabel: string;
}) {
  const { t } = useI18n();

  return (
    <GlassContainer className="gap-4" style={COMPLIANCE_SURFACE_STYLE}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <ShieldCheck size={18} color={colors.success} />
          <AppText variant="body" className="text-sm font-semibold">
            {t('studio.cnpj.title')}
          </AppText>
        </View>
        <View className="flex-row items-center gap-1 rounded-full border border-success/40 bg-success/10 px-2.5 py-1">
          <BadgeCheck size={13} color={colors.success} />
          <AppText variant="body" className="text-[11px] font-semibold text-success">
            {statusLabel}
          </AppText>
        </View>
      </View>

      <View className="gap-3">
        <View className="gap-0.5">
          <AppText variant="muted" className="text-xs">
            {t('studio.cnpj.razaoSocial')}
          </AppText>
          <AppText variant="body" className="text-sm font-semibold">
            {razaoSocial}
          </AppText>
        </View>
        <View className="gap-0.5">
          <AppText variant="muted" className="text-xs">
            {t('studio.cnpj.fieldLabel')}
          </AppText>
          <AppText variant="body" className="text-sm">
            {cnpjMasked}
          </AppText>
        </View>
      </View>
    </GlassContainer>
  );
}

/**
 * Painel de compliance de CNPJ do estúdio (port de `StudioCnpjPanel`).
 *
 * Fluxo em duas etapas: validar o CNPJ junto da API (`validate-cnpj`) e depois
 * registrá-lo (`register`). Com a compliance registada, o painel vira um
 * `GlassContainer` verde com razão social, CNPJ mascarado e situação. O input
 * usa máscara `00.000.000/0000-00`, teclado numérico e valida os 14 dígitos com
 * `isValidCNPJ` antes de habilitar a ação.
 */
export function StudioCnpjPanel() {
  const { t } = useI18n();
  const { triggerHaptic } = useHapticFeedback();
  const { compliance, validation, isValidating, isRegistering, validate, register, reset } =
    useStudioCompliance();

  const [cnpj, setCnpj] = useState('');
  const [failed, setFailed] = useState(false);

  const cnpjValid = useMemo(() => isValidCNPJ(cnpj), [cnpj]);
  const showInvalid = cnpj.length === 14 && !cnpjValid;

  const handleChange = useCallback(
    (text: string) => {
      setFailed(false);
      reset();
      setCnpj(onlyDigits(text).slice(0, 14));
    },
    [reset],
  );

  const handleValidate = useCallback(async () => {
    if (!cnpjValid) return;
    setFailed(false);
    void triggerHaptic('light');
    try {
      await validate(cnpj);
      void triggerHaptic('success');
    } catch {
      setFailed(true);
      void triggerHaptic('error');
    }
  }, [cnpj, cnpjValid, triggerHaptic, validate]);

  const handleRegister = useCallback(async () => {
    if (!cnpjValid) return;
    setFailed(false);
    void triggerHaptic('light');
    try {
      await register(cnpj);
      void triggerHaptic('success');
    } catch {
      setFailed(true);
      void triggerHaptic('error');
    }
  }, [cnpj, cnpjValid, register, triggerHaptic]);

  if (compliance?.cnpjMasked) {
    return (
      <ComplianceCard
        razaoSocial={compliance.razaoSocial}
        cnpjMasked={compliance.cnpjMasked}
        statusLabel={t(`studio.cnpj.status.${compliance.status}`)}
      />
    );
  }

  return (
    <GlassContainer className="gap-4">
      <View className="flex-row items-center gap-2">
        <Building2 size={18} color={colors.accent} />
        <View className="flex-1">
          <AppText variant="body" className="text-sm font-semibold">
            {t('studio.cnpj.title')}
          </AppText>
          <AppText variant="muted" className="text-xs">
            {t('studio.cnpj.subtitle')}
          </AppText>
        </View>
      </View>

      <View className="gap-2">
        <AppText variant="label">{t('studio.cnpj.fieldLabel')}</AppText>
        <View
          className={`flex-row items-center gap-2 rounded-2xl border bg-surface px-4 ${
            showInvalid ? 'border-danger/60' : 'border-line'
          }`}>
          <TextInput
            value={formatCNPJ(cnpj)}
            onChangeText={handleChange}
            placeholder={t('studio.cnpj.placeholder')}
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={18}
            editable={!isRegistering}
            accessibilityLabel={t('studio.cnpj.fieldLabel')}
            className="h-12 flex-1 text-base text-ink"
          />
          {cnpjValid ? <BadgeCheck size={18} color={colors.success} /> : null}
        </View>
        {showInvalid ? (
          <View className="flex-row items-center gap-1.5">
            <AlertCircle size={13} color={colors.danger} />
            <AppText variant="body" className="text-xs text-danger">
              {t('studio.cnpj.invalid')}
            </AppText>
          </View>
        ) : null}
      </View>

      {validation ? (
        <View className="gap-4">
          <View className="gap-1 rounded-2xl border border-line bg-elevated p-4">
            <View className="flex-row items-center justify-between">
              <AppText variant="muted" className="text-xs">
                {t('studio.cnpj.razaoSocial')}
              </AppText>
              <AppText variant="body" className="text-sm font-semibold">
                {validation.razaoSocial}
              </AppText>
            </View>
            <View className="flex-row items-center justify-between">
              <AppText variant="muted" className="text-xs">
                {t('studio.cnpj.status')}
              </AppText>
              <AppText variant="body" className="text-sm text-success">
                {t(`studio.cnpj.status.${validation.status}`)}
              </AppText>
            </View>
          </View>

          <Button
            label={isRegistering ? t('studio.cnpj.registering') : t('studio.cnpj.register')}
            onPress={handleRegister}
            loading={isRegistering}
            disabled={isRegistering}
          />
        </View>
      ) : (
        <Button
          label={isValidating ? t('studio.cnpj.validating') : t('studio.cnpj.validate')}
          onPress={handleValidate}
          loading={isValidating}
          disabled={!cnpjValid || isValidating}
        />
      )}

      {failed ? (
        <AppText variant="body" className="text-center text-xs text-danger">
          {t('studio.cnpj.error')}
        </AppText>
      ) : null}
    </GlassContainer>
  );
}

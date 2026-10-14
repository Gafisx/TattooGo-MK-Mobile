import { router } from 'expo-router';
import { Building2 } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { GlassContainer } from '@/components/ui/glass-container';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { colors } from '@/constants/theme';
import { useI18n } from '@/hooks/use-i18n';
import { useStudioCompliance } from '@/hooks/use-studio-compliance';

/**
 * Aba "Perfil" do Dashboard do Estúdio.
 *
 * Mostra a identidade do estúdio (razão social + CNPJ mascarado, quando a
 * compliance estiver registada) e atalhos para a agenda/pagamentos.
 */
export default function EstudioProfileScreen() {
  const { t } = useI18n();
  const { compliance } = useStudioCompliance();

  return (
    <Screen padded={false}>
      <View className="flex-1 px-5 pt-4">
        <View className="flex-row items-center gap-4 py-4">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-accent-glow">
            <Building2 size={28} color={colors.accent} />
          </View>
          <View className="flex-1 gap-1">
            <AppText variant="heading" numberOfLines={1}>
              {compliance?.razaoSocial ?? t('studio.home.title')}
            </AppText>
            <AppText variant="muted">{t('studio.profile.subtitle')}</AppText>
          </View>
        </View>

        {compliance?.cnpjMasked ? (
          <GlassContainer className="mt-2 gap-3">
            <View className="gap-0.5">
              <AppText variant="muted" className="text-xs">
                {t('studio.cnpj.razaoSocial')}
              </AppText>
              <AppText variant="body" className="font-semibold">
                {compliance.razaoSocial}
              </AppText>
            </View>
            <View className="gap-0.5">
              <AppText variant="muted" className="text-xs">
                {t('studio.cnpj.fieldLabel')}
              </AppText>
              <AppText variant="body">{compliance.cnpjMasked}</AppText>
            </View>
          </GlassContainer>
        ) : null}

        <View className="mt-6">
          <AppText variant="label" className="mb-2">
            {t('studio.profile.title')}
          </AppText>
          <ListRow
            icon="wallet-outline"
            title={t('studio.hub.earnings.title')}
            subtitle={t('studio.hub.earnings.subtitle')}
            onPress={() => router.push('/estudio/agendar')}
          />
          <ListRow
            icon="shield-checkmark-outline"
            title={t('studio.cnpj.title')}
            subtitle={t('studio.cnpj.subtitle')}
            onPress={() => router.replace('/estudio')}
          />
        </View>
      </View>
    </Screen>
  );
}

import { CalendarCheck, Users, type LucideIcon } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

import { StudioCnpjPanel } from '@/components/features/studio-cnpj-panel';
import { StudioIncomingRequests } from '@/components/features/studio-incoming-requests';
import { AppText } from '@/components/ui/app-text';
import { GlassContainer } from '@/components/ui/glass-container';
import { Screen } from '@/components/ui/screen';
import { colors } from '@/constants/theme';
import { useAgenda } from '@/hooks/use-agenda';
import { useI18n } from '@/hooks/use-i18n';
import { useStudioAffiliation } from '@/hooks/use-studio-affiliation';

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <GlassContainer className="flex-1 gap-2">
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-accent-glow">
        <Icon size={18} color={colors.accent} />
      </View>
      <AppText variant="body" className="text-2xl font-bold">
        {value}
      </AppText>
      <AppText variant="muted" className="text-xs" numberOfLines={2}>
        {label}
      </AppText>
    </GlassContainer>
  );
}

/**
 * Tela "Início" do Dashboard do Estúdio.
 *
 * Orquestra, de cima para baixo: o painel de compliance de CNPJ
 * (`StudioCnpjPanel`), duas métricas em `GlassContainer` (total de agendamentos
 * + parceiros ativos) e o roster de afiliações (`StudioIncomingRequests`).
 */
export default function EstudioHomeScreen() {
  const { t } = useI18n();
  const { agendamentos } = useAgenda();
  const { partners } = useStudioAffiliation();

  return (
    <Screen padded={false}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>
        <View className="gap-1">
          <AppText variant="label">TattooGo MK</AppText>
          <AppText variant="title">{t('studio.home.title')}</AppText>
          <AppText variant="muted">{t('studio.home.subtitle')}</AppText>
        </View>

        <View className="mt-5">
          <StudioCnpjPanel />
        </View>

        <View className="mt-3 flex-row gap-3">
          <MetricCard
            icon={CalendarCheck}
            label={t('studio.metrics.totalBookings')}
            value={agendamentos.length}
          />
          <MetricCard
            icon={Users}
            label={t('studio.metrics.activePartners')}
            value={partners.length}
          />
        </View>

        <StudioIncomingRequests />
      </ScrollView>
    </Screen>
  );
}

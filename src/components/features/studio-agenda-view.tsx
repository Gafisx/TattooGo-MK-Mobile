import { CalendarDays, Clock } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, SectionList, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { GlassContainer } from '@/components/ui/glass-container';
import { Skeleton } from '@/components/ui/skeleton';
import { colors } from '@/constants/theme';
import { useI18n } from '@/hooks/use-i18n';
import { formatAgendaDateTime } from '@/lib/agenda-format';
import { portfolioLabelResolver } from '@/lib/portfolio-metadata';
import { groupStudioRoster } from '@/lib/studio-agenda';
import type { Agendamento, AgendamentoStatus } from '@/lib/types/agenda';

const STATUS_STYLE: Record<AgendamentoStatus, { chip: string; text: string }> = {
  pendente: { chip: 'border-warning/40 bg-warning/10', text: 'text-warning' },
  sinal_pago: { chip: 'border-info/40 bg-info/10', text: 'text-info' },
  confirmado: { chip: 'border-accent/40 bg-accent-glow', text: 'text-accent' },
  concluido: { chip: 'border-success/40 bg-success/10', text: 'text-success' },
  cancelado: { chip: 'border-danger/40 bg-danger/10', text: 'text-danger' },
};

function StudioSessionRow({ agendamento }: { agendamento: Agendamento }) {
  const { t, locale } = useI18n();
  const { styleLabel } = portfolioLabelResolver(t);
  const statusStyle = STATUS_STYLE[agendamento.status];

  return (
    <View className="mb-3 flex-row items-center gap-3 rounded-2xl border border-line bg-card p-4">
      <View className="h-11 w-11 items-center justify-center rounded-full bg-accent-glow">
        <AppText variant="body" className="font-semibold text-accent">
          {agendamento.artista.initial}
        </AppText>
      </View>
      <View className="flex-1">
        <AppText variant="body" className="font-semibold" numberOfLines={1}>
          {agendamento.artista.name}
        </AppText>
        <View className="flex-row items-center gap-1.5">
          <Clock size={12} color={colors.muted} />
          <AppText variant="muted" className="text-xs" numberOfLines={1}>
            {formatAgendaDateTime(agendamento.scheduledAt, locale)}
          </AppText>
        </View>
        <View className="mt-1 flex-row">
          <View className="rounded-full border border-line bg-surface px-2 py-0.5">
            <AppText variant="muted" className="text-[11px] text-ink">
              {styleLabel(agendamento.estilo)}
            </AppText>
          </View>
        </View>
      </View>
      <View className={`rounded-full border px-2.5 py-1 ${statusStyle.chip}`}>
        <AppText variant="body" className={`text-[11px] font-semibold ${statusStyle.text}`}>
          {t(`agenda.status.${agendamento.status}`)}
        </AppText>
      </View>
    </View>
  );
}

function StudioAgendaSkeleton() {
  return (
    <View className="gap-3">
      {[0, 1, 2].map((key) => (
        <Skeleton key={key} style={{ height: 92 }} />
      ))}
    </View>
  );
}

function StudioAgendaError({ onRetry }: { onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <GlassContainer className="items-center gap-2">
      <AppText variant="heading" className="text-center text-danger">
        {t('agenda.loadError')}
      </AppText>
      <AppText variant="muted" className="text-center">
        {t('agenda.loadErrorHint')}
      </AppText>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          className="mt-2 rounded-full border border-line bg-elevated px-4 py-2 active:bg-surface">
          <AppText variant="body" className="text-sm text-accent">
            {t('agenda.empty.cta')}
          </AppText>
        </Pressable>
      ) : null}
    </GlassContainer>
  );
}

function StudioAgendaEmpty() {
  const { t } = useI18n();
  return (
    <View className="flex-1 items-center justify-center gap-3 px-8 py-16">
      <View className="h-16 w-16 items-center justify-center rounded-2xl bg-elevated">
        <CalendarDays size={28} color={colors.accent} />
      </View>
      <AppText variant="heading" className="text-center">
        {t('studio.agenda.empty.title')}
      </AppText>
      <AppText variant="muted" className="text-center">
        {t('studio.agenda.empty.description')}
      </AppText>
    </View>
  );
}

export interface StudioAgendaViewProps {
  agendamentos: Agendamento[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  /** Data de referência do agrupamento (default: agora). */
  now?: Date;
}

/**
 * Agenda do estúdio (port da lógica `groupStudioRoster`).
 *
 * Agrupa as sessões em "Hoje" e "Próximos" e as renderiza em uma `SectionList`
 * (virtualizada). Estados de carregamento, erro e vazio reutilizam o contrato
 * de i18n da Agenda.
 */
export function StudioAgendaView({
  agendamentos,
  isLoading = false,
  isError = false,
  onRetry,
  now,
}: StudioAgendaViewProps) {
  const { t } = useI18n();
  const roster = useMemo(() => groupStudioRoster(agendamentos, now), [agendamentos, now]);

  const sections = useMemo(
    () =>
      [
        { title: t('studio.agenda.today'), data: roster.today },
        { title: t('studio.agenda.upcoming'), data: roster.upcoming },
      ].filter((section) => section.data.length > 0),
    [roster.today, roster.upcoming, t],
  );

  if (isLoading) {
    return (
      <View className="flex-1 px-5 pt-2">
        <StudioAgendaHeader />
        <StudioAgendaSkeleton />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 px-5 pt-2">
        <StudioAgendaHeader />
        <StudioAgendaError onRetry={onRetry} />
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <StudioSessionRow agendamento={item} />}
      renderSectionHeader={({ section }) => (
        <AppText variant="label" className="mb-2 mt-2">
          {section.title}
        </AppText>
      )}
      ListHeaderComponent={StudioAgendaHeader}
      ListEmptyComponent={StudioAgendaEmpty}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      initialNumToRender={6}
      windowSize={7}
      removeClippedSubviews
    />
  );
}

function StudioAgendaHeader() {
  const { t } = useI18n();
  return (
    <View className="pb-2 pt-2">
      <AppText variant="title">{t('studio.agenda.title')}</AppText>
      <AppText variant="muted">{t('studio.agenda.subtitle')}</AppText>
    </View>
  );
}

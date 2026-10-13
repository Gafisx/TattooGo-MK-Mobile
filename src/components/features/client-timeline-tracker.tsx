import { BadgeCheck, Ban, CalendarDays, Check, ChevronDown, Wallet } from 'lucide-react-native';
import { useCallback, useState, type ComponentType } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { colors } from '@/constants/theme';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';
import { useI18n } from '@/hooks/use-i18n';
import {
  buildSessionTimeline,
  depositAmount,
  type SessionStepKey,
  type TimelineStepState,
} from '@/lib/agenda-timeline';
import { formatAgendaDateTime } from '@/lib/agenda-format';
import { formatBRL } from '@/lib/finance';
import { portfolioLabelResolver } from '@/lib/portfolio-metadata';
import type { Agendamento, AgendamentoStatus } from '@/lib/types/agenda';

type StepIcon = ComponentType<{ size?: number; color?: string }>;

const STATUS_STYLE: Record<AgendamentoStatus, { chip: string; text: string }> = {
  pendente: { chip: 'border-warning/40 bg-warning/10', text: 'text-warning' },
  sinal_pago: { chip: 'border-info/40 bg-info/10', text: 'text-info' },
  confirmado: { chip: 'border-accent/40 bg-accent-glow', text: 'text-accent' },
  concluido: { chip: 'border-success/40 bg-success/10', text: 'text-success' },
  cancelado: { chip: 'border-danger/40 bg-danger/10', text: 'text-danger' },
};

const STEP_ICON: Record<SessionStepKey, StepIcon> = {
  sinal: Wallet,
  confirmacao: BadgeCheck,
  sessao: CalendarDays,
};

function StepDot({ state, Icon }: { state: TimelineStepState; Icon: StepIcon }) {
  if (state === 'done') {
    return (
      <View className="h-8 w-8 items-center justify-center rounded-full bg-accent">
        <Check size={16} color={colors.canvas} />
      </View>
    );
  }
  if (state === 'current') {
    return (
      <View className="h-8 w-8 items-center justify-center rounded-full border-2 border-accent bg-accent-glow">
        <Icon size={15} color={colors.accent} />
      </View>
    );
  }
  return (
    <View className="h-8 w-8 items-center justify-center rounded-full border border-line bg-elevated">
      <Icon size={15} color={colors.muted} />
    </View>
  );
}

function ProgressBar({
  progress,
  milestones,
}: {
  progress: number;
  milestones: readonly number[];
}) {
  return (
    <View className="h-2 w-full overflow-hidden rounded-full bg-elevated">
      <View className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
      {milestones.map((milestone) => (
        <View
          key={milestone}
          className="absolute top-0 h-full w-px bg-canvas/70"
          style={{ left: `${milestone}%` }}
        />
      ))}
    </View>
  );
}

export interface ClientTimelineTrackerProps {
  agendamento: Agendamento;
  defaultExpanded?: boolean;
}

/**
 * Rastreador de sessão do cliente (port de `ClientTimelineTracker`).
 *
 * Renderiza artista + status, barra de progresso com marcos (33/66/100), e uma
 * linha do tempo expansível (haptics na expansão/contração) com sinal de 25% e
 * total. Para sessões canceladas exibe o aviso de cancelamento.
 */
export function ClientTimelineTracker({
  agendamento,
  defaultExpanded = false,
}: ClientTimelineTrackerProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const { triggerHaptic } = useHapticFeedback();
  const { t, locale } = useI18n();
  const { styleLabel, bodyPartLabel, sessionDurationLabel } = portfolioLabelResolver(t);

  const timeline = buildSessionTimeline(agendamento);
  const depositCents = depositAmount(agendamento.totalCents);
  const statusStyle = STATUS_STYLE[agendamento.status];

  const toggle = useCallback(() => {
    void triggerHaptic(expanded ? 'light' : 'selection');
    setExpanded((current) => !current);
  }, [expanded, triggerHaptic]);

  const ariaLabel = expanded ? t('agenda.collapse') : t('agenda.expand');

  return (
    <View className="mb-3 rounded-2xl border border-line bg-card p-4">
      <View className="flex-row items-center gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-accent-glow">
          <AppText variant="body" className="font-semibold text-accent">
            {agendamento.artista.initial}
          </AppText>
        </View>
        <View className="flex-1">
          <AppText variant="body" className="font-semibold" numberOfLines={1}>
            {agendamento.artista.name}
          </AppText>
          {agendamento.artista.studioName ? (
            <AppText variant="muted" className="text-xs" numberOfLines={1}>
              {agendamento.artista.studioName}
            </AppText>
          ) : null}
        </View>
        <View className={`rounded-full border px-2.5 py-1 ${statusStyle.chip}`}>
          <AppText variant="body" className={`text-[11px] font-semibold ${statusStyle.text}`}>
            {t(`agenda.status.${agendamento.status}`)}
          </AppText>
        </View>
      </View>

      <View className="mt-3 flex-row flex-wrap gap-1.5">
        <Chip label={styleLabel(agendamento.estilo)} />
        <Chip label={bodyPartLabel(agendamento.bodyPart)} />
        <Chip label={sessionDurationLabel(agendamento.sessionDuration)} />
      </View>

      <View className="mt-4 gap-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <CalendarDays size={14} color={colors.accent} />
            <AppText variant="muted" className="text-xs">
              {t('agenda.scheduledFor')}
            </AppText>
          </View>
          <AppText variant="body" className="text-xs font-semibold">
            {formatAgendaDateTime(agendamento.scheduledAt, locale)}
          </AppText>
        </View>
        <ProgressBar progress={timeline.progress} milestones={timeline.milestones} />
        <AppText variant="muted" className="text-[11px]">
          {t('agenda.progress', { percent: timeline.progress })}
        </AppText>
      </View>

      {timeline.cancelled ? (
        <View className="mt-3 flex-row items-center gap-2 rounded-xl border border-danger/40 bg-danger/10 px-3 py-2">
          <Ban size={14} color={colors.danger} />
          <AppText variant="body" className="flex-1 text-xs text-danger">
            {t('agenda.cancelled')}
          </AppText>
        </View>
      ) : null}

      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityLabel={ariaLabel}
        accessibilityState={{ expanded }}
        className="mt-3 flex-row items-center justify-center gap-1.5 rounded-xl border border-line bg-surface py-2 active:bg-elevated">
        <AppText variant="body" className="text-xs text-accent">
          {ariaLabel}
        </AppText>
        <ChevronDown
          size={15}
          color={colors.accent}
          style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
        />
      </Pressable>

      {expanded ? (
        <View className="mt-4">
          {timeline.steps.map((step, index) => {
            const Icon = STEP_ICON[step.key];
            const isLast = index === timeline.steps.length - 1;
            const labelClass =
              step.state === 'current'
                ? 'text-accent'
                : step.state === 'done'
                  ? 'text-ink'
                  : 'text-muted';
            return (
              <View key={step.key} className="flex-row gap-3">
                <View className="items-center">
                  <StepDot state={step.state} Icon={Icon} />
                  {!isLast ? <View className="w-px flex-1 bg-line" /> : null}
                </View>
                <View className={`flex-1 ${isLast ? '' : 'pb-4'}`}>
                  <AppText variant="body" className={`text-sm font-semibold ${labelClass}`}>
                    {t(step.labelKey)}
                  </AppText>
                  <AppText variant="muted" className="text-xs">
                    {t(step.descriptionKey)}
                  </AppText>
                </View>
              </View>
            );
          })}

          <View className="mt-1 gap-2 rounded-xl border border-line bg-surface p-3">
            <View className="flex-row items-center justify-between">
              <AppText variant="muted" className="text-xs">
                {t('agenda.deposit')}
              </AppText>
              <AppText variant="body" className="text-sm">
                {formatBRL(depositCents)}
              </AppText>
            </View>
            <View className="flex-row items-center justify-between">
              <AppText variant="muted" className="text-xs">
                {t('agenda.total')}
              </AppText>
              <AppText variant="body" className="text-sm font-semibold text-accent">
                {formatBRL(agendamento.totalCents)}
              </AppText>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <View className="rounded-full border border-line bg-surface px-2.5 py-1">
      <AppText variant="muted" className="text-[11px] text-ink">
        {label}
      </AppText>
    </View>
  );
}

export interface TrackerEmptyStateProps {
  variant?: 'schedule' | 'payments';
  onAction?: () => void;
}

/** Estado vazio do rastreador (`TrackerEmptyState`) para Agenda e Pagamentos. */
export function TrackerEmptyState({ variant = 'schedule', onAction }: TrackerEmptyStateProps) {
  const { t } = useI18n();
  const isSchedule = variant === 'schedule';
  const Icon = isSchedule ? CalendarDays : Wallet;

  return (
    <View className="flex-1 items-center justify-center gap-3 px-8 py-16">
      <View className="h-16 w-16 items-center justify-center rounded-2xl bg-elevated">
        <Icon size={28} color={colors.accent} />
      </View>
      <AppText variant="heading" className="text-center">
        {isSchedule ? t('agenda.empty.title') : t('agenda.payments.empty.title')}
      </AppText>
      <AppText variant="muted" className="text-center">
        {isSchedule
          ? t('agenda.empty.description')
          : t('agenda.payments.empty.description')}
      </AppText>
      {isSchedule && onAction ? (
        <Button label={t('agenda.empty.cta')} variant="primary" onPress={onAction} className="mt-2" />
      ) : null}
    </View>
  );
}

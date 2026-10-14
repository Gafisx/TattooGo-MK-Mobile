import { Check, Clock, UserPlus, Users, X } from 'lucide-react-native';
import { useCallback, useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { GlassContainer } from '@/components/ui/glass-container';
import { Skeleton } from '@/components/ui/skeleton';
import { colors } from '@/constants/theme';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';
import { useI18n } from '@/hooks/use-i18n';
import { useStudioAffiliation } from '@/hooks/use-studio-affiliation';
import { formatAgendaDate } from '@/lib/agenda-format';
import { portfolioLabelResolver } from '@/lib/portfolio-metadata';
import type { Pedido, PedidoDecision, StudioArtistRow } from '@/lib/types/studio';

function StyleChips({ styles }: { styles: string[] }) {
  const { t } = useI18n();
  const { styleLabel } = portfolioLabelResolver(t);

  if (styles.length === 0) return null;

  return (
    <View className="flex-row flex-wrap gap-1.5">
      {styles.map((style) => (
        <View key={style} className="rounded-full border border-line bg-surface px-2 py-0.5">
          <AppText variant="muted" className="text-[11px] text-ink">
            {styleLabel(style)}
          </AppText>
        </View>
      ))}
    </View>
  );
}

function Avatar({ initial }: { initial: string }) {
  return (
    <View className="h-11 w-11 items-center justify-center rounded-full bg-accent-glow">
      <AppText variant="body" className="font-semibold text-accent">
        {initial}
      </AppText>
    </View>
  );
}

interface PedidoCardProps {
  pedido: Pedido;
  busy: PedidoDecision | null;
  onRespond: (pedidoId: string, decision: PedidoDecision) => void;
}

function PedidoCard({ pedido, busy, onRespond }: PedidoCardProps) {
  const { t, locale } = useI18n();
  const disabled = busy !== null;

  return (
    <GlassContainer className="mb-3 gap-3">
      <View className="flex-row items-center gap-3">
        <Avatar initial={pedido.artista.initial} />
        <View className="flex-1">
          <AppText variant="body" className="font-semibold" numberOfLines={1}>
            {pedido.artista.name}
          </AppText>
          <View className="flex-row items-center gap-1.5">
            <Clock size={12} color={colors.muted} />
            <AppText variant="muted" className="text-xs" numberOfLines={1}>
              {formatAgendaDate(pedido.createdAt, locale)}
            </AppText>
          </View>
        </View>
      </View>

      <StyleChips styles={pedido.styles} />

      <View className="flex-row gap-2">
        <Button
          label={t('studio.requests.reject')}
          variant="secondary"
          className="flex-1"
          icon={<X size={16} color={colors.ink} />}
          disabled={disabled}
          loading={busy === 'rejeitar'}
          onPress={() => onRespond(pedido.id, 'rejeitar')}
        />
        <Button
          label={t('studio.requests.accept')}
          className="flex-1"
          icon={<Check size={16} color={colors.canvas} />}
          disabled={disabled}
          loading={busy === 'aceitar'}
          onPress={() => onRespond(pedido.id, 'aceitar')}
        />
      </View>
    </GlassContainer>
  );
}

function PartnerRow({ partner }: { partner: StudioArtistRow }) {
  const { t } = useI18n();

  return (
    <View className="mb-3 gap-3 rounded-2xl border border-line bg-card p-4">
      <View className="flex-row items-center gap-3">
        <Avatar initial={partner.initial} />
        <View className="flex-1">
          <AppText variant="body" className="font-semibold" numberOfLines={1}>
            {partner.name}
          </AppText>
          <StyleChips styles={partner.styles} />
        </View>
        <View className="rounded-full border border-success/40 bg-success/10 px-2.5 py-1">
          <AppText variant="body" className="text-[11px] font-semibold text-success">
            {t('studio.partners.active')}
          </AppText>
        </View>
      </View>
    </View>
  );
}

function SectionHeader({
  icon,
  title,
  count,
}: {
  icon: ReactNode;
  title: string;
  count?: number;
}) {
  return (
    <View className="mb-2 mt-4 flex-row items-center gap-2">
      {icon}
      <AppText variant="label">{title}</AppText>
      {typeof count === 'number' && count > 0 ? (
        <View className="rounded-full bg-elevated px-2 py-0.5">
          <AppText variant="muted" className="text-[11px]">
            {count}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

function RequestsSkeleton() {
  return (
    <View className="gap-3 pt-2">
      {[0, 1].map((key) => (
        <Skeleton key={key} style={{ height: 132 }} />
      ))}
    </View>
  );
}

function RequestsError({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <GlassContainer className="items-center gap-2">
      <AppText variant="heading" className="text-center text-danger">
        {t('studio.requests.loadError')}
      </AppText>
      <AppText variant="muted" className="text-center">
        {t('studio.requests.loadErrorHint')}
      </AppText>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        className="mt-2 rounded-full border border-line bg-elevated px-4 py-2 active:bg-surface">
        <AppText variant="body" className="text-sm text-accent">
          {t('agenda.empty.cta')}
        </AppText>
      </Pressable>
    </GlassContainer>
  );
}

function EmptyHint({ title, description }: { title: string; description: string }) {
  return (
    <View className="items-center gap-1 rounded-2xl border border-dashed border-line bg-surface/60 px-6 py-6">
      <AppText variant="body" className="text-center text-sm font-medium">
        {title}
      </AppText>
      <AppText variant="muted" className="text-center text-xs">
        {description}
      </AppText>
    </View>
  );
}

/**
 * Roster do estúdio (port de `StudioIncomingRequests`).
 *
 * Lista os pedidos de afiliação pendentes — com ações Rejeitar/Aceitar que
 * disparam `PATCH /api/studios/affiliation` — e, abaixo, os tatuadores já
 * aprovados (parceiros ativos). Renderizado dentro de um `ScrollView` (sem
 * `FlatList` aninhada); a lista é curta por natureza.
 */
export function StudioIncomingRequests() {
  const { t } = useI18n();
  const { triggerHaptic } = useHapticFeedback();
  const { pending, partners, isLoading, isError, respond, refetch } = useStudioAffiliation();

  const [busy, setBusy] = useState<{ id: string; decision: PedidoDecision } | null>(null);

  const handleRespond = useCallback(
    async (pedidoId: string, decision: PedidoDecision) => {
      if (busy) return;
      setBusy({ id: pedidoId, decision });
      void triggerHaptic('light');
      try {
        await respond(pedidoId, decision);
        void triggerHaptic('success');
      } catch {
        void triggerHaptic('error');
      } finally {
        setBusy(null);
      }
    },
    [busy, respond, triggerHaptic],
  );

  if (isLoading) {
    return (
      <View>
        <SectionHeader icon={<UserPlus size={14} color={colors.accent} />} title={t('studio.requests.title')} />
        <RequestsSkeleton />
      </View>
    );
  }

  if (isError) {
    return (
      <View>
        <SectionHeader icon={<UserPlus size={14} color={colors.accent} />} title={t('studio.requests.title')} />
        <RequestsError onRetry={refetch} />
      </View>
    );
  }

  return (
    <View>
      <SectionHeader
        icon={<UserPlus size={14} color={colors.accent} />}
        title={t('studio.requests.pendingTitle')}
        count={pending.length}
      />
      {pending.length > 0 ? (
        pending.map((pedido) => (
          <PedidoCard
            key={pedido.id}
            pedido={pedido}
            busy={busy?.id === pedido.id ? busy.decision : null}
            onRespond={handleRespond}
          />
        ))
      ) : (
        <EmptyHint
          title={t('studio.requests.empty.title')}
          description={t('studio.requests.empty.description')}
        />
      )}

      <SectionHeader
        icon={<Users size={14} color={colors.accent} />}
        title={t('studio.partners.title')}
        count={partners.length}
      />
      {partners.length > 0 ? (
        partners.map((partner) => <PartnerRow key={partner.id} partner={partner} />)
      ) : (
        <EmptyHint
          title={t('studio.partners.empty.title')}
          description={t('studio.partners.empty.description')}
        />
      )}
    </View>
  );
}

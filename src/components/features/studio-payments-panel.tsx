import {
  ArrowDownToLine,
  Check,
  CircleDollarSign,
  Hourglass,
  Landmark,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react-native';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import { FlatList, Modal, Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { GlassContainer } from '@/components/ui/glass-container';
import { Skeleton } from '@/components/ui/skeleton';
import { colors } from '@/constants/theme';
import { useAgenda } from '@/hooks/use-agenda';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';
import { useI18n } from '@/hooks/use-i18n';
import { useSession } from '@/hooks/use-session';
import { formatAgendaDateTime } from '@/lib/agenda-format';
import { formatBRL, receiptModelForRole, type ReceiptModel } from '@/lib/finance';
import { portfolioLabelResolver } from '@/lib/portfolio-metadata';
import {
  buildReceipts,
  summarizeReceipts,
  type EscrowStatus,
  type Receipt,
  type ReceiptsSummary,
} from '@/lib/studio-receipts';
import type { AppRole } from '@/lib/utils/dashboard-gate';

/** Latência simulada do gateway de saque (loader nativo do botão). */
const PAYOUT_LATENCY_MS = 1400;
/** Tempo do selo de sucesso antes de fechar o sheet. */
const PAYOUT_SUCCESS_MS = 900;

const ESCROW_STYLE: Record<EscrowStatus, { chip: string; text: string }> = {
  held: { chip: 'border-warning/40 bg-warning/10', text: 'text-warning' },
  secured: { chip: 'border-info/40 bg-info/10', text: 'text-info' },
  released: { chip: 'border-success/40 bg-success/10', text: 'text-success' },
  refunded: { chip: 'border-danger/40 bg-danger/10', text: 'text-danger' },
};

function OverviewTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <View className="flex-1 rounded-xl border border-line bg-elevated p-3">
      <Icon size={16} color={tone} />
      <AppText variant="muted" className="mt-2 text-[11px]">
        {label}
      </AppText>
      <AppText variant="body" className="mt-0.5 text-sm font-semibold">
        {formatBRL(value)}
      </AppText>
    </View>
  );
}

export interface ReceiptsOverviewProps {
  summary: ReceiptsSummary;
  model: ReceiptModel;
}

/**
 * Painel superior de Recebimentos: consolida os quatro saldos do tatuador/
 * estúdio — retido (`held`), liberado (`released`), cauções garantidas
 * (`secured`) e bruto total (`gross`) — e mostra o modelo de split ativo.
 */
export function ReceiptsOverview({ summary, model }: ReceiptsOverviewProps) {
  const { t } = useI18n();

  return (
    <GlassContainer className="gap-4">
      <View className="flex-row items-center justify-between">
        <AppText variant="body" className="font-semibold">
          {t('studio.payments.title')}
        </AppText>
        <View className="rounded-full border border-line bg-elevated px-2.5 py-1">
          <AppText variant="muted" className="text-[11px] text-accent">
            {t(`studio.payments.model.${model}`)}
          </AppText>
        </View>
      </View>

      <View className="flex-row gap-3">
        <OverviewTile
          icon={Hourglass}
          label={t('studio.payments.overview.held')}
          value={summary.held}
          tone={colors.warning}
        />
        <OverviewTile
          icon={ArrowDownToLine}
          label={t('studio.payments.overview.released')}
          value={summary.released}
          tone={colors.success}
        />
      </View>
      <View className="flex-row gap-3">
        <OverviewTile
          icon={ShieldCheck}
          label={t('studio.payments.overview.secured')}
          value={summary.secured}
          tone={colors.info}
        />
        <OverviewTile
          icon={TrendingUp}
          label={t('studio.payments.overview.gross')}
          value={summary.gross}
          tone={colors.accent}
        />
      </View>
    </GlassContainer>
  );
}

export interface BankPayoutSectionProps {
  availableCents: number;
  model: ReceiptModel;
  onWithdraw: (amountCents: number) => void;
}

/**
 * Bloco de saque do tatuador/estúdio.
 *
 * O "Withdraw Sheet" é um `Modal` nativo (`transparent` + `animationType`
 * "slide") que substitui a div escura do web. O saque é simulado: haptic
 * `medium`, ~1.4s de loader nativo e, em caso de sucesso, haptic `success` e
 * subtração local do `available`.
 */
export function BankPayoutSection({
  availableCents,
  model,
  onWithdraw,
}: BankPayoutSectionProps) {
  const { t } = useI18n();
  const { triggerHaptic } = useHapticFeedback();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [done, setDone] = useState(false);

  const canWithdraw = availableCents > 0 && !withdrawing;

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const schedule = useCallback((fn: () => void, ms: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(fn, ms);
  }, []);

  const closeSheet = useCallback(() => {
    if (withdrawing) return;
    setSheetOpen(false);
    setDone(false);
  }, [withdrawing]);

  const openSheet = useCallback(() => {
    if (!canWithdraw) return;
    void triggerHaptic('light');
    setDone(false);
    setSheetOpen(true);
  }, [canWithdraw, triggerHaptic]);

  const confirmWithdraw = useCallback(() => {
    if (!canWithdraw) return;
    setWithdrawing(true);
    void triggerHaptic('medium');
    const amount = availableCents;
    schedule(() => {
      setWithdrawing(false);
      setDone(true);
      void triggerHaptic('success');
      onWithdraw(amount);
      schedule(() => {
        setSheetOpen(false);
        setDone(false);
      }, PAYOUT_SUCCESS_MS);
    }, PAYOUT_LATENCY_MS);
  }, [availableCents, canWithdraw, onWithdraw, schedule, triggerHaptic]);

  return (
    <GlassContainer className="gap-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Landmark size={16} color={colors.accent} />
          <AppText variant="body" className="text-sm font-semibold">
            {t('studio.payments.payout.title')}
          </AppText>
        </View>
        <AppText variant="muted" className="text-[11px] text-accent">
          {t(`studio.payments.model.${model}`)}
        </AppText>
      </View>

      <View>
        <AppText variant="muted" className="text-xs">
          {t('studio.payments.payout.available')}
        </AppText>
        <AppText variant="body" className="mt-0.5 text-2xl font-bold text-accent">
          {formatBRL(availableCents)}
        </AppText>
      </View>

      <Button
        label={t('studio.payments.payout.cta')}
        onPress={openSheet}
        disabled={!canWithdraw}
        loading={withdrawing}
      />

      <Modal
        visible={sheetOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={closeSheet}>
        <View className="flex-1 justify-end bg-black/70">
          <Pressable
            className="flex-1"
            accessibilityRole="button"
            accessibilityLabel={t('studio.payments.payout.sheet.cancel')}
            onPress={closeSheet}
          />
          <View
            accessibilityViewIsModal
            className="rounded-t-3xl border-t border-line bg-surface p-6 pb-8">
            <View className="mb-4 h-1 w-12 self-center rounded-full bg-line" />
            <AppText variant="heading">{t('studio.payments.payout.sheet.title')}</AppText>
            <AppText variant="muted" className="mt-1">
              {t('studio.payments.payout.sheet.description', {
                amount: formatBRL(availableCents),
              })}
            </AppText>

            <View className="mt-5 gap-2 rounded-2xl border border-line bg-elevated p-4">
              <View className="flex-row items-center justify-between">
                <AppText variant="muted" className="text-xs">
                  {t('studio.payments.payout.available')}
                </AppText>
                <AppText variant="body" className="text-sm font-semibold">
                  {formatBRL(availableCents)}
                </AppText>
              </View>
            </View>

            {done ? (
              <View className="mt-5 flex-row items-center justify-center gap-2 rounded-xl border border-success/40 bg-success/10 px-3 py-3">
                <Check size={16} color={colors.success} />
                <AppText variant="body" className="text-sm text-success">
                  {t('studio.payments.payout.success')}
                </AppText>
              </View>
            ) : (
              <View className="mt-5 gap-2">
                <Button
                  label={
                    withdrawing
                      ? t('studio.payments.payout.processing')
                      : t('studio.payments.payout.sheet.confirm')
                  }
                  onPress={confirmWithdraw}
                  loading={withdrawing}
                  disabled={withdrawing}
                />
                <Button
                  label={t('studio.payments.payout.sheet.cancel')}
                  variant="secondary"
                  onPress={closeSheet}
                  disabled={withdrawing}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </GlassContainer>
  );
}

function SplitRow({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <View className="flex-row items-center gap-2">
        <View className="h-2 w-2 rounded-full" style={{ backgroundColor: tone }} />
        <AppText variant="muted" className="text-xs">
          {label}
        </AppText>
      </View>
      <AppText variant="body" className="text-sm">
        {formatBRL(value)}
      </AppText>
    </View>
  );
}

export interface ReceiptCardProps {
  receipt: Receipt;
  model: ReceiptModel;
}

/**
 * Recibo de uma sessão confirmada/concluída: cabeçalho do artista, tags de
 * domínio, estado de escrow e o split financeiro exato do modelo ativo.
 */
export function ReceiptCard({ receipt, model }: ReceiptCardProps) {
  const { t, locale } = useI18n();
  const { styleLabel, bodyPartLabel, sessionDurationLabel } = portfolioLabelResolver(t);
  const { agendamento, split, escrow } = receipt;
  const escrowStyle = ESCROW_STYLE[escrow];

  return (
    <GlassContainer className="mb-3 gap-4">
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
          <AppText variant="muted" className="text-xs" numberOfLines={1}>
            {formatAgendaDateTime(agendamento.scheduledAt, locale)}
          </AppText>
        </View>
        <View className={`rounded-full border px-2.5 py-1 ${escrowStyle.chip}`}>
          <AppText variant="body" className={`text-[11px] font-semibold ${escrowStyle.text}`}>
            {t(`studio.payments.escrow.${escrow}`)}
          </AppText>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-1.5">
        <View className="rounded-full border border-line bg-surface px-2.5 py-1">
          <AppText variant="muted" className="text-[11px] text-ink">
            {styleLabel(agendamento.estilo)}
          </AppText>
        </View>
        <View className="rounded-full border border-line bg-surface px-2.5 py-1">
          <AppText variant="muted" className="text-[11px] text-ink">
            {bodyPartLabel(agendamento.bodyPart)}
          </AppText>
        </View>
        <View className="rounded-full border border-line bg-surface px-2.5 py-1">
          <AppText variant="muted" className="text-[11px] text-ink">
            {sessionDurationLabel(agendamento.sessionDuration)}
          </AppText>
        </View>
      </View>

      <View className="rounded-2xl border border-line bg-surface p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <CircleDollarSign size={15} color={colors.accent} />
            <AppText variant="body" className="text-sm font-semibold">
              {t('studio.payments.receipt.gross')}
            </AppText>
          </View>
          <AppText variant="body" className="text-sm font-semibold text-accent">
            {formatBRL(split.grossCents)}
          </AppText>
        </View>

        <View className="mt-3 border-t border-line pt-2">
          <SplitRow
            label={t('studio.payments.receipt.artist')}
            value={split.tatuador}
            tone={colors.accent}
          />
          <SplitRow
            label={t('studio.payments.receipt.platform')}
            value={split.plataforma}
            tone={colors.info}
          />
          <SplitRow
            label={t('studio.payments.receipt.studio')}
            value={split.estudio}
            tone={colors.success}
          />
          {split.impostos > 0 ? (
            <SplitRow
              label={t('studio.payments.receipt.taxes')}
              value={split.impostos}
              tone={colors.muted}
            />
          ) : null}
        </View>
      </View>
    </GlassContainer>
  );
}

function ReceiptsSkeleton() {
  return (
    <View className="gap-3">
      {[0, 1, 2].map((key) => (
        <Skeleton key={key} style={{ height: 210 }} />
      ))}
    </View>
  );
}

function ReceiptsError({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <GlassContainer className="items-center gap-2">
      <AppText variant="heading" className="text-center text-danger">
        {t('studio.payments.loadError')}
      </AppText>
      <AppText variant="muted" className="text-center">
        {t('studio.payments.loadErrorHint')}
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

function ReceiptsEmpty() {
  const { t } = useI18n();
  return (
    <View className="flex-1 items-center justify-center gap-3 px-8 py-12">
      <View className="h-16 w-16 items-center justify-center rounded-2xl bg-elevated">
        <ArrowDownToLine size={28} color={colors.accent} />
      </View>
      <AppText variant="heading" className="text-center">
        {t('studio.payments.empty.title')}
      </AppText>
      <AppText variant="muted" className="text-center">
        {t('studio.payments.empty.description')}
      </AppText>
    </View>
  );
}

export interface StudioPaymentsPanelProps {
  /** Papel reconciliado; default: `useSession`. Define o modelo de split. */
  role?: AppRole | null;
  /** Cabeçalho injetado pelo workspace (ex.: seletor de abas). */
  header?: ReactElement;
}

/**
 * Painel Financeiro do tatuador/estúdio (port da visão de Recebimentos do web).
 *
 * Roteado pelo `AgendaPaymentsWorkspace` quando `role !== 'cliente'`. Calcula o
 * split com `calculateSplits(value, receiptModelForRole(role))`, consolida os
 * saldos e permite o saque simulado com subtração local do `available`.
 */
export function StudioPaymentsPanel({ role, header }: StudioPaymentsPanelProps) {
  const { t } = useI18n();
  const session = useSession();
  const { agendamentos, isLoading, isError, refetch } = useAgenda();

  const resolvedRole = role ?? session.role;
  const model = useMemo(() => receiptModelForRole(resolvedRole), [resolvedRole]);
  const receipts = useMemo(() => buildReceipts(agendamentos, model), [agendamentos, model]);
  const summary = useMemo(() => summarizeReceipts(receipts), [receipts]);

  const [withdrawnCents, setWithdrawnCents] = useState(0);
  const availableCents = Math.max(summary.released - withdrawnCents, 0);

  const handleWithdraw = useCallback((amountCents: number) => {
    setWithdrawnCents((current) => current + amountCents);
  }, []);

  const listHeader = (
    <View className="gap-4 pb-4 pt-2">
      {header}
      <View className="gap-1">
        <AppText variant="title">{t('studio.payments.title')}</AppText>
        <AppText variant="muted">{t('studio.payments.subtitle')}</AppText>
      </View>
      <ReceiptsOverview summary={summary} model={model} />
      <BankPayoutSection
        availableCents={availableCents}
        model={model}
        onWithdraw={handleWithdraw}
      />
    </View>
  );

  return (
    <FlatList
      data={receipts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ReceiptCard receipt={item} model={model} />}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={
        isLoading ? (
          <ReceiptsSkeleton />
        ) : isError ? (
          <ReceiptsError onRetry={refetch} />
        ) : (
          <ReceiptsEmpty />
        )
      }
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      initialNumToRender={6}
      windowSize={7}
      removeClippedSubviews
    />
  );
}

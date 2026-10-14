import {
  BadgeCheck,
  Check,
  CreditCard,
  FileSignature,
  Lock,
  Smartphone,
} from 'lucide-react-native';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactElement,
} from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';

import { TrackerEmptyState } from '@/components/features/client-timeline-tracker';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { GlassContainer } from '@/components/ui/glass-container';
import { Skeleton } from '@/components/ui/skeleton';
import { TattooOTPInput } from '@/components/ui/tattoo-otp';
import type { OTPState } from '@/components/ui/otp-input';
import { colors } from '@/constants/theme';
import { useAgenda } from '@/hooks/use-agenda';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';
import { useI18n } from '@/hooks/use-i18n';
import { depositAmount } from '@/lib/agenda-timeline';
import { formatAgendaDateTime } from '@/lib/agenda-format';
import { formatBRL } from '@/lib/finance';
import {
  JOURNEY_STEPS,
  journeyIndex,
  journeyStepState,
  resolveJourneyStatus,
  type JourneyStatus,
} from '@/lib/payment-journey';
import { portfolioLabelResolver } from '@/lib/portfolio-metadata';
import type { Agendamento } from '@/lib/types/agenda';

const OTP_LENGTH = 6;
const SIGNATURE_VERIFY_MS = 720;
const SIGNATURE_CONFIRM_MS = 600;
const GATEWAY_LATENCY_MS = 900;

type IconComponent = ComponentType<{ size?: number; color?: string }>;
type GatewayMethod = 'google_pay' | 'card';

/** Agenda os `setTimeout` e limpa todos no unmount (evita update em desmontado). */
function useTimers() {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }, []);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  return schedule;
}

function MiniChip({ label }: { label: string }) {
  return (
    <View className="rounded-full border border-line bg-surface px-2.5 py-1">
      <AppText variant="muted" className="text-[11px] text-ink">
        {label}
      </AppText>
    </View>
  );
}

function JourneyDot({ state }: { state: 'done' | 'current' | 'upcoming' }) {
  if (state === 'done') {
    return (
      <View className="h-7 w-7 items-center justify-center rounded-full bg-accent">
        <Check size={14} color={colors.canvas} />
      </View>
    );
  }
  if (state === 'current') {
    return (
      <View className="h-7 w-7 items-center justify-center rounded-full border-2 border-accent bg-accent-glow">
        <View className="h-2.5 w-2.5 rounded-full bg-accent" />
      </View>
    );
  }
  return <View className="h-7 w-7 rounded-full border border-line bg-elevated" />;
}

/** Rastreador visual horizontal: Rascunho -> Aguardando Sinal -> Confirmado. */
function JourneyStepper({ status }: { status: JourneyStatus }) {
  const { t } = useI18n();
  const currentIndex = journeyIndex(status);

  return (
    <View className="flex-row">
      {JOURNEY_STEPS.map((step, index) => {
        const state = journeyStepState(index, currentIndex);
        const isFirst = index === 0;
        const isLast = index === JOURNEY_STEPS.length - 1;
        return (
          <View key={step} className="flex-1 items-center">
            <View className="w-full flex-row items-center">
              <View
                className={`h-0.5 flex-1 ${
                  isFirst ? 'bg-transparent' : index <= currentIndex ? 'bg-accent' : 'bg-line'
                }`}
              />
              <JourneyDot state={state} />
              <View
                className={`h-0.5 flex-1 ${
                  isLast ? 'bg-transparent' : index < currentIndex ? 'bg-accent' : 'bg-line'
                }`}
              />
            </View>
            <AppText
              variant="muted"
              className={`mt-2 text-center text-[11px] ${
                state === 'current' ? 'text-accent' : state === 'done' ? 'text-ink' : 'text-muted'
              }`}>
              {t(`payments.journey.${step}`)}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

function SignatureBlock({ onSigned }: { onSigned: () => void }) {
  const { t } = useI18n();
  const { triggerHaptic } = useHapticFeedback();
  const schedule = useTimers();
  const [expanded, setExpanded] = useState(false);
  const [code, setCode] = useState('');
  const [otpState, setOtpState] = useState<OTPState>('idle');
  const [verifying, setVerifying] = useState(false);

  const handleOpen = useCallback(() => {
    void triggerHaptic('light');
    setExpanded(true);
  }, [triggerHaptic]);

  const handleCancel = useCallback(() => {
    void triggerHaptic('selection');
    setCode('');
    setOtpState('idle');
    setVerifying(false);
    setExpanded(false);
  }, [triggerHaptic]);

  const handleCodeChange = useCallback((next: string) => {
    setCode(next);
    setOtpState('idle');
  }, []);

  const handleConfirm = useCallback(() => {
    if (verifying) return;
    if (code.length < OTP_LENGTH) {
      setOtpState('buzzing');
      schedule(() => setOtpState('error'), 520);
      return;
    }
    setVerifying(true);
    setOtpState('buzzing');
    schedule(() => {
      setVerifying(false);
      setOtpState('success');
      schedule(onSigned, SIGNATURE_CONFIRM_MS);
    }, SIGNATURE_VERIFY_MS);
  }, [code, onSigned, schedule, verifying]);

  return (
    <View className="rounded-2xl border border-line bg-surface p-4">
      <View className="flex-row items-center gap-2">
        <FileSignature size={16} color={colors.accent} />
        <AppText variant="body" className="flex-1 text-sm font-semibold">
          {t('payments.signature.title')}
        </AppText>
      </View>
      <AppText variant="muted" className="mt-1 text-xs">
        {t('payments.signature.description')}
      </AppText>

      {expanded ? (
        <View className="mt-4 gap-3">
          <TattooOTPInput
            value={code}
            onChangeText={handleCodeChange}
            state={otpState}
            length={OTP_LENGTH}
            label={t('payments.signature.otpLabel')}
            hint={t('payments.signature.otpHint')}
            errorMessage={t('payments.signature.error')}
            successMessage={t('payments.signature.success')}
            autoFocus
            editable={!verifying && otpState !== 'success'}
          />
          <View className="flex-row gap-2">
            <Button
              label={verifying ? t('payments.signature.verifying') : t('payments.signature.confirm')}
              onPress={handleConfirm}
              loading={verifying}
              disabled={verifying || otpState === 'success' || code.length === 0}
              className="flex-1"
            />
            <Button
              label={t('payments.signature.cancel')}
              variant="secondary"
              onPress={handleCancel}
              disabled={verifying}
              className="flex-1"
            />
          </View>
        </View>
      ) : (
        <Button label={t('payments.signature.cta')} onPress={handleOpen} className="mt-3" />
      )}
    </View>
  );
}

function GatewayButton({
  icon: Icon,
  label,
  onPress,
  loading,
  disabled,
}: {
  icon: IconComponent;
  label: string;
  onPress: () => void;
  loading: boolean;
  disabled: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={`h-12 flex-row items-center justify-center gap-2 rounded-xl border border-line bg-elevated px-4 ${
        disabled ? 'opacity-60' : 'active:bg-surface'
      }`}>
      {loading ? <ActivityIndicator color={colors.accent} /> : <Icon size={18} color={colors.ink} />}
      <AppText variant="body" className="text-sm font-semibold">
        {label}
      </AppText>
    </Pressable>
  );
}

function GatewayBlock({ amountCents, onPaid }: { amountCents: number; onPaid: () => void }) {
  const { t } = useI18n();
  const { triggerHaptic } = useHapticFeedback();
  const schedule = useTimers();
  const [method, setMethod] = useState<GatewayMethod | null>(null);
  const [paid, setPaid] = useState(false);

  const pay = useCallback(
    (next: GatewayMethod) => {
      if (method || paid) return;
      setMethod(next);
      void triggerHaptic('medium');
      schedule(() => {
        setPaid(true);
        void triggerHaptic('success');
        schedule(onPaid, 600);
      }, GATEWAY_LATENCY_MS);
    },
    [method, onPaid, paid, schedule, triggerHaptic],
  );

  return (
    <View className="rounded-2xl border border-line bg-surface p-4">
      <View className="flex-row items-center gap-2">
        <Lock size={16} color={colors.accent} />
        <AppText variant="body" className="flex-1 text-sm font-semibold">
          {t('payments.gateway.title')}
        </AppText>
        <AppText variant="body" className="text-sm font-semibold text-accent">
          {formatBRL(amountCents)}
        </AppText>
      </View>
      <AppText variant="muted" className="mt-1 text-xs">
        {t('payments.gateway.description', { amount: formatBRL(amountCents) })}
      </AppText>

      {paid ? (
        <View className="mt-3 flex-row items-center gap-2 rounded-xl border border-success/40 bg-success/10 px-3 py-2">
          <Check size={14} color={colors.success} />
          <AppText variant="body" className="text-xs text-success">
            {t('payments.gateway.success')}
          </AppText>
        </View>
      ) : (
        <View className="mt-4 gap-2">
          <GatewayButton
            icon={Smartphone}
            label={t('payments.gateway.googlePay')}
            loading={method === 'google_pay'}
            disabled={method !== null}
            onPress={() => pay('google_pay')}
          />
          <GatewayButton
            icon={CreditCard}
            label={t('payments.gateway.creditCard')}
            loading={method === 'card'}
            disabled={method !== null}
            onPress={() => pay('card')}
          />
        </View>
      )}
    </View>
  );
}

function ConfirmedBanner({ totalCents }: { totalCents: number }) {
  const { t } = useI18n();
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-success/40 bg-success/10 p-4">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-success/20">
        <BadgeCheck size={18} color={colors.success} />
      </View>
      <View className="flex-1">
        <AppText variant="body" className="text-sm font-semibold text-success">
          {t('payments.gateway.paid')}
        </AppText>
        <AppText variant="muted" className="text-xs">
          {`${t('payments.session.total')}: ${formatBRL(totalCents)}`}
        </AppText>
      </View>
    </View>
  );
}

function PaymentSessionCard({ agendamento }: { agendamento: Agendamento }) {
  const { t, locale } = useI18n();
  const [journey, setJourney] = useState<JourneyStatus>(() => resolveJourneyStatus(agendamento));
  const { styleLabel, bodyPartLabel, sessionDurationLabel } = portfolioLabelResolver(t);
  const depositCents = depositAmount(agendamento.totalCents);

  const handleSigned = useCallback(() => setJourney('aguardando_sinal'), []);
  const handlePaid = useCallback(() => setJourney('confirmado'), []);

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
          <AppText variant="muted" className="text-xs" numberOfLines={1}>
            {formatAgendaDateTime(agendamento.scheduledAt, locale)}
          </AppText>
        </View>
        <View className="items-end">
          <AppText variant="muted" className="text-[11px]">
            {t('payments.session.deposit')}
          </AppText>
          <AppText variant="body" className="text-sm font-semibold text-accent">
            {formatBRL(depositCents)}
          </AppText>
        </View>
      </View>

      <View className="mt-3 flex-row flex-wrap gap-1.5">
        <MiniChip label={styleLabel(agendamento.estilo)} />
        <MiniChip label={bodyPartLabel(agendamento.bodyPart)} />
        <MiniChip label={sessionDurationLabel(agendamento.sessionDuration)} />
      </View>

      <View className="mt-4">
        <JourneyStepper status={journey} />
      </View>

      <View className="mt-4">
        {journey === 'rascunho' ? <SignatureBlock onSigned={handleSigned} /> : null}
        {journey === 'aguardando_sinal' ? (
          <GatewayBlock amountCents={depositCents} onPaid={handlePaid} />
        ) : null}
        {journey === 'confirmado' ? <ConfirmedBanner totalCents={agendamento.totalCents} /> : null}
      </View>
    </View>
  );
}

function PaymentsSkeleton() {
  return (
    <View className="gap-3">
      {[0, 1, 2].map((key) => (
        <Skeleton key={key} style={{ height: 220 }} />
      ))}
    </View>
  );
}

function PaymentsError({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <GlassContainer className="items-center gap-2">
      <AppText variant="heading" className="text-center text-danger">
        {t('agenda.loadError')}
      </AppText>
      <AppText variant="muted" className="text-center">
        {t('agenda.loadErrorHint')}
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

export interface PaymentsPanelProps {
  /** Cabeçalho injetado pelo workspace (título + seletor de abas). */
  header?: ReactElement;
}

/**
 * Painel de Pagamentos do cliente (port da visão `cliente` de `payments-hub`).
 *
 * Lista as sessões (`PaymentSessionCard`) com a jornada Rascunho -> Aguardando
 * Sinal -> Confirmado, alternando entre o bloco de assinatura (OTP) e o gateway
 * de pagamento conforme o estágio. Exclui as visões de estúdio/tatuador.
 */
export function PaymentsPanel({ header }: PaymentsPanelProps) {
  const { agendamentos, isLoading, isError, refetch } = useAgenda();

  return (
    <FlatList
      data={agendamentos}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <PaymentSessionCard agendamento={item} />}
      ListHeaderComponent={header ?? null}
      ListEmptyComponent={
        isLoading ? (
          <PaymentsSkeleton />
        ) : isError ? (
          <PaymentsError onRetry={refetch} />
        ) : (
          <TrackerEmptyState variant="payments" />
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

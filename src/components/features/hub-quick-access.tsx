import {
  ChevronRight,
  Images,
  Lock,
  Rocket,
  Star,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';
import { useCallback } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors } from '@/constants/theme';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';
import { useI18n } from '@/hooks/use-i18n';

type HubActionKey = 'portfolio' | 'earnings' | 'reviews' | 'boost';

interface HubCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  locked?: boolean;
  lockedLabel?: string;
  onPress: () => void;
  className?: string;
}

function HubCard({
  icon: Icon,
  title,
  subtitle,
  locked = false,
  lockedLabel,
  onPress,
  className,
}: HubCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: locked }}
      accessibilityLabel={title}
      className={`flex-1 justify-between rounded-2xl border border-line bg-card p-4 active:bg-elevated ${
        locked ? 'opacity-60' : ''
      } ${className ?? ''}`}>
      <View className="flex-row items-start justify-between">
        <View
          className={`h-11 w-11 items-center justify-center rounded-xl ${
            locked ? 'bg-elevated' : 'bg-accent-glow'
          }`}>
          <Icon size={20} color={locked ? colors.muted : colors.accent} />
        </View>
        {locked ? (
          <Lock size={15} color={colors.muted} />
        ) : (
          <ChevronRight size={18} color={colors.muted} />
        )}
      </View>

      <View className="mt-4 gap-1">
        <AppText variant="body" className="font-semibold">
          {title}
        </AppText>
        <AppText variant="muted" className="text-xs" numberOfLines={2}>
          {subtitle}
        </AppText>
        {locked && lockedLabel ? (
          <View className="mt-2 self-start rounded-full border border-line bg-surface px-2.5 py-0.5">
            <AppText variant="muted" className="text-[10px] uppercase tracking-widest">
              {lockedLabel}
            </AppText>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export interface HubQuickAccessProps {
  onOpenPortfolio: () => void;
  onOpenEarnings: () => void;
}

/**
 * Bento-box de acesso rápido do Artist Studio Hub.
 *
 * Adaptação nativa do grid do web (`flexDirection: 'row'` + pesos flex).
 * Regras dos botões mapeados:
 *  - Portfólio -> abre o `PortfolioUpload` (view interna do hub).
 *  - Ganhos    -> redireciona para a aba `pagamentos` do dashboard.
 *  - Avaliações / Boost -> bloqueados ("Em breve") com haptic `medium`.
 */
export function HubQuickAccess({ onOpenPortfolio, onOpenEarnings }: HubQuickAccessProps) {
  const { t } = useI18n();
  const { triggerHaptic } = useHapticFeedback();

  const handlePress = useCallback(
    (action: HubActionKey) => {
      if (action === 'reviews' || action === 'boost') {
        void triggerHaptic('medium');
        return;
      }
      void triggerHaptic('light');
      if (action === 'portfolio') {
        onOpenPortfolio();
        return;
      }
      onOpenEarnings();
    },
    [onOpenEarnings, onOpenPortfolio, triggerHaptic],
  );

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}>
      <View className="gap-1">
        <AppText variant="label">TattooGo MK</AppText>
        <AppText variant="title">{t('studio.hub.title')}</AppText>
        <AppText variant="muted">{t('studio.hub.subtitle')}</AppText>
      </View>

      <View className="mt-5 gap-3">
        <View className="flex-row gap-3">
          <HubCard
            className="flex-[1.6]"
            icon={Images}
            title={t('studio.hub.portfolio.title')}
            subtitle={t('studio.hub.portfolio.subtitle')}
            onPress={() => handlePress('portfolio')}
          />
          <HubCard
            className="flex-1"
            icon={Wallet}
            title={t('studio.hub.earnings.title')}
            subtitle={t('studio.hub.earnings.subtitle')}
            onPress={() => handlePress('earnings')}
          />
        </View>

        <View className="flex-row gap-3">
          <HubCard
            icon={Star}
            title={t('studio.hub.reviews.title')}
            subtitle={t('studio.hub.reviews.subtitle')}
            locked
            lockedLabel={t('studio.hub.locked')}
            onPress={() => handlePress('reviews')}
          />
          <HubCard
            icon={Rocket}
            title={t('studio.hub.boost.title')}
            subtitle={t('studio.hub.boost.subtitle')}
            locked
            lockedLabel={t('studio.hub.locked')}
            onPress={() => handlePress('boost')}
          />
        </View>
      </View>
    </ScrollView>
  );
}

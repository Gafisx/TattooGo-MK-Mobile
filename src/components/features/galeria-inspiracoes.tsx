import { ChevronRight, Images, Sparkles } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';

import { GaleriaCard } from '@/components/features/galeria-card';
import {
  PortfolioFilterBar,
  type PortfolioHealingFilter,
} from '@/components/features/portfolio-filter-bar';
import { AppText } from '@/components/ui/app-text';
import { GlassContainer } from '@/components/ui/glass-container';
import { Skeleton } from '@/components/ui/skeleton';
import { colors } from '@/constants/theme';
import { useGaleria } from '@/hooks/use-galeria';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';
import { useI18n } from '@/hooks/use-i18n';
import type { GaleriaHealingFilter, GaleriaItem } from '@/lib/types/galeria';

export interface GaleriaInspiracoesProps {
  onStartConversation: (tatuadorId: string, artworkId: string) => void;
}

/** Home-entry link: Images + gallery.title + gallery.explore + ChevronRight. */
export function GaleriaEntryCard({ onPress }: { onPress?: () => void }) {
  const { t } = useI18n();
  const { triggerHaptic } = useHapticFeedback();

  return (
    <Pressable
      onPress={() => {
        void triggerHaptic('light');
        onPress?.();
      }}
      accessibilityRole="button"
      accessibilityLabel={t('gallery.explore')}
      className="flex-row items-center gap-3 rounded-2xl border border-line bg-card p-4 active:bg-elevated">
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-accent-glow">
        <Images size={20} color={colors.accent} />
      </View>
      <View className="flex-1">
        <AppText variant="body" className="font-semibold">
          {t('gallery.title')}
        </AppText>
        <AppText variant="muted">{t('gallery.explore')}</AppText>
      </View>
      <ChevronRight size={18} color={colors.muted} />
    </Pressable>
  );
}

function GalleryHeader() {
  const { t } = useI18n();
  return (
    <View className="px-5 pb-4 pt-2">
      <View className="flex-row items-center gap-3 rounded-2xl border border-line bg-card p-4">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-accent-glow">
          <Images size={20} color={colors.accent} />
        </View>
        <View className="flex-1">
          <AppText variant="heading">{t('gallery.title')}</AppText>
          <AppText variant="muted">{t('gallery.subtitle')}</AppText>
        </View>
      </View>
    </View>
  );
}

function SkeletonGrid() {
  return (
    <View className="flex-row gap-3 px-5 pb-6 pt-4">
      <View className="flex-1 gap-3">
        <Skeleton style={{ aspectRatio: 3 / 4 }} />
        <Skeleton style={{ height: 128 }} />
        <Skeleton style={{ aspectRatio: 3 / 4 }} />
      </View>
      <View className="flex-1 gap-3">
        <Skeleton style={{ height: 148 }} />
        <Skeleton style={{ aspectRatio: 3 / 4 }} />
        <Skeleton style={{ height: 128 }} />
      </View>
    </View>
  );
}

function GalleryEmpty({ hasFilters }: { hasFilters: boolean }) {
  const { t } = useI18n();
  return (
    <View className="flex-1 items-center justify-center gap-3 px-8">
      <View className="h-16 w-16 items-center justify-center rounded-2xl bg-elevated">
        <Sparkles size={28} color={colors.accent} />
      </View>
      <AppText variant="heading" className="text-center">
        {hasFilters ? t('gallery.emptyFiltered') : t('gallery.empty')}
      </AppText>
      <AppText variant="muted" className="text-center">
        {hasFilters ? t('gallery.emptyFilteredHint') : t('gallery.emptyHint')}
      </AppText>
    </View>
  );
}

function GalleryError({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <View className="flex-1 items-center justify-center px-5">
      <GlassContainer className="items-center gap-2">
        <AppText variant="heading" className="text-center text-danger">
          {t('gallery.loadError')}
        </AppText>
        <AppText variant="muted" className="text-center">
          {t('gallery.loadErrorHint')}
        </AppText>
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          className="mt-2 rounded-full border border-line bg-elevated px-4 py-2 active:bg-surface">
          <AppText variant="body" className="text-sm text-accent">
            {t('gallery.explore')}
          </AppText>
        </Pressable>
      </GlassContainer>
    </View>
  );
}

/**
 * Container principal da Galeria de Inspirações (port de
 * `galeria-inspiracoes.tsx`): header, filtros, estados (skeleton/error/empty)
 * e grid 2 colunas de `GaleriaCard`.
 */
export function GaleriaInspiracoes({ onStartConversation }: GaleriaInspiracoesProps) {
  const [style, setStyle] = useState('');
  const [bodyPart, setBodyPart] = useState('');
  const [healed, setHealed] = useState<GaleriaHealingFilter>('all');

  const query = useMemo(
    () => ({ style: style || undefined, bodyPart: bodyPart || undefined, healed }),
    [style, bodyPart, healed],
  );

  const { data, isLoading, isFetching, isError, refetch } = useGaleria(query);
  const items = data ?? [];
  const hasFilters = Boolean(style || bodyPart || healed !== 'all');

  const renderItem = useCallback(
    ({ item }: { item: GaleriaItem }) => (
      <GaleriaCard item={item} onStartConversation={onStartConversation} />
    ),
    [onStartConversation],
  );

  const handleHealingChange = useCallback((value: PortfolioHealingFilter) => {
    setHealed(value);
  }, []);

  return (
    <View className="flex-1">
      <GalleryHeader />

      <PortfolioFilterBar
        style={style}
        bodyPart={bodyPart}
        healed={healed}
        onStyleChange={setStyle}
        onBodyPartChange={setBodyPart}
        onHealingChange={handleHealingChange}
      />

      {isLoading ? (
        <SkeletonGrid />
      ) : isError ? (
        <GalleryError onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        <GalleryEmpty hasFilters={hasFilters} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 20 }}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          style={{ opacity: isFetching ? 0.8 : 1 }}
          initialNumToRender={6}
          windowSize={7}
          removeClippedSubviews
        />
      )}
    </View>
  );
}

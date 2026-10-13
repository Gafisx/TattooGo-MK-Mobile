import { Image } from 'expo-image';
import { Heart, MapPin, MessageCircle } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors } from '@/constants/theme';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';
import { useI18n } from '@/hooks/use-i18n';
import { useOfflineQueue } from '@/hooks/use-offline-queue';
import NetInfo from '@react-native-community/netinfo';
import { portfolioLabelResolver } from '@/lib/portfolio-metadata';
import { likeArtwork } from '@/lib/services/galeria';
import type { GaleriaItem } from '@/lib/types/galeria';

interface GaleriaCardProps {
  item: GaleriaItem;
  onStartConversation: (tatuadorId: string, artworkId: string) => void;
}

function Chip({ label }: { label: string }) {
  return (
    <View className="rounded-full border border-line bg-card/90 px-2.5 py-1">
      <AppText variant="muted" className="text-[11px] text-ink">
        {label}
      </AppText>
    </View>
  );
}

/**
 * Card da Galeria. Port 1:1 do `galeria-card.tsx` (web) adaptado para RN:
 * like otimista + fila offline, haptics, location, chips de domínio e
 * "iniciar conversa".
 */
export function GaleriaCard({ item, onStartConversation }: GaleriaCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(item.likesCount);
  const { triggerHaptic } = useHapticFeedback();
  const enqueue = useOfflineQueue((state) => state.enqueue);
  const { t } = useI18n();
  const { styleLabel, bodyPartLabel, sessionDurationLabel, healingLabel } =
    portfolioLabelResolver(t);

  const artistName = item.artist?.name || t('welcome.artistFallback');
  const studioName = item.artist?.studio
    ? item.artist.studio.name || t('studio.fallback')
    : null;
  const computedLocation =
    item.artist?.cidade && item.artist?.estado
      ? `${item.artist.cidade}/${item.artist.estado}`
      : item.artist?.cidade || null;
  const location = item.location ?? computedLocation;
  const initial = item.artist?.initial || artistName.charAt(0).toUpperCase();

  const handleLike = useCallback(async () => {
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikes((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    void triggerHaptic('medium');

    const online = (await NetInfo.fetch().catch(() => null))?.isConnected ?? true;
    if (!online) {
      enqueue('like', { id: item.id });
      return;
    }

    try {
      const count = await likeArtwork(item.id);
      if (typeof count === 'number') setLikes(count);
    } catch {
      enqueue('like', { id: item.id });
    }
  }, [enqueue, isLiked, item.id, triggerHaptic]);

  return (
    <View className="mb-3 flex-1 overflow-hidden rounded-2xl border border-line bg-card">
      <View>
        <Image
          source={{ uri: item.imageUrl }}
          style={{ width: '100%', aspectRatio: 3 / 4, backgroundColor: colors.elevated }}
          contentFit="cover"
          transition={200}
        />

        <View className="absolute left-2 top-2 flex-row gap-1.5">
          <Chip label={styleLabel(item.style)} />
          <Chip label={healingLabel(item.isHealed)} />
        </View>

        {location ? (
          <View className="absolute bottom-2 left-2 flex-row items-center gap-1 rounded-full bg-canvas/80 px-2.5 py-1">
            <MapPin size={12} color={colors.accent} />
            <AppText variant="muted" className="text-[11px] text-ink">
              {location}
            </AppText>
          </View>
        ) : null}
      </View>

      <View className="gap-2 p-3">
        <View className="flex-row items-center gap-2">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-accent-glow">
            <AppText variant="body" className="text-sm font-semibold text-accent">
              {initial}
            </AppText>
          </View>
          <View className="flex-1">
            <AppText variant="body" className="text-sm font-semibold" numberOfLines={1}>
              {artistName}
            </AppText>
            {studioName ? (
              <AppText variant="muted" className="text-xs" numberOfLines={1}>
                {studioName}
              </AppText>
            ) : null}
          </View>

          <Pressable
            onPress={handleLike}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isLiked ? t('aria.unlike') : t('aria.like')}
            accessibilityState={{ selected: isLiked }}
            className="flex-row items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1.5 active:bg-elevated">
            <Heart
              size={15}
              color={isLiked ? colors.accent : colors.subtle}
              fill={isLiked ? colors.accent : 'transparent'}
            />
            <AppText variant="body" className="text-xs" numberOfLines={1}>
              {likes}
            </AppText>
          </Pressable>
        </View>

        <View className="flex-row flex-wrap gap-1.5">
          <Chip label={bodyPartLabel(item.bodyPart)} />
          <Chip label={sessionDurationLabel(item.sessionDuration)} />
        </View>

        <Pressable
          onPress={() => {
            void triggerHaptic('light');
            onStartConversation(item.tatuadorId, item.id);
          }}
          accessibilityRole="button"
          accessibilityLabel={t('galeria.startConversation')}
          className="mt-1 flex-row items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 active:bg-accent-strong">
          <MessageCircle size={16} color={colors.canvas} />
          <AppText variant="body" className="text-sm font-semibold text-canvas">
            {t('galeria.startConversation')}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

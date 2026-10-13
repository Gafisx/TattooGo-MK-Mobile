import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors } from '@/constants/theme';
import { formatBRL } from '@/lib/finance';
import type { Artist } from '@/types';

interface ArtistCardProps {
  artist: Artist;
  onPress?: (artist: Artist) => void;
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function ArtistCardComponent({ artist, onPress }: ArtistCardProps) {
  return (
    <Pressable
      onPress={() => onPress?.(artist)}
      className="mb-4 flex-row items-center gap-4 rounded-2xl border border-line bg-card p-4 active:bg-elevated">
      <View className="h-14 w-14 items-center justify-center rounded-full bg-accent-glow">
        <AppText variant="heading" className="text-accent">
          {initials(artist.name)}
        </AppText>
      </View>

      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-1">
          <AppText variant="body" className="font-semibold">
            {artist.name}
          </AppText>
          {artist.verified ? (
            <Ionicons name="checkmark-circle" size={15} color={colors.accent} />
          ) : null}
        </View>
        <AppText variant="muted">{artist.city}</AppText>
        <View className="flex-row items-center gap-2">
          <Ionicons name="star" size={12} color={colors.warning} />
          <AppText variant="muted" className="text-xs">
            {artist.rating.toFixed(1)} · {artist.artworks} obras
          </AppText>
        </View>
      </View>

      <View className="items-end gap-1">
        <AppText variant="label">A partir de</AppText>
        <AppText variant="body" className="font-semibold text-accent">
          {formatBRL(artist.priceFromCents)}
        </AppText>
      </View>
    </Pressable>
  );
}

export const ArtistCard = memo(ArtistCardComponent);

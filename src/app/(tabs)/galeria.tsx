import { Ionicons } from '@expo/vector-icons';
import { useCallback } from 'react';
import { FlatList, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { colors } from '@/constants/theme';
import { portfolio } from '@/data/seed';
import { formatBRL } from '@/lib/finance';
import type { PortfolioPiece } from '@/types';

export default function GaleriaScreen() {
  const renderItem = useCallback(
    ({ item }: { item: PortfolioPiece }) => (
      <View className="mb-3 flex-1 gap-2 rounded-2xl border border-line bg-card p-3">
        <View className="aspect-square items-center justify-center rounded-xl bg-accent-glow">
          <Ionicons name="brush" size={28} color={colors.accent} />
        </View>
        <AppText variant="body" numberOfLines={1}>
          {item.title}
        </AppText>
        <View className="flex-row items-center justify-between">
          <AppText variant="muted" className="text-xs">
            {item.style}
          </AppText>
          <AppText variant="body" className="text-sm text-accent">
            {formatBRL(item.priceCents)}
          </AppText>
        </View>
      </View>
    ),
    [],
  );

  return (
    <Screen padded={false}>
      <View className="px-5 pt-2">
        <AppText variant="title">Galeria</AppText>
        <AppText variant="muted">Trabalhos disponíveis para agendamento</AppText>
      </View>
      <FlatList
        data={portfolio}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 20 }}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

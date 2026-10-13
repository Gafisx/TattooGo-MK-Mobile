import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { colors } from '@/constants/theme';

import { AppText } from './app-text';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
}

export function EmptyState({ icon = 'sparkles-outline', title, description }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-8">
      <View className="h-16 w-16 items-center justify-center rounded-2xl bg-elevated">
        <Ionicons name={icon} size={28} color={colors.accent} />
      </View>
      <AppText variant="heading" className="text-center">
        {title}
      </AppText>
      {description ? (
        <AppText variant="muted" className="text-center">
          {description}
        </AppText>
      ) : null}
    </View>
  );
}

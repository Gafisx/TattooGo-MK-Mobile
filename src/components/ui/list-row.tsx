import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { colors } from '@/constants/theme';

import { AppText } from './app-text';

interface ListRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showChevron?: boolean;
}

export function ListRow({ icon, title, subtitle, onPress, showChevron = true }: ListRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 border-b border-lineSoft py-4 active:opacity-70">
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-elevated">
        <Ionicons name={icon} size={18} color={colors.accent} />
      </View>
      <View className="flex-1">
        <AppText variant="body">{title}</AppText>
        {subtitle ? <AppText variant="muted">{subtitle}</AppText> : null}
      </View>
      {showChevron ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null}
    </Pressable>
  );
}

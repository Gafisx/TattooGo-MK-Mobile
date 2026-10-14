import { Brush, Building2, Check, User, type LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors } from '@/constants/theme';
import type { AppRole } from '@/lib/utils/dashboard-gate';

interface RoleOption {
  role: AppRole;
  title: string;
  description: string;
  Icon: LucideIcon;
}

const ROLE_OPTIONS: readonly RoleOption[] = [
  {
    role: 'cliente',
    title: 'Cliente',
    description: 'Quero encontrar e agendar tatuagens',
    Icon: User,
  },
  {
    role: 'tatuador',
    title: 'Tatuador',
    description: 'Quero atender e gerir a minha agenda',
    Icon: Brush,
  },
  {
    role: 'estudio',
    title: 'Estúdio',
    description: 'Quero gerir uma equipa de tatuadores',
    Icon: Building2,
  },
];

export interface RoleSelectorProps {
  value: AppRole | null;
  onChange: (role: AppRole) => void;
  /** Optional error shown below the options (e.g. from the form resolver). */
  error?: string;
}

/**
 * Native `RoleSelector`: the user picks between Cliente, Tatuador and Estúdio.
 * Keeps the web "dark luxury" treatment using the shared accents and lucide
 * icons, with a selected card that lights up its accent border and check mark.
 */
export function RoleSelector({ value, onChange, error }: RoleSelectorProps) {
  return (
    <View className="gap-2">
      <AppText variant="label">Eu sou</AppText>
      <View className="gap-3">
        {ROLE_OPTIONS.map(({ role, title, description, Icon }) => {
          const selected = value === role;
          return (
            <Pressable
              key={role}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${title}. ${description}`}
              onPress={() => onChange(role)}
              className={`flex-row items-center gap-3 rounded-2xl border p-4 ${
                selected ? 'border-accent bg-accent-glow' : 'border-line bg-surface'
              }`}>
              <View
                className={`h-11 w-11 items-center justify-center rounded-xl ${
                  selected ? 'bg-accent-glow' : 'bg-elevated'
                }`}>
                <Icon size={20} color={selected ? colors.accent : colors.subtle} />
              </View>
              <View className="flex-1">
                <AppText variant="body" className="font-semibold">
                  {title}
                </AppText>
                <AppText variant="muted" className="text-xs">
                  {description}
                </AppText>
              </View>
              {selected ? <Check size={18} color={colors.accent} /> : null}
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <AppText variant="muted" className="text-xs text-danger">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

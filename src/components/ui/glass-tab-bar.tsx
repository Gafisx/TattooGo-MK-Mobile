import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors } from '@/constants/theme';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';

/** First argument of the `Tabs` `tabBar` render prop (BottomTabBarProps). */
type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

/**
 * Floating "glass" bottom navigation.
 *
 * Dark-luxury treatment: an absolutely positioned, rounded bar lifted off the
 * safe-area bottom edge with a translucent `BlurView` surface. On iOS the blur
 * is real; on Android (expo-blur SDK 55+) a `BlurTargetView` + `blurTarget` ref
 * is required for a true blur, so we fall back to an equivalent frosted,
 * translucent surface (the tint layer below) to preserve the look.
 *
 * Active tint `#F97316` (accent) / inactive `zinc-500` (`colors.muted`).
 */
export function GlassTabBar({ state, descriptors, navigation, insets }: TabBarProps) {
  const { triggerHaptic } = useHapticFeedback();

  // `href: null` tabs are exposed by expo-router as `display: 'none'` items.
  const routes = state.routes.filter((route) => {
    const itemStyle = StyleSheet.flatten(
      descriptors[route.key].options.tabBarItemStyle,
    ) as ViewStyle | undefined;
    return itemStyle?.display !== 'none';
  });
  const focusedKey = state.routes[state.index]?.key;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.host, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.tint} />
        {routes.map((route) => {
          const { options } = descriptors[route.key];
          const focused = route.key === focusedKey;
          const color = focused ? colors.accent : colors.muted;
          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : (options.title ?? route.name);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              void triggerHaptic('selection');
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              className="flex-1 items-center justify-center gap-1 py-2">
              {options.tabBarIcon?.({ focused, color, size: 24 }) ?? (
                <Ionicons name="ellipse-outline" size={24} color={color} />
              )}
              <AppText
                variant="label"
                className="text-[10px]"
                style={{ color, textTransform: 'none' }}>
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    overflow: 'hidden',
    elevation: 0,
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  tint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(18, 18, 18, 0.72)',
  },
});

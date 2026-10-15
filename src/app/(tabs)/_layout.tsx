import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { type ColorValue } from 'react-native';

import { GlassTabBar } from '@/components/ui/glass-tab-bar';
import { colors } from '@/constants/theme';

const icon =
  (name: keyof typeof Ionicons.glyphMap, focusedName: keyof typeof Ionicons.glyphMap) => {
    function TabBarIcon({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) {
      return <Ionicons name={focused ? focusedName : name} size={size} color={color} />;
    }
    return TabBarIcon;
  };

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        // Dark Luxury floating bar: matte glass surface, orange neon when
        // active, zinc-500 when idle. No top header on any tab.
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        sceneStyle: { backgroundColor: colors.canvas },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Portfólio', tabBarIcon: icon('images-outline', 'images') }}
      />
      <Tabs.Screen
        name="agendar"
        options={{ title: 'Agendar', tabBarIcon: icon('calendar-outline', 'calendar') }}
      />
      <Tabs.Screen
        name="chat"
        options={{ title: 'Chat', tabBarIcon: icon('chatbubbles-outline', 'chatbubbles') }}
      />
      <Tabs.Screen
        name="perfil"
        options={{ title: 'Perfil', tabBarIcon: icon('person-outline', 'person') }}
      />
      <Tabs.Screen
        name="galeria"
        options={{ title: 'Galeria', tabBarIcon: icon('grid-outline', 'grid') }}
      />
      <Tabs.Screen name="tatuador" options={{ href: null }} />
      <Tabs.Screen name="estudio" options={{ href: null }} />
    </Tabs>
  );
}

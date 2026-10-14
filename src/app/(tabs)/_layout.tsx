import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, type ColorValue } from 'react-native';

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
      screenOptions={{
        // Dark Luxury bottom bar: matte #121212 surface, orange neon when
        // active, neutral gray when idle. No top header on any tab.
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
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

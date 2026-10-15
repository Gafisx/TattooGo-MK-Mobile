import { Ionicons } from '@expo/vector-icons';
import { Tabs, usePathname } from 'expo-router';
import { View, type ColorValue } from 'react-native';

import { AppHeader } from '@/components/ui/app-header';
import { GlassTabBar } from '@/components/ui/glass-tab-bar';
import { AppHeaderShownContext } from '@/components/ui/header-context';
import { colors } from '@/constants/theme';

const icon =
  (name: keyof typeof Ionicons.glyphMap, focusedName: keyof typeof Ionicons.glyphMap) => {
    function TabBarIcon({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) {
      return <Ionicons name={focused ? focusedName : name} size={size} color={color} />;
    }
    return TabBarIcon;
  };

/** Título do header global por rota (o header é partilhado pelas tabs). */
const HEADER_TITLES: Record<string, string> = {
  '/': 'Portfólio',
  '/agendar': 'Agendar',
  '/chat': 'Chat',
  '/perfil': 'Perfil',
  '/galeria': 'Galeria',
  '/tatuador': 'Painel do Tatuador',
  '/estudio': 'Painel do Estúdio',
};

function resolveHeaderTitle(pathname: string): string {
  if (HEADER_TITLES[pathname]) return HEADER_TITLES[pathname]!;
  const match = Object.keys(HEADER_TITLES)
    .filter((route) => route !== '/')
    .find((route) => pathname.startsWith(`${route}/`));
  return match ? HEADER_TITLES[match]! : 'TattooGo MK';
}

export default function TabsLayout() {
  const pathname = usePathname();

  return (
    <AppHeaderShownContext.Provider value={true}>
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <AppHeader title={resolveHeaderTitle(pathname)} />
        <Tabs
          tabBar={(props) => <GlassTabBar {...props} />}
          screenOptions={{
            // Dark Luxury floating bar: matte glass surface, orange neon when
            // active, zinc-500 when idle. No native header — the global
            // `AppHeader` above owns the safe-area top.
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
      </View>
    </AppHeaderShownContext.Provider>
  );
}

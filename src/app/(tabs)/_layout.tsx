import { Ionicons } from '@expo/vector-icons';
import { Tabs, router, usePathname } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { View, type ColorValue } from 'react-native';

import {
  ActionSheet,
  type ActionSheetAction,
  type ActionSheetRef,
} from '@/components/ui/action-sheet';
import { AppHeader } from '@/components/ui/app-header';
import { GlassTabBar } from '@/components/ui/glass-tab-bar';
import { AppHeaderShownContext } from '@/components/ui/header-context';
import { TattooMachineMenuTrigger } from '@/components/ui/menu-trigger';
import { colors } from '@/constants/theme';

const MENU_ACTIONS: ActionSheetAction[] = [
  {
    key: 'perfil',
    label: 'Meu perfil',
    description: 'Conta, agendamentos e preferências',
    icon: 'person-outline',
    onPress: () => router.push('/perfil'),
  },
  {
    key: 'ai',
    label: 'Estúdio de IA',
    description: 'Gere ideias de tatuagem',
    icon: 'sparkles-outline',
    onPress: () => router.push('/ai'),
  },
  {
    key: 'seja-tatuador',
    label: 'Seja um tatuador',
    description: 'Envie seus dados e CNPJ',
    icon: 'shield-checkmark-outline',
    onPress: () => router.push('/seja-tatuador'),
  },
  {
    key: 'preferencias',
    label: 'Preferências',
    description: 'Tema e idioma',
    icon: 'settings-outline',
    onPress: () => router.push('/perfil'),
  },
];

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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<ActionSheetRef>(null);

  const toggleMenu = useCallback(() => {
    if (menuOpen) {
      menuRef.current?.dismiss();
      return;
    }
    setMenuOpen(true);
    menuRef.current?.present();
  }, [menuOpen]);

  return (
    <AppHeaderShownContext.Provider value={true}>
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <AppHeader
          title={resolveHeaderTitle(pathname)}
          right={<TattooMachineMenuTrigger open={menuOpen} onPress={toggleMenu} />}
        />
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

        <ActionSheet
          ref={menuRef}
          title="Conta"
          description="Acesso rápido ao seu perfil"
          actions={MENU_ACTIONS}
          onDismiss={() => setMenuOpen(false)}
        />
      </View>
    </AppHeaderShownContext.Provider>
  );
}

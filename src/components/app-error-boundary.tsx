import * as SplashScreen from 'expo-splash-screen';
import type { ReactNode } from 'react';
import { Component } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

/**
 * Última linha de defesa da árvore React. Se a inicialização (env inválida,
 * ClerkProvider sem chave, storage indisponível) lançar durante o primeiro
 * render, escondemos a splash nativa e mostramos um ecrã de recuperação em vez
 * de deixar o utilizador preso numa tela preta.
 */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('[app] erro de inicialização não tratado:', error);
    SplashScreen.hideAsync().catch(() => {});
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Não foi possível iniciar a app</Text>
        <Text style={styles.message}>
          Fecha e reabre a aplicação. Se persistir, verifica a configuração
          (EXPO_PUBLIC_API_URL e EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY).
        </Text>
        <Text style={styles.detail} numberOfLines={4}>
          {error.message}
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.canvas,
  },
  title: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    marginTop: 12,
    color: colors.subtle,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  detail: {
    marginTop: 16,
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
  },
});

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { colors } from '@/constants/theme';

interface Message {
  id: string;
  mine: boolean;
  text: string;
}

const seedMessages: Message[] = [
  { id: 'm1', mine: false, text: 'Oi! Vi que você curtiu o leão realista.' },
  { id: 'm2', mine: true, text: 'Sim! Fecharia para o antebraço.' },
  { id: 'm3', mine: false, text: 'Consigo te encaixar quinta às 15h. O sinal é 90/9/1.' },
];

export default function ChatThreadScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const [draft, setDraft] = useState('');
  const [messages] = useState<Message[]>(seedMessages);

  return (
    <Screen padded={false}>
      <View className="flex-row items-center gap-3 border-b border-line px-4 py-3">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <View className="h-10 w-10 items-center justify-center rounded-full bg-accent-glow">
          <Ionicons name="person" size={18} color={colors.accent} />
        </View>
        <View className="flex-1">
          <AppText variant="body" className="font-semibold">
            Conversa
          </AppText>
          <AppText variant="muted" className="text-xs">
            thread {threadId}
          </AppText>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <View className="flex-1 gap-2 px-4 py-4">
          {messages.map((message) => (
            <View
              key={message.id}
              className={`max-w-[78%] rounded-2xl px-4 py-2 ${
                message.mine ? 'self-end bg-accent' : 'self-start border border-line bg-card'
              }`}>
              <AppText variant="body" className={message.mine ? 'text-canvas' : 'text-ink'}>
                {message.text}
              </AppText>
            </View>
          ))}
        </View>

        <View className="flex-row items-center gap-2 border-t border-line px-4 py-3">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Escreva uma mensagem"
            placeholderTextColor={colors.muted}
            className="h-11 flex-1 rounded-full border border-line bg-surface px-4 text-base text-ink"
          />
          <Pressable
            className="h-11 w-11 items-center justify-center rounded-full bg-accent active:bg-accent-strong"
            onPress={() => setDraft('')}>
            <Ionicons name="send" size={18} color={colors.canvas} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

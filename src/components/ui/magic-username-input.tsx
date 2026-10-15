import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors } from '@/constants/theme';
import { normalizeUsername, USERNAME_PATTERN } from '@/lib/validation';

/** Estados visuais do campo de `@username`. */
export type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

interface AvailabilityResult {
  username: string;
  result: 'available' | 'taken';
}

export interface MagicUsernameInputProps
  extends Omit<TextInputProps, 'value' | 'onChangeText' | 'autoCapitalize' | 'autoCorrect'> {
  /** Username normalizado (sem `@`). */
  value: string;
  /** Devolve o username normalizado (minúsculas, sem `@`). */
  onChangeText: (value: string) => void;
  label?: string;
  /** Dica neutra mostrada quando não há erro. */
  hint?: string;
  /** Erro externo (ex.: validação do formulário). */
  error?: string;
  /**
   * Verificação assíncrona de disponibilidade. Quando fornecida, o campo passa
   * por `checking` e resolve em `available`/`taken`.
   */
  checkAvailability?: (username: string) => Promise<boolean>;
  /** Janela de debounce da verificação (ms). Default: 450. */
  debounceMs?: number;
}

/**
 * Campo de escolha de `@username` com estados de borda "magic":
 *  - `available`  -> emerald (`success`)
 *  - `taken`/`invalid` -> red (`danger`)
 *  - `checking`/foco   -> orange (`accent`)
 *
 * O `@` é um adornment fixo (não faz parte do valor), pelo que o formulário
 * guarda sempre o username sem prefixo.
 *
 * O estado de disponibilidade é associado ao valor que o originou
 * (`AvailabilityResult.username`), evitando mostrar um resultado obsoleto
 * enquanto o utilizador continua a escrever.
 */
export function MagicUsernameInput({
  value,
  onChangeText,
  label,
  hint,
  error,
  checkAvailability,
  debounceMs = 450,
  onFocus,
  onBlur,
  editable = true,
  ...props
}: MagicUsernameInputProps) {
  const [focused, setFocused] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
  const requestRef = useRef(0);

  useEffect(() => {
    if (!checkAvailability) return;
    if (!value || !USERNAME_PATTERN.test(value)) return;

    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    const timer = setTimeout(() => {
      checkAvailability(value)
        .then((isAvailable) => {
          if (requestRef.current !== requestId) return;
          setAvailability({ username: value, result: isAvailable ? 'available' : 'taken' });
        })
        .catch(() => {
          // Falha de rede: mantém `checking` e deixa o utilizador reenviar.
        });
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, checkAvailability, debounceMs]);

  const formatValid = value.length > 0 && USERNAME_PATTERN.test(value);
  const formatInvalid = value.length > 0 && !formatValid;
  const matched = availability && availability.username === value ? availability.result : null;

  const effective: UsernameStatus = error
    ? 'invalid'
    : formatInvalid
      ? 'invalid'
      : value.length === 0
        ? 'idle'
        : checkAvailability
          ? (matched ?? 'checking')
          : 'available';

  const borderClass =
    effective === 'invalid' || effective === 'taken'
      ? 'border-danger'
      : effective === 'available'
        ? 'border-success'
        : focused || effective === 'checking'
          ? 'border-accent'
          : 'border-line';

  const message =
    error ??
    (effective === 'taken'
      ? 'Este @username já está em uso.'
      : effective === 'invalid'
        ? 'Use 3 a 20 caracteres: letras, números ou _.'
        : effective === 'available'
          ? 'Username disponível.'
          : effective === 'checking'
            ? 'A verificar disponibilidade…'
            : hint);
  const messageClass =
    effective === 'taken' || effective === 'invalid'
      ? 'text-danger'
      : effective === 'available'
        ? 'text-success'
        : 'text-muted';

  return (
    <View className="gap-2">
      {label ? <AppText variant="label">{label}</AppText> : null}
      <View
        className={`h-12 flex-row items-center gap-2 rounded-2xl border bg-surface/80 px-4 ${borderClass}`}>
        <AppText className="text-base font-semibold text-muted">@</AppText>
        <TextInput
          value={value}
          onChangeText={(text) => onChangeText(normalizeUsername(text))}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          editable={editable}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
          placeholder="oseuusername"
          placeholderTextColor={colors.muted}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel={label ?? '@username'}
          className="h-12 flex-1 text-base text-ink"
          {...props}
        />
        {effective === 'checking' ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : effective === 'available' ? (
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
        ) : effective === 'taken' || effective === 'invalid' ? (
          <Ionicons name="close-circle" size={20} color={colors.danger} />
        ) : null}
      </View>
      {message ? (
        <AppText variant="muted" className={`text-xs ${messageClass}`}>
          {message}
        </AppText>
      ) : null}
    </View>
  );
}

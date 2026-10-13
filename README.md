# TattooGo MK — Mobile

Native client for TattooGo MK, built with **Expo SDK 57**, **React Native** and
**NativeWind** (Tailwind for React Native). Dark-luxury visual contract:
canvas `#0a0a0a`, accent `#F97316`.

This app is a high-performance visual shell that talks directly to the existing
backend on Render (`api.tattoogomk.com.br`) and authenticates with **Clerk**.

## Requirements

- Node.js 22+
- A development build (Clerk, SecureStore and the native splash require native
  modules, so Expo Go is not enough): `npx expo run:ios|android` locally or
  `eas build --profile development`.

## Setup

1. Install dependencies (Expo resolves SDK-compatible versions):

   ```bash
   npx expo install
   ```

2. Configure environment variables:

   ```bash
   cp .env.example .env
   ```

   Then fill in `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`.
   Only public values belong in `.env`; secrets never ship in the client.

3. Start the dev server:

   ```bash
   npx expo start
   ```

## Commands

```bash
npx expo start        # dev server
npx expo lint         # lint
npx tsc --noEmit      # typecheck
npx expo-doctor       # dependency / config diagnostics
```

## Structure

```
src/
  app/                 # Expo Router routes (file-based)
    _layout.tsx        # Root layout + unified native splash gate
    (tabs)/            # portfolio, agendar, chat, perfil, galeria
    ai.tsx             # AI studio (modal)
    kyc-pendente.tsx   # KYC status flow
    seja-tatuador.tsx  # artist onboarding (CNPJ + OTP)
    chat/[threadId].tsx
  components/          # UI primitives and cards
  constants/theme.ts   # literal design tokens (mirror of tailwind.config.js)
  data/seed.ts         # temporary mock data (removed once the API is wired)
  lib/                 # api client, secure storage, finance, validation
  providers/           # Clerk provider (mounted only when configured)
```

## Notes

- The native splash is held (`preventAutoHideAsync`) until bootstrap finishes,
  then released once — a single clean cut with no hydration flicker.
- Sensitive values (auth token, Clerk session) live in `expo-secure-store`;
  preferences (theme, locale) live in `AsyncStorage`.
- Financial split is 90% artist / 9% platform / 1% studio (`src/lib/finance.ts`).

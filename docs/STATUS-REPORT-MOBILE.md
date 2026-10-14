# TattooGo MK — Relatório de Status do Repositório Mobile

Atualizado em: 2026-10-14
Alvo: Expo SDK 57 / React Native 0.86 / Hermes / NativeWind 4 / Expo Router 57
Backend: Render (`https://api.tattoogomk.com.br`)
Autenticação: Clerk (`@clerk/clerk-expo`)

---

## 0. Performance 3D — Draco vs. Quantização (decisão de arquitetura)

O pipeline de assets foi concluído e verificado. A meta de "2 a 3 MB" foi
atingida com **`KHR_mesh_quantization`** em build-time, e **não** com Draco.

| Métrica | Antes | Depois |
| --- | --- | --- |
| `assets/models/tattoo-machine.glb` | 21,07 MB | **2,28 MB (-89,2%)** |
| Vértices | 180.543 | 87.657 |
| Texturas/imagens embutidas | 4 | 0 |
| Extensão de compressão | — | `KHR_mesh_quantization` |

### Por que não Draco/Meshopt em runtime

Os decodificadores de Draco e de `EXT_meshopt_compression` dependem de
**WebAssembly + Web Workers**. O Hermes (engine JS do React Native) não expõe
`WebAssembly`, portanto um asset comprimido com Draco **falharia ao
descodificar no dispositivo**. `KHR_mesh_quantization` é um formato de
geometria suportado nativamente pelo `GLTFLoader` do three.js, sem wasm.

A compressão é, então, "assada" em build-time (Node suporta wasm, o dispositivo
não precisa decodificar nada). O motor R3F substitui todos os materiais em
runtime por `MeshStandardMaterial`, então texturas e UVs do asset original são
peso morto no mobile e são removidos no pipeline.

### Pipeline

- Script: `scripts/optimize-model.mjs` (`npm run model:optimize`).
- Etapas: `stripMaterialTextures` → `stripUnusedAttributes` (mantém apenas
  `POSITION` + `NORMAL`) → `dedup` → `weld` → `simplify` (ratio 0,5) → `prune`
  → `quantize`.
- Guarda de idempotência: aborta se o GLB já contiver `KHR_mesh_quantization`,
  evitando simplificação dupla do asset.

### Correções aplicadas nesta revisão (corrupção por fim de tokens)

1. `scripts/optimize-model.mjs` continha **sintaxe TypeScript dentro de um
   arquivo `.mjs`** (anotações `: GLTFDocument`, `: void`, `: Promise<void>` e
   `import { ..., type GLTFDocument }`), o que fazia o Node falhar com
   `SyntaxError` — o pipeline nunca havia executado. Reescrito em JavaScript
   válido.
2. `stat(...).byteLength` não existe em `fs.Stats` (é `.size`), o que produzia
   `before/after = NaN` no relatório. Corrigido.
3. `NodeIO.read(URL)` tentava uma requisição de rede (bloqueada). Trocado por
   `readFile` + `io.readBinary`.
4. Dependência transitiva `@gltf-transform/extensions` promovida a
   `devDependency` explícita (necessária para registrar `KHRMeshQuantization`).
5. Ausência do script `model:optimize` no `package.json`. Adicionado.

---

## 1. Infraestrutura e Conexão

- **URL do Render**: `https://api.tattoogomk.com.br`, centralizada em
  `src/lib/env.ts` (`API_FALLBACK_URL` / `apiBaseUrl`). O override vem de
  `EXPO_PUBLIC_API_URL`.
- **Clerk Bearer Token**: `src/lib/api.ts` injeta
  `Authorization: Bearer <session.getToken()>` em todas as chamadas
  autenticadas via `src/lib/auth/token.ts` (sem cookies do web; a sessão vive em
  `expo-secure-store` por meio de `src/lib/clerk-token-cache.ts`).
- **Variáveis de ambiente validadas**: `validatePublicEnv()` / `reportPublicEnv()`
  validam `EXPO_PUBLIC_API_URL` (http/https) e
  `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` (`pk_test_` / `pk_live_`), com o
  Clerk tratado como fatal apenas em produção. Executado no boot por
  `src/lib/bootstrap.ts`.
- **Bootstrap unificado**: splash nativa mantida (`preventAutoHideAsync`) até a
  hidratação de tema/locale/i18n/offline-queue, garantindo um único corte limpo.
- `.env.example` documenta as variáveis públicas; segredos nunca vão ao bundle.

## 2. Motor 3D & OTP

- **Engine R3F**: `@react-three/fiber/native` + `@react-three/drei/native` com
  `expo-gl`. Componente `src/components/ui/tattoo-machine-3d.tsx`.
- **Path Tracing**: `src/hooks/use-tattoo-path.ts` percorre curvas
  `CatmullRomCurve3` (waypoints de 0–9) atualizando uma ref mutável dentro do
  `useFrame`, sem re-render do React. `drawKey` força re-traçado de dígitos
  repetidos (ex.: "11").
- **Partículas de tinta na GPU**: `NeedleParticles` usa um único `<points>` com
  buffers `DynamicDrawUsage` (posição + cor com alpha) e cálculo por tempo;
  flash `PointLight` na ponta (laranja ao desenhar, vermelho no erro). Sem física
  pesada, visando 120 FPS.
- **Ciclo de vida de recursos**: materiais por instância (`chassis`/`detail`)
  são descartados no cleanup; geometrias compartilhadas com o cache do `useGLTF`
  são deliberadamente **não** descartadas (evita corromper o cache). `preload`
  configurado no fim do módulo (`useGLTF.preload(MODEL_SOURCE)`) para evitar
  re-download.
- **Sincronização Clerk com `setActive` adiado**:
  `src/components/features/auth-otp-panel.tsx` finaliza o fluxo com
  `setOtpState('success')` → `delay(SUCCESS_REDIRECT_DELAY_MS)` → `setActive` →
  `onAuthenticated()` → `router.replace('/(tabs)')`. Isso impede que o
  `AuthGate` redirecione e corte a animação de sucesso/partículas.
- **Robustez**: `MachineErrorBoundary` isola falhas de WebGL/carregamento para
  não derrubar a tela de OTP.

## 3. Casco e Roteamento

- **Expo Router** (file-based, `typedRoutes` + `reactCompiler` ativos):
  - Raiz `src/app/_layout.tsx`: `GestureHandlerRootView` → `SafeAreaProvider` →
    `AppProviders` (Clerk condicional + React Query) → `AuthGate` → `Stack`.
  - `(auth)`: `login`, `register` (OTP + `RoleSelector`).
  - `(tabs)`: `index` (Portfólio), `agendar`, `chat`, `perfil`, `galeria`, e as
    rotas ocultas `tatuador` (dashboard do artista) e `estudio` (dashboard do
    estúdio).
  - Fora das tabs: `onboarding`, `kyc-pendente`, `seja-tatuador`, `ai`
    (modal), `chat/[threadId]`.
- **Bottom Tabs Dark Luxury**: `src/app/(tabs)/_layout.tsx` com superfície
  `#121212`, borda hairline, tint ativo `#F97316` e inativo `#6B7280`.
- **AuthGate**: `src/components/features/auth-gate.tsx` mantém `(auth)` fora de
  `(tabs)` para não autenticados e quem não tem `role` vai para `onboarding`;
  sem publishable key o gate libera navegação (dev pass-through).
- **Gates especializados**: `ClienteOnly`, `TatuadorKycGate`, `RoleSelector`
  para as personas cliente / tatuador / estúdio.

## 4. Próximos Passos

- **Chat**: lista e `chat/[threadId]` existem, mas ainda usam
  `src/data/seed.ts`. Falta ligar aos endpoints `GET /api/chat/threads` e
  `GET /api/chat/threads/:id/messages` e consumir `pendingChatPeer` /
  `pendingChatArtwork` do `uiStore`.
- **Orçamento (Budget)**: ainda **não implementado** (nenhuma referência a
  orçamento/budget no código). Mapear a tela de orçamento do web e criar serviço
  + hook + rota.
- **Perfil**: `perfil.tsx` é um placeholder ("Convidado"). Falta o perfil real
  (dados do Clerk, edição, logout `signOut`, histórico).
- **Username interativo**: ainda **não implementado**. Falta o fluxo de escolha
  de disponibilidade de `@username` (validação + persistência).
- **Backend**: algumas rotas (`/api/studios/*`) já tentam a API e caem em store
  local (mock) enquanto o endpoint não existe — remover os mocks quando a API
  chegar.
- **Assets 3D**: reexecutar `npm run model:optimize` sempre que o `.glb` fonte
  for substituído (a guarda impede reprocessar o arquivo já quantizado).

---

## Estado de Qualidade (nesta revisão)

- `npx tsc --noEmit`: **OK** (exit 0).
- `npx eslint . --max-warnings=0`: **OK** (exit 0).
- Modelo 3D: **2,28 MB** dentro da meta de 2–3 MB.

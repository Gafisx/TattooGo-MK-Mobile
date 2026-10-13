# Agenda + Timeline do Cliente — Dossiê de Migração (web -> Expo)

## 1. Objetivo

Replicar no Expo o comportamento do workspace de Agenda/Pagamentos do cliente
(`AgendaPaymentsWorkspace`) e do rastreador de sessão (`ClientTimelineTracker`),
com paridade visual "Dark Luxury" (`#0a0a0a` + acentos `#F97316`), 16 idiomas e
feedback tátil.

## 2. Cadeia de render (web)

- app/dashboard/agenda/page.tsx -> rota (server, guard cliente)
- components/features/agenda-payments-workspace.tsx -> workspace (abas)
- components/features/client-timeline-tracker.tsx -> rastreador de sessão
- Guard: requireDashboardPerfil('cliente')  ->  `ClienteOnly` (native)

## 3. Abas do workspace

O workspace gerencia um seletor segmentado:

- Agendamentos -> lista de `ClientTimelineTracker` (uma linha do tempo por sessão).
- Pagamentos -> lista derivada (sinal 25% + saldo restante) por agendamento.

Perfil `cliente` vê o seletor segmentado + o rastreador; outros perfis são
bloqueados pelo guard.

## 4. Motor de estados da timeline

Port TypeScript puro (`src/lib/agenda-timeline.ts`):

- `SESSION_STEP_KEYS = ['sinal', 'confirmacao', 'sessao']` (ordem cronológica).
- `DEPOSIT_RATE = 0.25` -> `depositAmount(totalCents)` = sinal de 25%.
- `resolveStepState(stepIndex, currentIndex, total)` -> `done | current | upcoming`.
- `buildSessionTimeline(agendamento)` -> marcos resolvidos, `completedCount`,
  `progress` e `cancelled`.
- `TIMELINE_MILESTONES = [33, 66, 100]`: degraus de progresso (floor dos marcos
  concluídos / total).

Mapeamento status -> marco corrente:

| status       | marco corrente | progresso |
| ------------ | -------------- | --------- |
| `pendente`   | sinal          | 0%        |
| `sinal_pago` | confirmacao    | 33%       |
| `confirmado` | sessao         | 66%       |
| `concluido`  | (além do fim)  | 100%      |
| `cancelado`  | congelado no último marco atingido | 0% / 33% |

## 5. Contratos e dados

- `src/lib/types/agenda.ts`: `Agendamento`, `AgendaArtist`, `AgendaPayment`,
  enums canônicos de status.
- `src/lib/services/agendamentos.ts`: `GET /api/agendamentos` + derivação de
  pagamentos (`derivePayments`).
- `src/hooks/use-agenda.ts`: React Query (queryKey `['agendamentos','list']`).

## 6. i18n (16 locales)

- Camada de UI/domínio: `agenda.*` (mesclada em `getMessages()` via
  `src/lib/i18n/agenda-translations.ts`).
- Chaves dinâmicas: `agenda.status.<status>`, `agenda.step.<marco>[.description]`,
  `agenda.payment.status.<status>`.
- Locales: pt-BR, pt-PT, en, es, fr, de, it, ja, zh, ko, ar, ru, hi, nl, tr, pl.
  DEFAULT `pt-BR`, FALLBACK `en`.

## 7. Feedback tátil

`expo-haptics` (`useHapticFeedback`) na expansão/contração dos cards da timeline
(`selection` / `light`) e na troca de aba do seletor segmentado (`selection`).

## 8. Bloqueadores / mocks conhecidos

- `agendamentoService.getAgendamentos()` retorna `[]` (sem GET real): o serviço
  cai no seed `src/data/agenda-seed.ts` até o backend expor o GET.
- Split financeiro divergente (ver `docs/expo-migration-backlog.json`).

# Galeria de Inspirações — Dossiê de Migração (web -> Expo)

## 1. Objetivo

Replicar no Expo o comportamento da página dedicada "Galeria de Inspirações"
do dashboard do cliente.

## 2. Rota e cadeia de render (web)

- app/dashboard/galeria/page.tsx -> rota (server, guard cliente)
- app/dashboard/galeria/galeria-client.tsx -> wrapper client
- components/features/galeria-inspiracoes.tsx -> container principal
- Guard: requireDashboardPerfil('cliente')

## 3. Home vs Galeria (nao confundir)

- components/features/home-discover.tsx -> feed Discovery da Home (~528 linhas),
  usa useGaleria({ healed:'all' }) mas tem placeholders Unsplash (PLACEHOLDER_ARTISTS/PLACEHOLDER_INSPIRATIONS) e favoritar LOCAL (nao persiste). FORA DE ESCOPO desta feature.
- components/features/galeria-inspiracoes.tsx -> página dedicada (ESCopo real).

## 4. Componentes e hooks

- galeria-card.tsx -> card do item (like, abrir perfil, iniciar conversa)
- portfolio-filter-bar.tsx -> filtros estilo / parte do corpo / healing
- hooks/use-galeria.ts -> React Query -> GET /api/galeria
- lib/types/galeria.ts -> GaleriaItem / GaleriaArtist / GaleriaQuery

## 5. Contrato do endpoint

- GET /api/galeria (lib/services/galeria.ts):
  - params: style|estilo, bodyPart|body_part,
  - healed|isHealed|is_healed|status|healing, limit (default 48, max 60)
  - filtro: tatuador{role:'tatuador', kyc_status:'aprovado', statusConta:'ATIVO', deleted_at:null}
- resp: { sucesso, items } (created_at desc)
- like: POST /api/portfolio/like/:id -> { likes_count }
- auth: Bearer via Clerk getToken({skipCache:true}) + cookie tattoogo_token (localStorage)

## 6. i18n (duas camadas)

- UI: gallery.* | Dominio: portfolio.style/body/duration/healing.*
- (locales: pt-BR, pt-PT, en, es, fr, de, it, ja, zh, ko, ar, ru, hi, nl, tr, pl; DEFAULT pt-BR; FALLBACK en; key 'tattoogo-locale')

## 7. Acesso / papeis

AppRole cliente|tatuador|estudio; Galeria = cliente; KYC gate do tatuador.

## 8. Bloqueadores / mocks conhecidos

- agendamentoService.getAgendamentos() retorna [] (sem GET real).
- MOCK_STUDIO_ACTIVE_SESSIONS / MOCK_STUDIO_FINANCIAL_LEDGER (lib/mocks/).
- Split financeiro divergente: lib/finance.ts (90/9/1 solo, 88/8/3/1 estudio)
  vs lib/services/payment-engine.ts hardcoded 88/8/3/1.

## 9. Arquivos de referencia (web)

listados nas seções 2/4 e nos anexos deste prompt.

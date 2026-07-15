# Norden CRM — Front-end (Next.js)

## Comandos para criar o projeto do zero

Se estiver começando este pacote como base, os comandos abaixo são os que você
rodaria para chegar nessa mesma estrutura (o zip que te entreguei já vem com
os arquivos escritos, então você só precisa rodar `npm install` — mas documento
aqui para referência futura, ex: se quiser recriar em outra máquina).

```bash
# 1. Criar o projeto Next.js (App Router, TypeScript, Tailwind)
npx create-next-app@latest norden-crm-frontend \
  --typescript --tailwind --app --src-dir=false --import-alias "@/*" --eslint

cd norden-crm-frontend

# 2. Inicializar o shadcn/ui
npx shadcn@latest init

# Ao rodar o init, escolha:
#   Style: New York
#   Base color: Neutral
#   CSS variables: Yes

# 3. Adicionar os componentes shadcn usados pelo Layout Base + Login + Kanban + Chat + Meus Leads/Scripts + Configurações
npx shadcn@latest add button avatar dropdown-menu tooltip separator badge input label select table textarea dialog tabs switch

# 4. Lucide Icons (o shadcn já costuma trazer, mas garantindo)
npm install lucide-react

# 5. Drag-and-drop do Kanban (já implementado nesta entrega)
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# 6. Estado global e cache de requisições
npm install zustand @tanstack/react-query

# 7. Tempo real (Pusher) — já usado pelo backend na Fase 5
npm install pusher-js

# 8. Rodar localmente
npm run dev
```

## Variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha:

```bash
cp .env.local.example .env.local
```

## Estrutura de pastas

```
norden-crm-frontend/
├── middleware.ts                   # Protege rotas privadas (checa o cookie do JWT)
├── app/
│   ├── layout.tsx                 # Layout raiz (fontes, QueryProvider, AuthProvider)
│   ├── globals.css                # Tokens de design (cores, fontes) + Tailwind
│   ├── login/page.tsx              # Tela de login (fora do Shell)
│   └── (dashboard)/                # Grupo de rotas autenticadas — todas usam o Shell
│       ├── layout.tsx              # Monta Sidebar + Topbar em volta das páginas
│       ├── kanban/page.tsx          # Board + painel lateral (placeholder do chat)
│       ├── meus-leads/page.tsx
│       ├── scripts/page.tsx        # Quick Replies (Fase 5 do backend)
│       └── configuracoes/page.tsx
│
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx             # Sidebar recolhível
│   │   ├── topbar.tsx              # Barra superior
│   │   ├── whatsapp-status.tsx     # Indicador Online/Offline
│   │   └── user-menu.tsx           # Dropdown do perfil logado (lê o auth-store)
│   ├── kanban/
│   │   ├── board.tsx               # DndContext + agrupamento dos leads por coluna
│   │   ├── column.tsx              # Coluna droppable (suporta tom neutro p/ Standby)
│   │   ├── lead-card.tsx           # Card draggable (clique abre o painel lateral)
│   │   ├── origem-badge.tsx        # Tag discreta: Meta Ads / Site / Base Antiga
│   │   ├── temperatura-badge.tsx   # Selo Frio/Morno/Quente
│   │   └── corretor-filter.tsx     # Filtro por corretor (só gestor/admin)
│   ├── chat/
│   │   ├── chat-panel.tsx          # Painel principal (histórico + input + quick replies)
│   │   ├── message-bubble.tsx      # Balão claro (cliente) / grafite (imobiliária)
│   │   ├── message-status-icon.tsx # Tiques de status (pendente/enviada/entregue/lida)
│   │   └── quick-reply-popover.tsx # Lista flutuante do gatilho "/"
│   ├── providers/
│   │   ├── query-provider.tsx      # React Query Provider
│   │   └── auth-provider.tsx       # Hidrata a sessão a partir do cookie ao montar o app
│   └── ui/                         # Gerados pelo shadcn (button, avatar, input, select, etc.)
│
├── hooks/
│   ├── use-leads.ts                  # useQuery de GET /api/leads (RBAC no backend)
│   ├── use-atualizar-status-lead.ts  # useMutation com optimistic update (drag-and-drop)
│   ├── use-corretores.ts             # useQuery de GET /api/usuarios, só para o filtro
│   ├── use-pusher-kanban.ts          # Tempo real do board (patch cirúrgico via lead_atualizado)
│   ├── use-lead-detalhado.ts         # useQuery de GET /api/leads/:id (chat)
│   ├── use-enviar-mensagem.ts        # useMutation com envio otimista do balão
│   ├── use-chat-realtime.ts          # Tempo real do chat (nova_mensagem, status_mensagem)
│   └── use-quick-replies.ts          # useQuery de GET /api/quick-replies
│
├── lib/
│   ├── utils.ts                    # `cn()` helper (usado pelo shadcn)
│   ├── auth-cookie.ts              # Get/set/remove do cookie do JWT
│   ├── api-client.ts               # `apiFetch()` — injeta o token, trata 401
│   ├── pusher-client.ts            # Client Pusher singleton (authorizer dinâmico)
│   ├── leads-api.ts                # Chamadas HTTP de leads (buscar, mover, listar usuários)
│   ├── chat-api.ts                 # Chamadas HTTP do chat (lead detalhado, enviar, quick replies)
│   ├── template-variaveis.ts       # Substituição de {{variáveis}} (espelha o backend)
│   └── types.ts                    # Tipos do domínio (Lead, Mensagem, QuickReply, etc.)
│
└── store/
    ├── ui-store.ts                 # Zustand — estado do Shell (sidebar aberta/fechada)
    └── auth-store.ts               # Zustand — usuário logado (nome, papel, etc.)
```

## Autenticação

### Fluxo

1. `/login` (fora do grupo `(dashboard)`, sem Sidebar/Topbar) envia `POST /api/auth/login`.
2. Sucesso: o JWT vai para um cookie (`lib/auth-cookie.ts`) e os dados do usuário (nome, papel)
   vão para o Zustand (`store/auth-store.ts`). Redireciona para `/kanban` (ou para
   `?redirecionarPara=...`, se o middleware tiver mandado o usuário pro login a partir de outra rota).
3. Em toda navegação, o `middleware.ts` verifica se o cookie existe — sem ele, redireciona pra
   `/login`; com ele, libera a rota (a validade do JWT em si é responsabilidade do backend).
4. Ao carregar a aplicação, o `AuthProvider` (em `app/layout.tsx`) tenta hidratar o Zustand
   chamando `GET /api/usuarios/me` — é isso que faz a Sidebar/Topbar saberem nome, iniciais e
   papel do usuário sem precisar guardar esses dados no cookie.

### Cliente HTTP (`lib/api-client.ts`)

`apiFetch()` é um wrapper fino sobre `fetch` que:
- Anexa `Authorization: Bearer <token>` em toda chamada (a menos que `semAuth: true`, usado só
  no login).
- Em qualquer resposta `401`, limpa o cookie e chama o callback de logout registrado pelo
  `AuthProvider` — que limpa o Zustand e redireciona para `/login`.

**Sobre refresh token**: o backend (Fase 2) só tem `POST /api/auth/login`, emitindo um JWT de
8h — **não existe endpoint de refresh**. O comportamento atual no 401 é deslogar direto, que é o
único comportamento correto dado o que o backend oferece hoje. Se um endpoint de refresh for
adicionado depois, o lugar certo para plugar a lógica está comentado em `apiFetch` — a ideia
seria, antes de deslogar, tentar `POST /api/auth/refresh` e repetir a chamada original se der certo.

### Segurança do cookie

O JWT fica num cookie **não-httpOnly** (`lib/auth-cookie.ts` explica o porquê em comentário):
como o front-end fala direto com a API do backend via fetch client-side, um cookie httpOnly não
poderia ser lido para montar o header `Authorization`. Isso é uma escolha pragmática para um CRM
interno — se quiserem endurecer depois, o caminho é criar rotas `app/api/.../route.ts` no próprio
Next.js como proxy autenticado, aí sim com um cookie httpOnly de verdade.

## Kanban (Fase 7)

### Drag-and-drop e Optimistic UI

`components/kanban/board.tsx` usa `@dnd-kit/core` com um `PointerSensor` configurado com
`activationConstraint: { distance: 8 }` — é o que permite distinguir um clique normal (abre o
painel do lead) de um arrastar de verdade, sem precisar de nenhuma lógica extra de "clique vs
drag" no componente do card.

O movimento entre colunas (`hooks/use-atualizar-status-lead.ts`) é otimista: o card muda de
coluna imediatamente no cache do React Query, a requisição `PATCH /leads/:id/status` acontece
em paralelo, e só reverte (`onError`) se o backend recusar (ex: RBAC — corretor tentando mover
lead de outro corretor). Ao final (sucesso ou erro), a query é invalidada para ressincronizar
qualquer efeito colateral do backend (ex: `atendimentoHumano` sendo limpo ao mover manualmente).

### RBAC

- **Corretor**: não vê o filtro de corretor — o `GET /api/leads` já retorna só os dele (RBAC do
  backend, o front não precisa duplicar essa regra).
- **Gestor/Admin**: veem o dropdown "Filtrar por corretor" (`corretor-filter.tsx`), alimentado
  por `GET /api/usuarios` filtrado a `papel === 'corretor' && ativo`.

### 8ª coluna: Standby / Nutrição (`frio_standby`)

Resolvido: `frio_standby` agora é sua própria coluna, "Standby / Nutrição", posicionada antes de
"Perdido" e com tom neutro/acinzentado (`tom: 'neutro'` em `ColunaConfig`) — não compete
visualmente com as colunas "quentes" (Em Atendimento/Proposta). Reflete a regra de negócio: no
alto padrão, quem não responde à cadência inicial não é um lead inválido, é um ciclo de decisão
mais longo.

### Card do lead

Nome (ou telefone, se ainda não tiver nome), badge de origem (Meta Ads/Site/Base Antiga), selo
de temperatura (ícone + cor por Frio/Morno/Quente — sem selo para "não avaliado", pra não
poluir visualmente leads recém-chegados), bairro do imóvel de interesse quando disponível, e o
alerta "Aguardando Resposta" quando `atendimentoHumano` está ativo.

### Hook para o chat (clique no card)

`app/(dashboard)/kanban/page.tsx` implementa a Regra 4: clicar no card (sem arrastar) muda a
URL para `/kanban?leadId=...` e abre o `ChatPanel` — ver seção do Chat abaixo.

## Chat (Fase 8)

### Componentes

- `components/chat/chat-panel.tsx` — painel principal: cabeçalho (nome, origem, temperatura,
  bairro), histórico de mensagens, alerta de transbordo, input com gatilho de Quick Replies.
- `components/chat/message-bubble.tsx` — balão claro (borda) para o cliente, balão grafite
  (`bg-sidebar`) para a imobiliária — mesma cor da Sidebar, reforçando a identidade visual.
- `components/chat/message-status-icon.tsx` — tiques (pendente → enviada → entregue → lida),
  ícone de alerta se falhar.
- `components/chat/quick-reply-popover.tsx` — lista flutuante acima do input.

### Auto-scroll

`chat-panel.tsx` mantém uma ref no fim da lista de mensagens e chama `scrollIntoView` sempre que
`mensagens.length` muda — cobre tanto mensagens novas quanto o envio otimista.

### Tempo real (Pusher)

- `lib/pusher-client.ts`: client singleton com `authorizer` customizado, que lê o token do
  cookie **no momento da assinatura** (não na criação do client) e chama
  `POST /api/pusher/auth` — o mesmo endpoint com RBAC que já existia desde a Fase 5.
- `hooks/use-chat-realtime.ts`: assina `private-lead-{leadId}` só enquanto o chat está aberto.
  Escuta `nova_mensagem` (adiciona o balão, sem duplicar o que já veio do envio otimista) e
  `status_mensagem` (atualiza o tique do balão certo).
- `hooks/use-pusher-kanban.ts`: assina `private-kanban` pelo tempo de vida do board, e faz um
  patch cirúrgico no card certo em `lead_atualizado` — é o que faz o card virar "Aguardando
  Resposta" sozinho, mesmo com o corretor de olho no board (Regra do Transbordo Automático,
  refletida tanto no card quanto no cabeçalho do chat).

**Ajuste feito no backend para isso funcionar**: `atualizarStatusMensagem` (no
`WhatsappService`) não disparava nenhum evento Pusher — só atualizava o banco. Adicionei
`notificarStatusMensagem` (`src/lib/pusher.ts`) para fechar essa lacuna; sem isso, os tiques de
entregue/lida nunca apareceriam em tempo real. Baixe o zip atualizado do backend se ainda
estiver com uma versão anterior.

### Quick Replies (gatilho `/`)

`chat-panel.tsx` busca a lista completa de quick replies uma vez (evita 1 request por tecla) e
filtra localmente pelo título assim que o texto começa com `/`. Navegação por teclado: `↑`/`↓`
move o destaque, `Enter` seleciona, `Escape` limpa o gatilho. Ao selecionar, o texto já sai
**substituído** (`lib/template-variaveis.ts`, espelhando a lógica do backend) e cai na caixa de
texto para o corretor revisar antes de enviar — a decisão de UX que já tínhamos documentado na
Fase 5.

### Transbordo Automático (Regra da Fase 4) refletido no front

Ao chegar uma mensagem `recebida` via Pusher, o `use-chat-realtime` invalida a query do lead —
isso recarrega `status`/`atendimentoHumano` atualizados (o backend já pausou a cadência e mudou
o status nesse momento), fazendo o alerta vermelho aparecer no cabeçalho do chat automaticamente.

## Meus Leads e Scripts (Fase 9)

### Meus Leads (`components/leads-table/`)

- `leads-data-table.tsx`: tabela (`components/ui/table.tsx`, primitivas puras — não precisa de
  Radix) com paginação (`page`/`pageSize` já suportados pelo backend) e `keepPreviousData` do
  React Query, pra não "piscar" a tabela ao trocar de página/filtro.
- `filtros-tabela.tsx`: busca por nome/telefone com debounce de 400ms (evita 1 request por
  tecla) + selects de Status/Origem/Temperatura.
- **RBAC**: a coluna "Corretor" (com o dropdown de transferência, `transferir-corretor-select.tsx`)
  só aparece para `gestor`/`admin`. Um corretor não vê essa coluna — a listagem já vem filtrada
  pelo backend pra ele de qualquer forma.
- Clicar na linha navega para `/kanban?leadId=...`, reaproveitando o `ChatPanel` que já existe —
  não duplicamos a interface de chat em dois lugares.

**Ajuste no backend**: `GET /api/leads` não tinha busca livre por texto — adicionei o parâmetro
`busca` (`leads.schema.ts` + `leads.service.ts`), que filtra por nome OU telefone (`contains`,
case-insensitive), combinado em AND com os demais filtros (status, origem, temperatura,
corretorId). Baixe o zip atualizado do backend.

### Scripts (`components/scripts/`)

- `scripts-list.tsx`: lista com badge Global (fundo âmbar/latão) ou Pessoal (cinza neutro).
  Botões de editar/excluir só aparecem quando o usuário tem permissão — mesma regra do backend
  espelhada no front (`gestor`/`admin` edita qualquer um; `corretor` só os próprios `pessoal`).
- `script-form-dialog.tsx`: formulário de criação/edição com dica de variáveis
  (`{{lead_name}}`, `{{broker_name}}`) logo abaixo do campo de texto. O seletor de
  Global/Pessoal só aparece na **criação** (o `tipo` é imutável depois de criado, mesma regra do
  backend) e só é oferecido a `gestor`/`admin` — um corretor vê só a explicação de que os
  scripts dele são sempre pessoais.
- Exclusão pede confirmação inline (dois botões substituindo o ícone de lixeira) — decisão
  deliberada de não usar um segundo Dialog de confirmação, para não empilhar modais.

### Novos componentes shadcn

Adicionei `Table`, `Textarea` e `Dialog` (`components/ui/`), no mesmo padrão dos demais — se
rodar `npx shadcn add table textarea dialog` depois, eles devem se sobrescrever sem conflito.

## Configurações (Fase 10) — MVP completo

### RBAC estrito: só Admin

Diferente do padrão gestor+admin usado no resto do sistema, esta tela é **exclusiva de
`admin`** — decisão explícita da Fase 10 (criação de acessos + segurança da operação de
WhatsApp são sensíveis demais para o nível "Gestor" genérico):

- `components/layout/sidebar.tsx`: o item "Configurações" nem aparece na Sidebar para quem não
  é `admin` (`somenteAdmin: true` no item de navegação).
- `app/(dashboard)/configuracoes/page.tsx`: guard próprio — se um `gestor`/`corretor` navegar
  direto pra URL, é redirecionado para `/kanban`.
- **Backend**: `POST /usuarios` e `PATCH /usuarios/:id` foram restritos a `admin` (antes eram
  gestor+admin, igual ao resto do sistema) — baixe o zip atualizado do backend.

### Aba 1 — Gestão de Equipe (`components/settings/team-tab.tsx`)

CRUD simples: criar corretor/gestor/admin com senha temporária (`user-form-dialog.tsx`), e um
`Switch` para ativar/desativar cada acesso. Desativar **não apaga nada** — só impede login; o
histórico de mensagens continua vinculado ao usuário (`enviadaPorUsuarioId` no backend nunca é
removido).

### Aba 2 — Motor e Segurança do WhatsApp (`components/settings/whatsapp-tab.tsx`)

- **Limite diário editável de verdade**: antes, `MAX_DAILY_MESSAGES` só existia como variável de
  ambiente (mudar exigia redeploy). Adicionei um override em tempo real no Redis
  (`obterLimiteDiario`/`definirLimiteDiario` no backend) — a trava anti-ban já lê esse valor,
  então a mudança feita aqui tem efeito imediato no worker de cadência, sem reiniciar nada.
- **Painel de status das integrações**: só booleanos (configurado/não configurado) para
  WhatsApp, Meta Ads, Imobzi e Pusher — **nunca os valores reais dos tokens**. Decisão de
  segurança deliberada: um formulário web que aceita e transmite segredos de API é uma
  superfície de risco desnecessária (histórico do navegador, devtools) quando o
  `.env`/secrets manager do provedor de hospedagem já resolve isso corretamente. Editar os
  tokens de verdade continua sendo feito no ambiente de hospedagem, não por aqui.

## MVP 100% completo

Kanban (Fase 7), Chat (Fase 8), Meus Leads/Scripts (Fase 9) e Configurações (Fase 10) — as 4
seções da Sidebar têm conteúdo real e funcional, prontas para os testes reais de deploy.

## Próximos passos (pós-MVP)

- Reset de senha de um usuário existente (hoje só é definida na criação).
- Dashboard de métricas (conversão por origem, volume de mensagens por corretor).
- Notificações do navegador quando uma mensagem chega com o chat fechado.

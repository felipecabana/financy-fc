# Financy — Frontend

SPA em **React + TypeScript + Vite** que consome a API GraphQL do backend. O app cobre as seis telas principais — login, cadastro, dashboard, transações, categorias e perfil — com navbar autenticada, rotas protegidas, CRUD completo e modais de criação/edição compartilhados entre as páginas.

---

## Sobre o projeto

O frontend é um app standalone em `frontend/`, separado do backend. A comunicação com o servidor é feita via GraphQL (Apollo Client), conforme o padrão do repositório. O fluxo cobre autenticação, dashboard, páginas dedicadas de transações e categorias, perfil com logout e exclusão de itens com confirmação.

**O que está rodando hoje:** Node 20.19+ ou 22.12+, TypeScript strict, React 19, Vite 8, Tailwind CSS, shadcn/ui, Apollo Client, Zustand, react-router-dom, sonner, lucide-react, Vitest e ESLint.

---

## Estrutura atual

```
frontend/
├── src/
│   ├── assets/                   # SVGs, logos estáticos
│   ├── components/               # componentes reutilizáveis globais
│   │   ├── Header.tsx
│   │   ├── Layout.tsx
│   │   ├── Logo.tsx
│   │   ├── Page.tsx
│   │   ├── StyleGuidePreview.tsx # preview dos primitivos visuais
│   │   └── ui/                   # shadcn/ui (button, input, label, dialog, card)
│   ├── lib/
│   │   ├── category-icons.tsx    # ícones de categoria compartilhados (CategoryIcon)
│   │   ├── graphql/
│   │   │   ├── apollo.ts         # Apollo Client centralizado (HttpLink + credentials)
│   │   │   ├── mutations/
│   │   │   │   ├── Auth.ts       # login, signup e logout
│   │   │   │   ├── Category.ts   # createCategory, updateCategory e deleteCategory
│   │   │   │   ├── Transaction.ts # createTransaction, updateTransaction e deleteTransaction
│   │   │   │   └── User.ts       # updateUser
│   │   │   └── queries/
│   │   │       ├── Category.ts   # listCategories
│   │   │       ├── Transaction.ts # listTransactions
│   │   │       └── User.ts       # me
│   │   └── utils.ts              # utilitários globais (cn)
│   ├── pages/
│   │   ├── Auth/
│   │   │   ├── Login.tsx         # formulário de login em /
│   │   │   ├── Signup.tsx        # formulário de cadastro em /signup
│   │   │   ├── login-schema.ts   # validação Zod
│   │   │   └── signup-schema.ts
│   │   ├── Dashboard/
│   │   │   ├── components/       # listas, cards, seções, dialogs e confirmação de exclusão
│   │   │   ├── category-schema.ts
│   │   │   ├── transaction-schema.ts
│   │   │   ├── useDashboardData.ts
│   │   │   └── index.tsx         # exibido em / quando logado
│   │   ├── Transactions/         # /transactions
│   │   ├── Categories/           # /categories
│   │   ├── Profile/              # /profile
│   │   └── Root/
│   │       └── index.tsx         # alterna Login e Dashboard conforme sessão
│   ├── stores/
│   │   └── auth.ts               # Zustand + persist
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx                   # Layout global, rotas, bootstrap de sessão (me) e ProtectedRoute
│   ├── main.tsx                  # entry point + ApolloProvider + BrowserRouter
│   ├── index.css                 # tokens e estilos globais (Tailwind)
│   └── vite-env.d.ts             # tipagem de VITE_BACKEND_URL
├── tests/                        # auth, dashboard, páginas, dialogs e perfil
│   ├── helpers/
│   └── setup/
├── components.json               # configuração shadcn/ui
├── .env.example                  # VITE_BACKEND_URL
├── index.html
└── vite.config.ts                # Vite + Vitest + alias @/
```

Imports usam o alias `@/` apontando para `src/`.

---

## Implementado até aqui

### Tooling do frontend

Workspace em `frontend/` com TypeScript strict, módulos ESM e build em `dist/`. Tem scripts para desenvolvimento (`dev`, `preview`), build de produção, checagem de tipos, lint, testes e um `check` que roda tudo junto.

- `npm run dev` — Vite com hot reload em `http://localhost:5173`
- `npm run build` — type-check + bundle de produção
- `npm run preview` — serve o build localmente
- `npm run check` — validação completa (type-check, lint, test, build)

### Ambiente e cliente GraphQL

Variável `VITE_BACKEND_URL` documentada em `.env.example` (fallback local: `http://localhost:4000/graphql`). O Apollo Client vive em `src/lib/graphql/apollo.ts` — `HttpLink` com `credentials: 'include'` para enviar o cookie de sessão automaticamente. O `main.tsx` envolve o app com `ApolloProvider`.

Testes em `tests/apollo.test.ts` cobrem a URL do backend, o transporte HTTP e o envio de cookies nas requisições.

### Sistema visual e componentes

Tailwind CSS v4 com tokens de marca, escala de cinzas e cores de feedback em `src/index.css`. shadcn/ui inicializado com primitivos em `src/components/ui/` (button, input, label, dialog, card). Utilitário `cn()` em `src/lib/utils.ts` com `clsx` e `tailwind-merge`. Fonte Inter carregada via Google Fonts.

Shell de layout em `Layout`, `Page` e `Header`, com notificações via `Toaster` (sonner). O `main` preenche a altura da viewport (`100svh`) com fundo cinza em todas as rotas. Padding responsivo no header e nas páginas. Ícones com `lucide-react`.

### Autenticação e roteamento

Store `useAuthStore` em `src/stores/auth.ts` (Zustand + persist) guarda só `user` e `isAuthenticated` — sem JWT no `localStorage`. `setSession(user)` cria a sessão após login ou cadastro; `logout` limpa o store e o cache do Apollo.

No boot do app, `SessionBootstrap` em `App.tsx` executa a query `me` para validar o cookie de sessão e reidratar o usuário após refresh. Enquanto isso, a UI fica em loading para evitar flash de tela errada.

A rota `/` renderiza `Login` ou `Dashboard` conforme a sessão (`RootPage`), sem redirect. Rotas protegidas em `/transactions`, `/categories` e `/profile`; cadastro em `/signup` com `GuestRoute`. O `Header` exibe navbar com links para Dashboard, Transações e Categorias, além do avatar que leva ao perfil; em páginas de visitante (login e cadastro), o header não é renderizado.

Formulários de login e cadastro com validação Zod, mutations GraphQL (`login` e `signup`) e criação de sessão via `setSession` após sucesso — a resposta traz só `user`; o JWT fica no cookie HttpOnly definido pelo backend. O cadastro envia o nome completo para a API. Erros de credenciais, e-mail duplicado e falha de conexão são exibidos no formulário.

Testes em `tests/auth-store.test.ts`, `tests/auth-navigation.test.tsx`, `tests/auth-forms.test.tsx` e `tests/app-session.test.tsx` cobrem persistência sem token, guards, navegação, fluxo dos formulários e restauração de sessão via `me`.

### Dashboard autenticado

Tipos `Category` e `Transaction` em `src/types/index.ts`. Queries `LIST_CATEGORIES` e `LIST_TRANSACTIONS` em `src/lib/graphql/queries/`. O hook `useDashboardData` busca os dados via Apollo apenas com sessão ativa (`skip` quando deslogado) e expõe `refetch` para atualização das listas.

A página `Dashboard` exibe cards de resumo com saldo total, receitas e despesas do mês (calculados a partir das transações), transações recentes e categorias do usuário logado, com estados de loading, erro e listas vazias. Componentes em `pages/Dashboard/components/` (`SummaryCards`, `TransactionsSection`, `TransactionList`, `CategoriesSection`, `CategoryList`, `TransactionDialog`, `CategoryDialog`, `DeleteConfirmDialog`).

No dashboard, as listas são somente leitura: transações em três colunas em telas largas (sem ações de editar ou excluir) e categorias em linha única compacta. A criação de itens continua pelos botões **Nova transação** e **Nova categoria**, que abrem os respectivos dialogs.

O utilitário `CategoryIcon` em `src/lib/category-icons.tsx` centraliza o mapeamento de ícones de categoria e é reutilizado nas listas de transações e categorias, inclusive no card de categoria mais utilizada na página dedicada.

O botão **Nova transação** abre o `TransactionDialog` em modo criação. O formulário valida descrição, data, valor, tipo e categoria (opcional) com Zod e envia `createTransaction` ou `updateTransaction` via Apollo — incluindo a data da movimentação — com feedback por toast e atualização da lista após sucesso. A `TransactionList` ordena e exibe essa data no dashboard e na página de transações.

O botão **Nova categoria** abre o `CategoryDialog` em modo criação; na página de categorias, cada item expõe **Editar** antes de **Excluir**. O formulário valida título, ícone e cor (obrigatórios) e descrição (opcional) com Zod e envia `createCategory` ou `updateCategory` via Apollo, com feedback por toast e atualização da lista após sucesso. A `CategoryList` exibe ícone, cor e descrição nas páginas dedicadas; no dashboard, mantém o layout compacto com totais por categoria, sem ações inline.

As etiquetas de categoria nas transações usam a cor vinculada à categoria (`category-styles.ts`), não a posição da linha na lista.

Cada transação e categoria na lista expõe **Excluir**, que abre o `DeleteConfirmDialog` antes de remover o item — nas páginas dedicadas de transações e categorias. As mutations `deleteTransaction` e `deleteCategory` são chamadas via Apollo, com toast de sucesso ou erro e atualização das listas após exclusão bem-sucedida.

Na página de transações, **Editar** e **Excluir** aparecem como botões de ícone (32×32), com editar antes de excluir.

Mutations em `src/lib/graphql/mutations/Transaction.ts` e `Category.ts`. Tipos de input em `src/types/index.ts`.

Testes em `tests/dashboard-data.test.tsx` cobrem skip sem sessão, carregamento mockado por usuário, refetch e empty states. Testes em `tests/transaction-dialog.test.tsx` e `tests/category-dialog.test.tsx` cobrem modos create/edit, validação (incluindo ícone e cor), payload das mutations e callback após sucesso.

### Páginas dedicadas e perfil

As rotas `/transactions` e `/categories` reutilizam `TransactionList`, `CategoryList`, os dialogs e `useDashboardData` para CRUD completo fora do dashboard. A página de transações inclui filtros por busca, tipo, categoria e período, com paginação local (10 itens por página). Em telas menores que 1024px, a lista de transações usa layout compacto em cards; em telas largas, mantém a tabela com todas as colunas.

A rota `/profile` exibe nome, e-mail e iniciais da sessão. O nome completo é editável; o botão **Salvar alterações** chama a mutation `updateUser` e atualiza a sessão local. O e-mail permanece somente leitura. O botão **Sair da conta** chama a mutation `logout` no servidor, limpa a sessão local e redireciona para o login, com destaque visual em vermelho.

Os modais `TransactionDialog` e `CategoryDialog` compartilham o cabeçalho visual `FormDialogHeader` (título, subtítulo e botão fechar).

As listas compactas do dashboard foram ajustadas para mobile, evitando sobreposição de colunas em cards estreitos.

Testes em `tests/transactions-page.test.tsx`, `tests/categories-page.test.tsx`, `tests/transaction-filters.test.tsx`, `tests/category-styles.test.tsx`, `tests/compute-transaction-summary.test.ts` e `tests/profile-page.test.tsx` cobrem CRUD nas páginas dedicadas, filtros de transações, estilos de categoria, edição de nome no perfil e logout.

### App e testes do scaffold

Testes em `tests/scaffold.test.ts` cobrem o alias `@/` e o merge de classes do `cn()`.

---

## Rodando localmente

Precisa de Node **20.19+** ou **22.12+** e npm.

```bash
cd frontend
cp .env.example .env   # opcional — o fallback já aponta para localhost:4000
npm install
npm run dev
```

App em `http://localhost:5173/`. Com o backend na porta 4000, o frontend já usa a URL GraphQL configurada em `VITE_BACKEND_URL`.

Outros comandos úteis: `npm run check` (validação completa), `npm run test`, `npm run build`.

---

*Este readme descreve o estado atual do frontend e será atualizado conforme novas partes forem entregues.*

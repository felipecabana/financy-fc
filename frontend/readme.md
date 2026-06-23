# Financy — Frontend

SPA em **React + TypeScript + Vite** que consome a API GraphQL do backend. O **scaffold**, o **cliente Apollo**, o **sistema visual base**, o **estado de autenticação**, o **roteamento com guards**, as **páginas de login e cadastro**, o **dashboard autenticado** e os **dialogs de criação/edição de transações e categorias** já estão configurados. Demais páginas do app ainda não foram implementadas.

---

## Sobre o projeto

O frontend é um app standalone em `frontend/`, separado do backend. A comunicação com o servidor é feita via GraphQL (Apollo Client), conforme o padrão do repositório. O cliente está centralizado e conectado ao app; o fluxo de autenticação, a visualização de dados do dashboard e a criação/edição de transações e categorias pelos modais já estão implementados.

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
│   │   ├── graphql/
│   │   │   ├── apollo.ts         # Apollo Client centralizado + authLink
│   │   │   ├── mutations/
│   │   │   │   ├── Auth.ts       # login e signup
│   │   │   │   ├── Category.ts   # createCategory e updateCategory
│   │   │   │   └── Transaction.ts # createTransaction e updateTransaction
│   │   │   └── queries/
│   │   │       ├── Category.ts   # listCategories
│   │   │       └── Transaction.ts # listTransactions
│   │   └── utils.ts              # utilitários globais (cn)
│   ├── pages/
│   │   ├── Auth/
│   │   │   ├── Login.tsx         # formulário de login em /
│   │   │   ├── Signup.tsx        # formulário de cadastro em /signup
│   │   │   ├── login-schema.ts   # validação Zod
│   │   │   └── signup-schema.ts
│   │   ├── Dashboard/
│   │   │   ├── components/       # listas, cards, seções, TransactionDialog e CategoryDialog
│   │   │   ├── category-schema.ts  # validação Zod do formulário de categoria
│   │   │   ├── transaction-schema.ts # validação Zod do formulário de transação
│   │   │   ├── useDashboardData.ts
│   │   │   └── index.tsx         # exibido em / quando logado
│   │   └── Root/
│   │       └── index.tsx         # alterna Login e Dashboard conforme sessão
│   ├── stores/
│   │   └── auth.ts               # Zustand + persist
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx                   # Layout global, rotas e ProtectedRoute
│   ├── main.tsx                  # entry point + ApolloProvider + BrowserRouter
│   ├── index.css                 # tokens e estilos globais (Tailwind)
│   └── vite-env.d.ts             # tipagem de VITE_BACKEND_URL
├── tests/                        # scaffold, Apollo, auth, dashboard, dialogs
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

Variável `VITE_BACKEND_URL` documentada em `.env.example` (fallback local: `http://localhost:4000/graphql`). O Apollo Client vive em `src/lib/graphql/apollo.ts` — `HttpLink`, `authLink` e cache únicos para todo o app. O token de autenticação é lido via `useAuthStore.getState().token` no `authLink` de `src/lib/graphql/apollo.ts`. O `main.tsx` envolve o app com `ApolloProvider`.

Testes em `tests/apollo.test.ts` cobrem a URL do backend e o transporte HTTP do link GraphQL.

### Sistema visual e componentes

Tailwind CSS v4 com tokens de marca, escala de cinzas e cores de feedback em `src/index.css`. shadcn/ui inicializado com primitivos em `src/components/ui/` (button, input, label, dialog, card). Utilitário `cn()` em `src/lib/utils.ts` com `clsx` e `tailwind-merge`. Fonte Inter carregada via Google Fonts.

Shell de layout em `Layout`, `Page` e `Header`, com notificações via `Toaster` (sonner). Ícones com `lucide-react`.

### Autenticação e roteamento

Store `useAuthStore` em `src/stores/auth.ts` (Zustand + persist) guarda `token`, `user` e `isAuthenticated`, com reidratação do `localStorage` e `logout` que limpa o cache do Apollo. O `authLink` lê o token via `useAuthStore.getState().token`.

A rota `/` renderiza `Login` ou `Dashboard` conforme a sessão (`RootPage`), sem redirect. `ProtectedRoute` redireciona rotas autenticadas para `/` quando não há sessão; `GuestRoute` impede acesso a `/signup` quando já logado. A página de cadastro fica em `/signup`, com links entre login e signup.

Formulários de login e cadastro com validação Zod, mutations GraphQL (`login` e `signup`) e criação de sessão via `setSession` após sucesso. O cadastro envia o nome completo para a API e guarda o campo `name` do usuário na sessão. Erros de credenciais, e-mail duplicado e falha de conexão são exibidos no formulário.

Testes em `tests/auth-store.test.ts`, `tests/auth-navigation.test.tsx` e `tests/auth-forms.test.tsx` cobrem persistência, guards, navegação entre páginas e fluxo dos formulários.

### Dashboard autenticado

Tipos `Category` e `Transaction` em `src/types/index.ts`. Queries `LIST_CATEGORIES` e `LIST_TRANSACTIONS` em `src/lib/graphql/queries/`. O hook `useDashboardData` busca os dados via Apollo apenas com sessão ativa (`skip` quando deslogado) e expõe `refetch` para atualização das listas.

A página `Dashboard` exibe cards de resumo, transações recentes e categorias do usuário logado, com estados de loading, erro e listas vazias. Componentes em `pages/Dashboard/components/` (`SummaryCards`, `TransactionsSection`, `TransactionList`, `CategoriesSection`, `CategoryList`, `TransactionDialog`, `CategoryDialog`).

O botão **Nova transação** abre o `TransactionDialog` em modo criação. O formulário valida descrição, data, valor, tipo e categoria (opcional) com Zod e envia `createTransaction` ou `updateTransaction` via Apollo, com feedback por toast e atualização da lista após sucesso.

O botão **Nova categoria** abre o `CategoryDialog` em modo criação; cada item da lista de categorias expõe **Editar** para abrir o mesmo modal em modo edição. O formulário valida o título com Zod e envia `createCategory` ou `updateCategory` via Apollo, com feedback por toast e atualização da lista após sucesso.

Mutations em `src/lib/graphql/mutations/Transaction.ts` e `Category.ts`. Tipos de input em `src/types/index.ts`.

Testes em `tests/dashboard-data.test.tsx` cobrem skip sem sessão, carregamento mockado por usuário, refetch e empty states. Testes em `tests/transaction-dialog.test.tsx` e `tests/category-dialog.test.tsx` cobrem modos create/edit, validação e callback após mutation bem-sucedida.

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

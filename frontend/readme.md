# Financy — Frontend

SPA em **React + TypeScript + Vite** que consome a API GraphQL do backend. O **scaffold**, o **cliente Apollo** e o **sistema visual base** já estão configurados. Ainda não há rotas, telas de autenticação nem operações GraphQL de domínio.

---

## Sobre o projeto

O frontend é um app standalone em `frontend/`, separado do backend. A comunicação com o servidor é feita via GraphQL (Apollo Client), conforme o padrão do repositório. O cliente está centralizado e conectado ao app; operações de domínio e telas virão depois.

**O que está rodando hoje:** Node 20.19+ ou 22.12+, TypeScript strict, React 19, Vite 8, Tailwind CSS, shadcn/ui, Apollo Client, sonner, lucide-react, Vitest e ESLint.

---

## Estrutura atual

```
frontend/
├── src/
│   ├── assets/                   # SVGs, logos estáticos
│   ├── components/               # componentes reutilizáveis globais
│   │   ├── Header.tsx
│   │   ├── Layout.tsx
│   │   ├── Page.tsx
│   │   ├── StyleGuidePreview.tsx # preview dos primitivos visuais
│   │   └── ui/                   # shadcn/ui (button, input, label, dialog, card)
│   ├── lib/
│   │   ├── auth-token.ts         # getter de token (stub até auth)
│   │   ├── graphql/
│   │   │   ├── apollo.ts         # Apollo Client centralizado
│   │   │   ├── mutations/        # operações GraphQL por domínio
│   │   │   └── queries/
│   │   └── utils.ts              # utilitários globais (cn)
│   ├── pages/                    # rotas — Auth, Dashboard, Transactions, Categories, Profile
│   ├── stores/                   # Zustand (ainda vazio)
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx                   # layout + preview do style guide
│   ├── main.tsx                  # entry point + ApolloProvider
│   ├── index.css                 # tokens e estilos globais (Tailwind)
│   └── vite-env.d.ts             # tipagem de VITE_BACKEND_URL
├── tests/                        # testes do scaffold e do cliente GraphQL
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

Variável `VITE_BACKEND_URL` documentada em `.env.example` (fallback local: `http://localhost:4000/graphql`). O Apollo Client vive em `src/lib/graphql/apollo.ts` — `HttpLink`, `authLink` e cache únicos para todo o app. O token de autenticação passa por `getAuthToken()` em `src/lib/auth-token.ts` (por enquanto retorna `null`; o store de auth virá depois). O `main.tsx` envolve o app com `ApolloProvider`.

Testes em `tests/apollo.test.ts` cobrem a URL do backend e o transporte HTTP do link GraphQL.

### Sistema visual e componentes

Tailwind CSS v4 com tokens de marca, escala de cinzas e cores de feedback em `src/index.css`. shadcn/ui inicializado com primitivos em `src/components/ui/` (button, input, label, dialog, card). Utilitário `cn()` em `src/lib/utils.ts` com `clsx` e `tailwind-merge`. Fonte Inter carregada via Google Fonts.

Shell de layout em `Layout`, `Page` e `Header`, com notificações via `Toaster` (sonner). Ícones com `lucide-react`. O `App.tsx` exibe um preview dos componentes para validação visual; rotas e páginas de domínio virão depois.

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

# Financy — Frontend

SPA em **React + TypeScript + Vite** que consome a API GraphQL do backend. O **scaffold** e o **cliente Apollo** já estão configurados. Ainda não há rotas, telas de autenticação nem operações GraphQL de domínio.

---

## Sobre o projeto

O frontend é um app standalone em `frontend/`, separado do backend. A comunicação com o servidor é feita via GraphQL (Apollo Client), conforme o padrão do repositório. O cliente está centralizado e conectado ao app; operações de domínio e telas virão depois.

**O que está rodando hoje:** Node 20.19+ ou 22.12+, TypeScript strict, React 19, Vite 8, Apollo Client, Vitest e ESLint.

---

## Estrutura atual

```
frontend/
├── src/
│   ├── assets/                   # SVGs, logos estáticos
│   ├── components/               # componentes reutilizáveis globais
│   │   └── ui/                   # shadcn/ui (ainda vazio)
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
│   ├── App.tsx                   # placeholder
│   ├── main.tsx                  # entry point + ApolloProvider
│   ├── index.css                 # CSS global
│   └── vite-env.d.ts             # tipagem de VITE_BACKEND_URL
├── tests/                        # testes do scaffold e do cliente GraphQL
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

### App placeholder

O `src/App.tsx` renderiza uma tela mínima (“Financy — frontend em construção”) só para validar o pipeline. Não há roteamento, estado global nem queries/mutations de domínio ainda.

Testes em `tests/scaffold.test.ts` cobrem o alias `@/`.

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

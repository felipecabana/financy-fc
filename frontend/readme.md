# Financy — Frontend

SPA em **React + TypeScript + Vite** que consome a API GraphQL do backend. Por enquanto existe só o **scaffold**: estrutura de pastas, tooling e uma tela placeholder. Ainda não há cliente GraphQL, rotas, telas de autenticação nem integração com a API.

---

## Sobre o projeto

O frontend é um app standalone em `frontend/`, separado do backend. A comunicação com o servidor será feita exclusivamente via GraphQL (Apollo Client), conforme o padrão do repositório. Hoje o app sobe localmente, compila e passa checagem de tipos, lint e testes — sem chamadas ao backend.

**O que está rodando hoje:** Node 20.19+ ou 22.12+, TypeScript strict, React 19, Vite 8, Vitest e ESLint.

---

## Estrutura atual

```
frontend/
├── src/
│   ├── assets/                   # SVGs, logos estáticos
│   ├── components/               # componentes reutilizáveis globais
│   │   └── ui/                   # shadcn/ui (ainda vazio)
│   ├── lib/
│   │   ├── graphql/
│   │   │   ├── mutations/        # operações GraphQL por domínio
│   │   │   └── queries/
│   │   └── utils.ts              # utilitários globais (cn)
│   ├── pages/                    # rotas — Auth, Dashboard, Transactions, Categories, Profile
│   ├── stores/                   # Zustand (ainda vazio)
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx                   # placeholder
│   ├── main.tsx                  # entry point
│   └── index.css                 # CSS global
├── tests/                        # testes do scaffold
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

### App placeholder

O `src/App.tsx` renderiza uma tela mínima (“Financy — frontend em construção”) só para validar o pipeline. Não há roteamento, estado global nem chamadas GraphQL ainda.

Testes em `tests/` cobrem o scaffold e a resolução do alias `@/`.

---

## Rodando localmente

Precisa de Node **20.19+** ou **22.12+** e npm.

```bash
cd frontend
npm install
npm run dev
```

App em `http://localhost:5173/`.

Outros comandos úteis: `npm run check` (validação completa), `npm run test`, `npm run build`.

Para usar com o backend, suba a API em paralelo (porta 4000) — a configuração de `VITE_BACKEND_URL` e o cliente Apollo serão adicionados em seguida.

---

*Este readme descreve o estado atual do frontend e será atualizado conforme novas partes forem entregues.*

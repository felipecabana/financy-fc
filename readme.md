# Financy

Projeto de finanças pessoais desenvolvido como entrega da pós-graduação **Tech Developer 360 Full Stack e IA**.

A ideia é simples: cada pessoa controla suas categorias e transações, sem ver dados de outro usuário. O repositório está dividido em **`backend/`** (API GraphQL) e **`frontend/`** (SPA React). A autenticação usa cookie HttpOnly de sessão — o JWT não fica no `localStorage` nem vai no header `Authorization` a partir do frontend.

---

## Sobre o projeto

**Backend** — GraphQL schema-first com Prisma/SQLite: signup (com nome completo e categorias padrão), login, cookie HttpOnly de sessão, CRUD de categorias (com descrição, ícone e cor) e transações (com data da movimentação) escopado por usuário, erros normalizados com códigos estáveis (`UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`).

**Frontend** — React + TypeScript + Vite, consumindo o backend via GraphQL com `credentials: 'include'`. Login, cadastro, dashboard, transações, categorias e perfil integrados; sessão restaurada pela query `me` ao recarregar a página. Cards de resumo no dashboard, filtros e paginação na página de transações, etiquetas de categoria com cor correta e telas de visitante sem navbar.

---

## Estrutura do repositório

```
Financy-fc/
├── backend/     # API GraphQL — detalhes em backend/readme.md
└── frontend/    # SPA React — detalhes em frontend/readme.md
```

---

## Documentação por módulo

- **[backend/readme.md](backend/readme.md)** — env, Prisma, schema GraphQL, auth, CRUD, seed, exemplos curl
- **[frontend/readme.md](frontend/readme.md)** — scaffold, scripts, estrutura `src/`, rodar o dev server

---

## Rodando localmente

Precisa de Node e npm. O backend pede **20+**; o frontend pede **20.19+** ou **22.12+** (Vite 8).

**API** (porta 4000):

```bash
cd backend
npm install
cp .env.example .env
# edite .env e defina JWT_SECRET
npm run db:migrate
npm run db:generate
npm run db:seed    # opcional
npm run dev
```

**Frontend** (porta 5173):

```bash
cd frontend
npm install
npm run dev
```

GraphQL em `http://localhost:4000/graphql`. App em `http://localhost:5173/`.

Para setup detalhado, variáveis de ambiente e exemplos de requisição, consulte os readmes de cada pasta.

---

*Este readme descreve o estado atual do repositório e será atualizado conforme novas partes forem entregues.*

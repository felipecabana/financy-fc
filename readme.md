# Financy

Projeto de finanças pessoais desenvolvido como entrega da pós-graduação **Tech Developer 360 Full Stack e IA**.

A ideia é simples: cada pessoa controla suas categorias e transações, sem ver dados de outro usuário. O repositório está dividido em **`backend/`** (API GraphQL) e **`frontend/`** (SPA React). A API já expõe autenticação e CRUD completo; o frontend tem scaffold e tela placeholder — a integração com a API ainda será feita.

---

## Sobre o projeto

**Backend** — GraphQL schema-first com Prisma/SQLite: signup, login, JWT, CRUD de categorias e transações escopado por usuário, erros normalizados com códigos estáveis (`UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`).

**Frontend** — React + TypeScript + Vite, consumindo o backend só via GraphQL. Por enquanto: estrutura de pastas, tooling e app placeholder.

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

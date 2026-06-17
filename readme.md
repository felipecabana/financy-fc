# Financy

Projeto de finanças pessoais desenvolvido como entrega da pós-graduação **Full Stack 360 com IA**.

A ideia é simples: cada pessoa controla suas categorias e transações, sem ver dados de outro usuário. Por enquanto só o **backend** existe neste repositório — uma API GraphQL em Node.js + TypeScript. O frontend React ainda não foi iniciado.

---

## Sobre o projeto

O backend usa GraphQL no estilo schema-first (contrato em `.gql`, resolvers em TypeScript, serviços por cima do Prisma). Hoje o servidor já sobe, valida variáveis de ambiente e tem o banco modelado; as operações de negócio (login, CRUD etc.) ainda não estão expostas na API.

**O que está rodando hoje:** Node 20+, TypeScript, Express, Apollo Server, Prisma com SQLite, Zod para env, bcryptjs, jsonwebtoken, Vitest e ESLint.

---

## Estrutura atual

```
Financy-fc/
└── backend/
    ├── prisma/
    │   ├── schema.prisma
    │   ├── prisma.ts
    │   └── migrations/
    ├── src/
    │   ├── index.ts              # Express + Apollo
    │   ├── config/env/           # validação do .env
    │   ├── graphql/
    │   │   ├── index.ts          # query _health (placeholder)
    │   │   └── modules/          # auth, users, categories, transactions
    │   ├── services/
    │   ├── helpers/
    │   │   ├── password.ts       # hash e verificação de senha
    │   │   └── jwt.ts            # criação e validação de token
    │   └── errors/
    ├── tests/
    └── .env.example
```

As pastas `modules/`, `services/` e `errors/` ainda estão vazias — sem resolvers, services ou erros customizados por enquanto.

---

## Implementado até aqui

### Tooling do backend

Workspace em `backend/` com TypeScript strict, módulos ESM e build em `dist/`. Tem scripts para desenvolvimento (`dev`, `start`), checagem de tipos, lint, testes e um `check` que roda tudo junto.

### Variáveis de ambiente

Copie `.env.example` para `.env` e preencha pelo menos o `JWT_SECRET`:

```
JWT_SECRET=          # obrigatório — gere um valor local
DATABASE_URL="file:./dev.db"
FRONTEND_URL=http://localhost:5173
PORT=4000
```

O arquivo `src/config/env/index.ts` lê o `.env`, valida com Zod e **não deixa o servidor subir** se faltar algo. Os erros aparecem no console antes de bindar a porta.

### Servidor GraphQL

O `src/index.ts` monta Express + CORS (origem do `FRONTEND_URL`) + Apollo em `/graphql`.

Por enquanto o schema só tem uma query de saúde:

```graphql
type Query {
  _health: String!
}
```

Responde `"ok"`. Serve pra confirmar que a API está de pé — dá pra testar com `{ _health }` ou `{ __typename }`.

- `npm run dev` — nodemon + tsx, recarrega ao salvar
- `npm run start` — roda o build compilado

### Banco de dados

SQLite via Prisma. Três tabelas na migration inicial:

**User** — `id`, `email` (único), `password`, `createdAt`, `updatedAt`

**Category** — `id`, `name`, `userId`, timestamps. Ligada ao usuário; se o user for apagado, as categorias somem junto (`onDelete: Cascade`).

**Transaction** — `id`, `title`, `amount`, `type`, `userId`, `categoryId` (opcional), timestamps. Também pertence ao usuário com cascade. A categoria é opcional.

O client fica num singleton em `prisma/prisma.ts` pra não abrir conexão nova a cada hot-reload no dev.

Scripts do banco:

- `npm run db:migrate` — cria/aplica migrations
- `npm run db:generate` — gera o Prisma Client
- `npm run db:push` — sincroniza schema sem migration
- `npm run db:studio` — UI do Prisma

O arquivo `dev.db` é criado localmente em `backend/prisma/` e não vai pro git.

### Helpers de autenticação

Utilitários em `src/helpers/` para uso futuro em signup/login — ainda não expostos na API GraphQL.

- **`password.ts`** — `hashPassword` e `verifyPassword` com bcryptjs (10 salt rounds)
- **`jwt.ts`** — `createToken` e `verifyToken` com payload `{ id }`, expiração de 1 dia e secret do `JWT_SECRET`

Testes unitários em `tests/password.test.ts` e `tests/jwt.test.ts`.

---

## Rodando localmente

Precisa de Node 20+ e npm.

```bash
cd backend
npm install
cp .env.example .env
# edite .env e defina JWT_SECRET
npm run db:migrate
npm run db:generate
npm run dev
```

GraphQL em `http://localhost:4000/graphql`.

Teste rápido:

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ _health }"}'
```

Deve voltar `{"data":{"_health":"ok"}}`.

Outros comandos úteis: `npm run check` (validação completa), `npm run test`, `npm run build`.

---

*Este readme descreve o estado atual do repositório e será atualizado conforme novas partes forem entregues.*

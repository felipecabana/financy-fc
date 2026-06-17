# Financy

Projeto de finanças pessoais desenvolvido como entrega da pós-graduação **Tech Developer 360 Full Stack e IA**.

A ideia é simples: cada pessoa controla suas categorias e transações, sem ver dados de outro usuário. Por enquanto só o **backend** existe neste repositório — uma API GraphQL em Node.js + TypeScript. O frontend React ainda não foi iniciado.

---

## Sobre o projeto

O backend usa GraphQL no estilo schema-first (contrato em `.gql`, resolvers em TypeScript, serviços por cima do Prisma). Hoje o servidor sobe, valida variáveis de ambiente, tem o banco modelado e expõe **signup** e **login**. CRUD de categorias/transações e rotas protegidas ainda não estão na API.

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
    │   │   ├── index.ts          # composição manual do schema (bootstrap)
    │   │   └── modules/          # auth e users com schema; demais ainda vazios
    │   ├── services/
    │   │   └── auth.service.ts   # signup e login
    │   ├── helpers/
    │   │   ├── password.ts       # hash e verificação de senha
    │   │   └── jwt.ts            # criação e validação de token
    │   └── errors/
    ├── tests/                    # unitários, GraphQL e smoke HTTP de auth
    └── .env.example
```

Os módulos `categories/` e `transactions/` ainda estão vazios. A pasta `errors/` também — sem erros customizados por enquanto.

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

O schema expõe a query de saúde e as mutations de autenticação:

```graphql
type Query {
  _health: String!
}

type Mutation {
  signup(data: SignupInput!): AuthPayload!
  login(data: LoginInput!): AuthPayload!
}
```

`signup` e `login` retornam `token` + `user` (sem campo `password`). O wiring em `graphql/index.ts` é manual por enquanto — carregamento automático de todos os módulos fica para uma task futura.

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

### Helpers e serviço de autenticação

Utilitários em `src/helpers/` usados pelo `auth.service.ts`:

- **`password.ts`** — `hashPassword` e `verifyPassword` com bcryptjs (10 salt rounds)
- **`jwt.ts`** — `createToken` e `verifyToken` com payload `{ id }`, expiração de 1 dia e secret do `JWT_SECRET`

O `auth.service.ts` valida campos, garante email único, persiste senha hasheada e retorna o usuário público com JWT. Mensagens de erro em português (`Email já cadastrado.`, `Credenciais inválidas.`).

Testes em `tests/` cobrem helpers, service, resolvers, schema GraphQL, mutations in-process e smoke HTTP.

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

Teste rápido de saúde:

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ _health }"}'
```

Deve voltar `{"data":{"_health":"ok"}}`.

Exemplo de signup:

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { signup(data: { email: \"voce@example.com\", password: \"senha123\" }) { token user { id email } } }"}'
```

Outros comandos úteis: `npm run check` (validação completa), `npm run test`, `npm run build`.

---

*Este readme descreve o estado atual do repositório e será atualizado conforme novas partes forem entregues.*
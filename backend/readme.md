# Financy — Backend

API **GraphQL** em Node.js + TypeScript com Prisma e SQLite. Expõe autenticação, CRUD de categorias e transações escopado por usuário. O frontend consome esta API — detalhes da interface ficam em [`../frontend/readme.md`](../frontend/readme.md).

---

## Sobre o projeto

O backend usa GraphQL no estilo schema-first (contrato em `.gql`, resolvers em TypeScript, serviços por cima do Prisma). Hoje o servidor sobe, valida variáveis de ambiente, tem o banco modelado, expõe **signup** e **login**, valida JWT nas rotas protegidas via contexto GraphQL, já oferece **CRUD de categorias e transações** escopado por usuário e **normaliza erros de domínio** na resposta GraphQL com códigos estáveis (`UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`).

**O que está rodando hoje:** Node 20+, TypeScript, Express, Apollo Server, Prisma com SQLite, Zod para env, bcryptjs, jsonwebtoken, `@graphql-tools` (composição do schema), Vitest e ESLint.

---

## Estrutura atual

```
backend/
├── prisma/
│   ├── schema.prisma
│   ├── prisma.ts
│   ├── seed.ts              # dataset de dev
│   └── migrations/
├── src/
│   ├── index.ts              # Express + Apollo
│   ├── config/
│   │   ├── env/              # validação do .env
│   │   ├── context/          # buildContext + validate() do JWT
│   │   └── formatError/      # normalização de erros GraphQL na resposta
│   ├── graphql/
│   │   ├── index.ts          # export do schema composto
│   │   ├── compose.ts        # merge de SDL e resolvers dos módulos
│   │   ├── schema/           # SDL compartilhado (_health)
│   │   └── modules/          # auth, users, categories e transactions com schema/resolvers
│   ├── services/
│   │   ├── auth.service.ts   # signup e login
│   │   ├── category.service.ts
│   │   └── transaction.service.ts
│   ├── helpers/
│   │   ├── password.ts       # hash e verificação de senha
│   │   ├── jwt.ts            # criação e validação de token
│   │   ├── auth-cookie.ts    # cookie HttpOnly de sessão (set/clear)
│   │   └── ownership.ts      # existência e permissão por usuário
│   └── errors/
│       ├── AppGraphQLError.ts
│       ├── UnauthorizedError.ts
│       ├── NoPermissionError.ts
│       └── NotFoundError.ts
├── tests/                    # unitários, integração, GraphQL in-process e smoke HTTP
└── .env.example
```

---

## Implementado até aqui

### Tooling do backend

Workspace em `backend/` com TypeScript strict, módulos ESM e build em `dist/`. O build compila o TypeScript e copia os arquivos `.gql` para `dist/`, permitindo subir a API com `npm run start`. Tem scripts para desenvolvimento (`dev`, `start`), checagem de tipos, lint, testes e um `check` que roda tudo junto.

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

O `src/index.ts` monta Express + CORS (origem do `FRONTEND_URL`, `credentials: true`) + `cookie-parser` + Apollo em `/graphql`, injetando `buildContext` em cada request. O Apollo recebe o objeto `graphql` exportado por `graphql/compose.ts`.

A composição do schema é feita em `graphql/compose.ts`: os arquivos `.gql` de `schema/` e `modules/` são carregados com `loadFilesSync` e unidos com `mergeTypeDefs`; os resolvers dos módulos são combinados com `mergeResolvers`. Novos domínios entram criando pasta em `modules/` com `schema.gql` e `resolvers.ts` — o wiring em `compose.ts` importa os resolvers manualmente.

O schema expõe a query de saúde, a query protegida `me`, as mutations de autenticação e o CRUD de categorias e transações:

```graphql
type Query {
  _health: String!
  me: User!
  listCategories: [Category!]!
  getCategory(id: String!): Category!
  listTransactions: [Transaction!]!
  getTransaction(id: String!): Transaction!
}

type Mutation {
  signup(data: SignupInput!): AuthPayload!
  login(data: LoginInput!): AuthPayload!
  logout: Boolean!
  createCategory(data: CreateCategoryInput!): Category!
  updateCategory(id: String!, data: UpdateCategoryInput!): Category!
  deleteCategory(id: String!): Boolean!
  createTransaction(data: CreateTransactionInput!): Transaction!
  updateTransaction(id: String!, data: UpdateTransactionInput!): Transaction!
  deleteTransaction(id: String!): Boolean!
}
```

`signup` e `login` são públicos, retornam só `user` (sem `password`) e definem um cookie HttpOnly `auth` com o JWT. `logout` limpa esse cookie. `me` e as operações de categoria e transação exigem sessão autenticada via cookie `auth` ou header `Authorization: Bearer <token>`.

- `npm run dev` — nodemon + tsx, recarrega ao salvar
- `npm run start` — roda o build compilado (`dist/`), com os `.gql` já copiados

### Banco de dados

SQLite via Prisma. Três tabelas na migration inicial:

**User** — `id`, `name`, `email` (único), `password`, `createdAt`, `updatedAt`

**Category** — `id`, `name`, `userId`, timestamps. Ligada ao usuário; se o user for apagado, as categorias somem junto (`onDelete: Cascade`).

**Transaction** — `id`, `title`, `amount`, `type`, `userId`, `categoryId` (opcional), timestamps. Também pertence ao usuário com cascade. A categoria é opcional.

O client fica num singleton em `prisma/prisma.ts` pra não abrir conexão nova a cada hot-reload no dev.

Scripts do banco:

- `npm run db:migrate` — cria/aplica migrations
- `npm run db:generate` — gera o Prisma Client
- `npm run db:push` — sincroniza schema sem migration
- `npm run db:studio` — UI do Prisma
- `npm run db:seed` — popula dataset de desenvolvimento (pode rodar mais de uma vez)
- `npm run db:reset` — zera o banco e reaplica migrations (`prisma migrate reset`, sem seed)

O arquivo `dev.db` é criado localmente em `backend/prisma/` e não vai pro git.

### Dataset de desenvolvimento

Para testes manuais e onboarding, use o fluxo abaixo a partir de `backend/`:

```bash
npm run db:reset   # zera o banco e reaplica migrations
npm run db:seed    # popula usuário, categorias e transações de exemplo
```

Credenciais do seed:

- **Email:** `usuario@financy.com`
- **Senha:** `senha123456`

Você pode rodar `npm run db:seed` várias vezes; os dados de exemplo não serão duplicados. O reset apaga todos os dados locais antes de reconstruir o schema — use apenas em desenvolvimento.

### Helpers e serviço de autenticação

Utilitários em `src/helpers/` usados pelo `auth.service.ts`:

- **`password.ts`** — `hashPassword` e `verifyPassword` com bcryptjs (10 salt rounds)
- **`jwt.ts`** — `createToken` e `verifyToken` com payload `{ id }`, expiração de 1 dia e secret do `JWT_SECRET`
- **`auth-cookie.ts`** — `setAuthCookie` e `clearAuthCookie` com opções `httpOnly`, `secure` (produção), `sameSite: 'lax'`, `path: '/'` e `maxAge` alinhado ao JWT

O `auth.service.ts` valida campos (incluindo nome no cadastro), garante email único, persiste senha hasheada e retorna o usuário público com JWT para uso interno. Os resolvers de `signup`/`login` gravam o JWT no cookie e expõem só `user` no GraphQL. Mensagens de erro em português (`Nome, email e senha são obrigatórios.`, `Email já cadastrado.`, `Credenciais inválidas.`).

Testes em `tests/` cobrem helpers, service, resolvers, schema GraphQL, mutations in-process e smoke HTTP.

### Contexto de autenticação

Cada request GraphQL recebe um contexto com `validate()` e `res`, montado em `src/config/context/index.ts`:

- tenta primeiro o header `Authorization: Bearer <token>`
- se não houver Bearer, lê o cookie `auth` (parseado pelo `cookie-parser`)
- valida o JWT com o helper existente
- retorna o `userId` autenticado ou lança `UnauthorizedError` (`Usuário não autenticado.`)

O resolver `me` em `graphql/modules/users/` usa esse fluxo para buscar o usuário atual no Prisma. `signup`, `login` e `logout` continuam acessíveis sem sessão prévia.

### Cookie de sessão e CSRF

O cookie `auth` usa `SameSite=Lax` — opções em `src/helpers/auth-cookie.ts` (`getAuthCookieOptions`). Não rodamos token CSRF em paralelo.

Frontend e API ficam na origem do `FRONTEND_URL`, com CORS fechado e `credentials: true`. Nesse arranjo, `Lax` já impede o caso que nos importava: outro site mandar POST com o cookie da sessão. O JWT não fica legível no JS (`HttpOnly`); em produção o cookie só vai em HTTPS (`secure`).

`Lax` ainda envia cookie em GET top-level vindo de link externo. Mutations passam por POST; o que sobra disso aceitamos por enquanto.

Se um dia frontend e API ficarem em origens separadas sem proxy same-site, aí sim vale repensar — `Strict`, ou CSRF explícito.

### CRUD de categorias

O módulo em `graphql/modules/categories/` delega para `category.service.ts`, que persiste via Prisma e filtra tudo pelo `userId` autenticado. Cada usuário só lista, consulta, cria, edita e remove as próprias categorias.

Validações e erros em português, por exemplo: `Nome é obrigatório.`, `Categoria não encontrada.`, `Sem permissão para realizar esta ação.`

Testes em `tests/` cobrem service, resolvers, schema GraphQL, mutations in-process e smoke HTTP de categorias.

### CRUD de transações

O módulo em `graphql/modules/transactions/` delega para `transaction.service.ts`, com o mesmo critério de isolamento por `userId`. Cada usuário só acessa as próprias transações; a categoria vinculada (`categoryId`) é opcional e precisa pertencer ao mesmo usuário.

Validações e erros em português, por exemplo: `Título é obrigatório.`, `Transação não encontrada.`, `Sem permissão para realizar esta ação.`

Testes em `tests/` cobrem service, resolvers, schema GraphQL, mutations in-process e smoke HTTP de transações.

### Isolamento por usuário

As checagens de existência e permissão de categorias e transações ficam centralizadas em `src/helpers/ownership.ts` e são reutilizadas pelos serviços de domínio. Os resolvers validam o JWT e delegam ao service; as mensagens de erro e o comportamento de bloqueio entre usuários permanecem os mesmos.

### Tratamento de erros GraphQL

Erros de domínio estendem `AppGraphQLError` (base sobre `GraphQLError`) e carregam `extensions.code`:

- **`UnauthorizedError`** — autenticação, credenciais inválidas e validações de campo (`UNAUTHORIZED`)
- **`NoPermissionError`** — recurso de outro usuário ou conflito como email duplicado (`FORBIDDEN`)
- **`NotFoundError`** — recurso inexistente (`NOT_FOUND`)

Os services e `ownership.ts` lançam essas classes em vez de `Error` genérico. O Apollo recebe `formatError` em `src/config/formatError/index.ts`, que preserva mensagem e código dos erros conhecidos e mascara falhas inesperadas como `Erro interno.` com `INTERNAL_SERVER_ERROR`, sem expor stacktrace.

Exemplo de resposta de erro:

```json
{
  "errors": [{
    "message": "Sem permissão para realizar esta ação.",
    "extensions": { "code": "FORBIDDEN" }
  }]
}
```

Testes em `tests/` cobrem as classes de erro, o normalizador, o pipeline completo com `formatError` (`graphql-errors.integration.test.ts`) e um smoke HTTP mínimo que prova o wiring real do servidor.

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
npm run db:seed    # opcional — dataset de dev para login imediato
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

Exemplo de signup (salva cookie `auth` na resposta; use `-c` para guardar cookies em arquivo):

```bash
curl -c cookies.txt -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { signup(data: { name: \"Seu Nome\", email: \"voce@example.com\", password: \"senha123\" }) { user { id name email } } }"}'
```

Exemplo de `me` com cookie de sessão:

```bash
curl -b cookies.txt -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ me { id name email } }"}'
```

Alternativa com Bearer (útil em testes manuais):

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"query":"{ me { id name email } }"}'
```

Exemplo de `createCategory` (cookie ou Bearer):

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"query":"mutation { createCategory(data: { name: \"Alimentação\" }) { id name } }"}'
```

Exemplo de `createTransaction`:

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"query":"mutation { createTransaction(data: { title: \"Salário\", amount: 5000, type: \"receita\" }) { id title amount type } }"}'
```

Outros comandos úteis: `npm run check` (validação completa), `npm run test`, `npm run build`.

---

*Este readme descreve o estado atual do backend e será atualizado conforme novas partes forem entregues.*

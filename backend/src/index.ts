import cors from 'cors'
import express from 'express'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@as-integrations/express4'

import { buildContext, env } from './config/index.js'
import { formatError } from './config/formatError/index.js'
import { graphql } from './graphql/index.js'

async function bootstrap() {
  const app = express()

  app.use(cors({ origin: env.FRONTEND_URL, credentials: true }))
  app.use(express.json())

  const server = new ApolloServer({ ...graphql, formatError })
  await server.start()

  app.use('/graphql', expressMiddleware(server, { context: buildContext }))

  app.listen(env.PORT, () => {
    console.log(`Servidor iniciado na porta ${env.PORT}`)
  })
}

bootstrap().catch(() => {
  process.exit(1)
})

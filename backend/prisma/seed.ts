import 'dotenv/config'

import { hashPassword } from '../src/helpers/password.js'
import { prismaClient } from './prisma.js'

const SEED_USER = {
  name: 'Usuário Financy',
  email: 'usuario@financy.com',
  password: 'senha123456',
}

const SEED_CATEGORIES = ['Alimentação', 'Salário', 'Transporte'] as const

const SEED_TRANSACTIONS = [
  { title: 'Salário mensal', amount: 5000, type: 'receita', categoryName: 'Salário' },
  { title: 'Mercado', amount: 320.5, type: 'despesa', categoryName: 'Alimentação' },
  { title: 'Uber', amount: 45, type: 'despesa', categoryName: 'Transporte' },
] as const

async function findOrCreateCategory(userId: string, name: string) {
  const existing = await prismaClient.category.findFirst({
    where: { name, userId },
  })

  if (existing) return existing

  return prismaClient.category.create({
    data: { name, userId },
  })
}

async function findOrCreateTransaction(
  userId: string,
  categoryId: string,
  transaction: (typeof SEED_TRANSACTIONS)[number],
) {
  const existing = await prismaClient.transaction.findFirst({
    where: {
      title: transaction.title,
      userId,
      type: transaction.type,
    },
  })

  if (existing) return existing

  return prismaClient.transaction.create({
    data: {
      title: transaction.title,
      amount: transaction.amount,
      type: transaction.type,
      userId,
      categoryId,
    },
  })
}

async function main() {
  const user = await prismaClient.user.upsert({
    where: { email: SEED_USER.email },
    update: {},
    create: {
      name: SEED_USER.name,
      email: SEED_USER.email,
      password: await hashPassword(SEED_USER.password),
    },
  })

  const categories = await Promise.all(
    SEED_CATEGORIES.map((name) => findOrCreateCategory(user.id, name)),
  )

  const categoryByName = Object.fromEntries(categories.map((category) => [category.name, category.id]))

  await Promise.all(
    SEED_TRANSACTIONS.map((transaction) =>
      findOrCreateTransaction(user.id, categoryByName[transaction.categoryName]!, transaction),
    ),
  )

  console.log(`Seed concluído: usuário ${user.email} com ${categories.length} categorias e ${SEED_TRANSACTIONS.length} transações.`)
}

main()
  .catch((error) => {
    console.error('Falha ao executar seed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prismaClient.$disconnect()
  })

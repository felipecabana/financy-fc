import 'dotenv/config'

import { DEFAULT_CATEGORIES } from '../src/helpers/default-categories.js'
import { hashPassword } from '../src/helpers/password.js'
import { prismaClient } from './prisma.js'

const SEED_USER = {
  name: 'Usuário Financy',
  email: 'usuario@financy.com',
  password: 'senha123456',
}

const SEED_TRANSACTIONS = [
  { title: 'Salário mensal', amount: 5000, type: 'receita', categoryName: 'Salário' },
  { title: 'Mercado', amount: 320.5, type: 'despesa', categoryName: 'Mercado' },
  { title: 'Uber', amount: 45, type: 'despesa', categoryName: 'Transporte' },
] as const

async function findOrCreateCategory(
  userId: string,
  category: (typeof DEFAULT_CATEGORIES)[number],
) {
  const existing = await prismaClient.category.findFirst({
    where: { name: category.name, userId },
  })

  if (existing) {
    if (!existing.icon || !existing.color || !existing.description) {
      return prismaClient.category.update({
        where: { id: existing.id },
        data: {
          icon: category.icon,
          color: category.color,
          description: category.description,
        },
      })
    }

    return existing
  }

  return prismaClient.category.create({
    data: {
      name: category.name,
      description: category.description,
      icon: category.icon,
      color: category.color,
      userId,
    },
  })
}

async function upsertSeedTransaction(
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

  const data = {
    title: transaction.title,
    amount: transaction.amount,
    type: transaction.type,
    categoryId,
  }

  if (existing) {
    return prismaClient.transaction.update({
      where: { id: existing.id },
      data,
    })
  }

  return prismaClient.transaction.create({
    data: {
      ...data,
      date: new Date(),
      userId,
    },
  })
}

async function repairLegacySeedTransactionCategories() {
  const users = await prismaClient.user.findMany({ select: { id: true } })

  for (const user of users) {
    const categories = await prismaClient.category.findMany({
      where: { userId: user.id },
    })
    const categoryByName = Object.fromEntries(
      categories.map((category) => [category.name, category.id]),
    )

    await Promise.all(
      SEED_TRANSACTIONS.map((transaction) => {
        const categoryId = categoryByName[transaction.categoryName]
        if (!categoryId) return Promise.resolve({ count: 0 })

        return prismaClient.transaction.updateMany({
          where: {
            userId: user.id,
            title: transaction.title,
            type: transaction.type,
            categoryId: { not: categoryId },
          },
          data: { categoryId },
        })
      }),
    )
  }
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
    DEFAULT_CATEGORIES.map((category) => findOrCreateCategory(user.id, category)),
  )

  const categoryByName = Object.fromEntries(categories.map((category) => [category.name, category.id]))

  await Promise.all(
    SEED_TRANSACTIONS.map((transaction) =>
      upsertSeedTransaction(user.id, categoryByName[transaction.categoryName]!, transaction),
    ),
  )

  await repairLegacySeedTransactionCategories()

  console.log(
    `Seed concluído: usuário ${user.email} com ${categories.length} categorias e ${SEED_TRANSACTIONS.length} transações.`,
  )
}

main()
  .catch((error) => {
    console.error('Falha ao executar seed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prismaClient.$disconnect()
  })

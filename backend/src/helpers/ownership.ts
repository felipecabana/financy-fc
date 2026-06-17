import { prismaClient } from '../../prisma/prisma.js'

export async function findOwnedCategory(userId: string, id: string) {
  const category = await prismaClient.category.findUnique({ where: { id } })
  if (!category) {
    throw new Error('Categoria não encontrada.')
  }
  if (category.userId !== userId) {
    throw new Error('Sem permissão para realizar esta ação.')
  }
  return category
}

export async function findOwnedTransaction(userId: string, id: string) {
  const transaction = await prismaClient.transaction.findUnique({ where: { id } })
  if (!transaction) {
    throw new Error('Transação não encontrada.')
  }
  if (transaction.userId !== userId) {
    throw new Error('Sem permissão para realizar esta ação.')
  }
  return transaction
}

export async function assertOwnedCategory(userId: string, categoryId: string) {
  await findOwnedCategory(userId, categoryId)
}

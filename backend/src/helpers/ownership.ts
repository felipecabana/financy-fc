import { prismaClient } from '../../prisma/prisma.js'
import { NoPermissionError } from '../errors/NoPermissionError.js'
import { NotFoundError } from '../errors/NotFoundError.js'

export async function findOwnedCategory(userId: string, id: string) {
  const category = await prismaClient.category.findUnique({ where: { id } })
  if (!category) {
    throw new NotFoundError('Categoria')
  }
  if (category.userId !== userId) {
    throw new NoPermissionError()
  }
  return category
}

export async function findOwnedTransaction(userId: string, id: string) {
  const transaction = await prismaClient.transaction.findUnique({ where: { id } })
  if (!transaction) {
    throw new NotFoundError('Transação')
  }
  if (transaction.userId !== userId) {
    throw new NoPermissionError()
  }
  return transaction
}

export async function assertOwnedCategory(userId: string, categoryId: string) {
  await findOwnedCategory(userId, categoryId)
}

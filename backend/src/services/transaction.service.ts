import { prismaClient } from '../../prisma/prisma.js'
import { assertOwnedCategory, findOwnedTransaction } from '../helpers/ownership.js'

interface CreateTransactionInput {
  title: string
  amount: number
  type: string
  categoryId?: string
}

interface UpdateTransactionInput {
  title?: string
  amount?: number
  type?: string
  categoryId?: string
}

class TransactionService {
  private assertTitle(title: string | undefined) {
    if (!title?.trim()) {
      throw new Error('Título é obrigatório.')
    }
  }

  private assertAmount(amount: number | undefined) {
    if (amount === undefined || amount === null || Number.isNaN(amount)) {
      throw new Error('Valor é obrigatório.')
    }
  }

  private assertType(type: string | undefined) {
    if (!type?.trim()) {
      throw new Error('Tipo é obrigatório.')
    }
  }

  private assertCreateFields(data: CreateTransactionInput) {
    this.assertTitle(data.title)
    this.assertAmount(data.amount)
    this.assertType(data.type)
  }

  async listTransactions(userId: string) {
    return prismaClient.transaction.findMany({ where: { userId } })
  }

  async getTransaction(userId: string, id: string) {
    return findOwnedTransaction(userId, id)
  }

  async createTransaction(userId: string, data: CreateTransactionInput) {
    this.assertCreateFields(data)

    if (data.categoryId) {
      await assertOwnedCategory(userId, data.categoryId)
    }

    return prismaClient.transaction.create({
      data: {
        title: data.title.trim(),
        amount: data.amount,
        type: data.type.trim(),
        categoryId: data.categoryId,
        userId,
      },
    })
  }

  async updateTransaction(userId: string, id: string, data: UpdateTransactionInput) {
    await findOwnedTransaction(userId, id)

    if (data.title !== undefined) {
      this.assertTitle(data.title)
    }
    if (data.amount !== undefined) {
      this.assertAmount(data.amount)
    }
    if (data.type !== undefined) {
      this.assertType(data.type)
    }
    if (data.categoryId) {
      await assertOwnedCategory(userId, data.categoryId)
    }

    return prismaClient.transaction.update({
      where: { id },
      data: {
        title: data.title?.trim(),
        amount: data.amount ?? undefined,
        type: data.type?.trim(),
        categoryId: data.categoryId ?? undefined,
      },
    })
  }

  async deleteTransaction(userId: string, id: string) {
    await findOwnedTransaction(userId, id)
    await prismaClient.transaction.delete({ where: { id } })
    return true
  }
}

export default new TransactionService()

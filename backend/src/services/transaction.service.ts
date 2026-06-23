import { prismaClient } from '../../prisma/prisma.js'
import { UnauthorizedError } from '../errors/UnauthorizedError.js'
import { assertOwnedCategory, findOwnedTransaction } from '../helpers/ownership.js'

interface CreateTransactionInput {
  title: string
  amount: number
  type: string
  date: string
  categoryId?: string
}

interface UpdateTransactionInput {
  title?: string
  amount?: number
  type?: string
  date?: string
  categoryId?: string
}

class TransactionService {
  private assertTitle(title: string | undefined) {
    if (!title?.trim()) {
      throw new UnauthorizedError('Título é obrigatório.')
    }
  }

  private assertAmount(amount: number | undefined) {
    if (amount === undefined || amount === null || Number.isNaN(amount)) {
      throw new UnauthorizedError('Valor é obrigatório.')
    }
  }

  private assertType(type: string | undefined) {
    if (!type?.trim()) {
      throw new UnauthorizedError('Tipo é obrigatório.')
    }
  }

  private parseDate(value: string | undefined) {
    if (!value?.trim()) {
      throw new UnauthorizedError('Data é obrigatória.')
    }

    const trimmed = value.trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      throw new UnauthorizedError('Data inválida.')
    }

    const parsed = new Date(`${trimmed}T00:00:00.000Z`)
    if (Number.isNaN(parsed.getTime())) {
      throw new UnauthorizedError('Data inválida.')
    }

    return parsed
  }

  private assertCreateFields(data: CreateTransactionInput) {
    this.assertTitle(data.title)
    this.assertAmount(data.amount)
    this.assertType(data.type)
    this.parseDate(data.date)
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
        date: this.parseDate(data.date),
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
        date: data.date !== undefined ? this.parseDate(data.date) : undefined,
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

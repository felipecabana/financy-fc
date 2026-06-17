import type { GraphqlContext } from '../../../config/context/index.js'
import categoryService from '../../../services/category.service.js'
import transactionService from '../../../services/transaction.service.js'

export interface CreateTransactionInput {
  title: string
  amount: number
  type: string
  categoryId?: string
}

export interface UpdateTransactionInput {
  title?: string
  amount?: number
  type?: string
  categoryId?: string
}

type TransactionParent = {
  userId: string
  categoryId?: string | null
  createdAt: Date
  updatedAt: Date
}

export default {
  Query: {
    listTransactions: async (_: unknown, __: unknown, context: GraphqlContext) => {
      const userId = context.validate()
      return transactionService.listTransactions(userId)
    },
    getTransaction: async (_: unknown, { id }: { id: string }, context: GraphqlContext) => {
      const userId = context.validate()
      return transactionService.getTransaction(userId, id)
    },
  },
  Mutation: {
    createTransaction: async (
      _: unknown,
      { data }: { data: CreateTransactionInput },
      context: GraphqlContext,
    ) => {
      const userId = context.validate()
      return transactionService.createTransaction(userId, data)
    },
    updateTransaction: async (
      _: unknown,
      { id, data }: { id: string; data: UpdateTransactionInput },
      context: GraphqlContext,
    ) => {
      const userId = context.validate()
      return transactionService.updateTransaction(userId, id, data)
    },
    deleteTransaction: async (_: unknown, { id }: { id: string }, context: GraphqlContext) => {
      const userId = context.validate()
      return transactionService.deleteTransaction(userId, id)
    },
  },
  Transaction: {
    category: async (parent: TransactionParent) => {
      if (!parent.categoryId) return null
      return categoryService.getCategory(parent.userId, parent.categoryId)
    },
    createdAt: (parent: TransactionParent) => parent.createdAt.toISOString(),
    updatedAt: (parent: TransactionParent) => parent.updatedAt.toISOString(),
  },
}

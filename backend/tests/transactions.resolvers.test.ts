import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { GraphqlContext } from '../src/config/context/index.js'
import { NotFoundError } from '../src/errors/NotFoundError.js'
import { UnauthorizedError } from '../src/errors/UnauthorizedError.js'
import transactionsResolvers from '../src/graphql/modules/transactions/resolvers.js'
import categoryService from '../src/services/category.service.js'
import transactionService from '../src/services/transaction.service.js'
import {
  DOMAIN_ERROR_CODES,
  DOMAIN_ERRORS,
  expectDomainError,
} from './helpers/domain-error-assertions.js'

const userId = 'user-123'
const transactionId = 'transaction-456'
const categoryId = 'category-789'

const sampleTransaction = {
  id: transactionId,
  title: 'Salário',
  amount: 5000,
  type: 'receita',
  userId,
  categoryId: null,
  date: new Date('2026-06-15T00:00:00.000Z'),
  createdAt: new Date('2026-01-01T12:00:00.000Z'),
  updatedAt: new Date('2026-01-02T12:00:00.000Z'),
}

const sampleCategory = {
  id: categoryId,
  name: 'Moradia',
  userId,
  createdAt: new Date('2026-01-01T12:00:00.000Z'),
  updatedAt: new Date('2026-01-02T12:00:00.000Z'),
}

describe('transactions resolvers', () => {
  const context: GraphqlContext = {
    validate: vi.fn(() => userId),
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.mocked(context.validate).mockReturnValue(userId)
  })

  it('Query delega ao service com userId do context', async () => {
    const listSpy = vi
      .spyOn(transactionService, 'listTransactions')
      .mockResolvedValue([sampleTransaction])
    const getSpy = vi.spyOn(transactionService, 'getTransaction').mockResolvedValue(sampleTransaction)

    await transactionsResolvers.Query.listTransactions(null, {}, context, {} as never)
    await transactionsResolvers.Query.getTransaction(
      null,
      { id: transactionId },
      context,
      {} as never,
    )

    expect(context.validate).toHaveBeenCalled()
    expect(listSpy).toHaveBeenCalledWith(userId)
    expect(getSpy).toHaveBeenCalledWith(userId, transactionId)
  })

  it('Mutation delega ao service com userId do context', async () => {
    const createSpy = vi
      .spyOn(transactionService, 'createTransaction')
      .mockResolvedValue(sampleTransaction)
    const updateSpy = vi
      .spyOn(transactionService, 'updateTransaction')
      .mockResolvedValue(sampleTransaction)
    const deleteSpy = vi.spyOn(transactionService, 'deleteTransaction').mockResolvedValue(true)

    await transactionsResolvers.Mutation.createTransaction(
      null,
      { data: { title: 'Mercado', amount: 100, type: 'despesa', date: '2026-06-15' } },
      context,
      {} as never,
    )
    await transactionsResolvers.Mutation.updateTransaction(
      null,
      { id: transactionId, data: { title: 'Feira' } },
      context,
      {} as never,
    )
    await transactionsResolvers.Mutation.deleteTransaction(
      null,
      { id: transactionId },
      context,
      {} as never,
    )

    expect(createSpy).toHaveBeenCalledWith(userId, {
      title: 'Mercado',
      amount: 100,
      type: 'despesa',
      date: '2026-06-15',
    })
    expect(updateSpy).toHaveBeenCalledWith(userId, transactionId, { title: 'Feira' })
    expect(deleteSpy).toHaveBeenCalledWith(userId, transactionId)
  })

  it('propaga erro do service e não chama service sem auth', async () => {
    vi.spyOn(transactionService, 'getTransaction').mockRejectedValue(
      new NotFoundError('Transação'),
    )

    await expectDomainError(
      transactionsResolvers.Query.getTransaction(
        null,
        { id: transactionId },
        context,
        {} as never,
      ),
      DOMAIN_ERRORS.transactionNotFound,
      DOMAIN_ERROR_CODES.NOT_FOUND,
    )

    const unauthorizedContext: GraphqlContext = {
      validate: () => {
        throw new UnauthorizedError()
      },
    }
    const listSpy = vi.spyOn(transactionService, 'listTransactions')

    await expectDomainError(
      transactionsResolvers.Query.listTransactions(null, {}, unauthorizedContext, {} as never),
      DOMAIN_ERRORS.unauthenticated,
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )
    expect(listSpy).not.toHaveBeenCalled()
  })

  it('Transaction formata datas em ISO e resolve category', async () => {
    expect(transactionsResolvers.Transaction.createdAt(sampleTransaction)).toBe(
      '2026-01-01T12:00:00.000Z',
    )
    expect(transactionsResolvers.Transaction.date(sampleTransaction)).toBe(
      '2026-06-15T00:00:00.000Z',
    )
    expect(transactionsResolvers.Transaction.updatedAt(sampleTransaction)).toBe(
      '2026-01-02T12:00:00.000Z',
    )

    await expect(
      transactionsResolvers.Transaction.category(sampleTransaction),
    ).resolves.toBeNull()

    const getCategorySpy = vi
      .spyOn(categoryService, 'getCategory')
      .mockResolvedValue(sampleCategory)

    await expect(
      transactionsResolvers.Transaction.category({ ...sampleTransaction, categoryId }),
    ).resolves.toEqual(sampleCategory)
    expect(getCategorySpy).toHaveBeenCalledWith(userId, categoryId)
  })
})

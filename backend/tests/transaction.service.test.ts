import { afterEach, describe, expect, it } from 'vitest'

import authService from '../src/services/auth.service.js'
import categoryService from '../src/services/category.service.js'
import transactionService from '../src/services/transaction.service.js'
import {
  createEmailCleanup,
  signupData,
  TEST_PASSWORD,
  uniqueEmail,
} from './helpers/auth-test-utils.js'
import {
  DOMAIN_ERROR_CODES,
  DOMAIN_ERRORS,
  expectDomainError,
} from './helpers/domain-error-assertions.js'
import { categoryInput } from './helpers/category-test-utils.js'

const transactionDate = '2026-06-15'

describe('transaction service', () => {
  const cleanup = createEmailCleanup()

  afterEach(async () => {
    await cleanup.reset()
  })

  async function createUser(prefix: string) {
    const email = uniqueEmail(prefix)
    cleanup.track(email)
    const { user } = await authService.signup(signupData(email))
    return user.id
  }

  it('lista só transações do usuário', async () => {
    const userA = await createUser('txn-a')
    const userB = await createUser('txn-b')

    await transactionService.createTransaction(userA, {
      title: 'Salário',
      amount: 5000,
      type: 'receita',
      date: transactionDate,
    })
    await transactionService.createTransaction(userB, {
      title: 'Aluguel',
      amount: 1200,
      type: 'despesa',
      date: transactionDate,
    })

    const transactions = await transactionService.listTransactions(userA)
    expect(transactions.map((t) => t.title)).toEqual(['Salário'])
  })

  it('getTransaction retorna a própria e rejeita inexistente ou de outro usuário', async () => {
    const owner = await createUser('txn-owner')
    const other = await createUser('txn-other')

    const transaction = await transactionService.createTransaction(owner, {
      title: 'Mercado',
      amount: 150,
      type: 'despesa',
      date: transactionDate,
    })
    const found = await transactionService.getTransaction(owner, transaction.id)

    expect(found.title).toBe('Mercado')

    await expectDomainError(
      transactionService.getTransaction(other, transaction.id),
      DOMAIN_ERRORS.noPermission,
      DOMAIN_ERROR_CODES.FORBIDDEN,
    )
    await expectDomainError(
      transactionService.getTransaction(owner, '00000000-0000-0000-0000-000000000000'),
      DOMAIN_ERRORS.transactionNotFound,
      DOMAIN_ERROR_CODES.NOT_FOUND,
    )
  })

  it('createTransaction valida campos obrigatórios e faz trim', async () => {
    const userId = await createUser('txn-create')

    const transaction = await transactionService.createTransaction(userId, {
      title: '  Internet  ',
      amount: 99.9,
      type: '  despesa  ',
      date: transactionDate,
    })
    expect(transaction.title).toBe('Internet')
    expect(transaction.type).toBe('despesa')
    expect(transaction.date.toISOString()).toBe('2026-06-15T00:00:00.000Z')

    await expectDomainError(
      transactionService.createTransaction(userId, { title: '', amount: 10, type: 'despesa', date: transactionDate }),
      DOMAIN_ERRORS.titleRequired,
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )
    await expectDomainError(
      transactionService.createTransaction(userId, { title: 'X', amount: Number.NaN, type: 'despesa', date: transactionDate }),
      DOMAIN_ERRORS.amountRequired,
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )
    await expectDomainError(
      transactionService.createTransaction(userId, { title: 'X', amount: 10, type: '   ', date: transactionDate }),
      DOMAIN_ERRORS.typeRequired,
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )
    await expectDomainError(
      transactionService.createTransaction(userId, { title: 'X', amount: 10, type: 'despesa', date: '' }),
      DOMAIN_ERRORS.dateRequired,
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )
    await expectDomainError(
      transactionService.createTransaction(userId, { title: 'X', amount: 10, type: 'despesa', date: '15/06/2026' }),
      DOMAIN_ERRORS.dateInvalid,
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )
  })

  it('createTransaction aceita categoria própria e rejeita categoria alheia ou inexistente', async () => {
    const owner = await createUser('txn-cat-owner')
    const other = await createUser('txn-cat-other')

    const category = await categoryService.createCategory(owner, categoryInput({ name: 'Moradia' }))
    const otherCategory = await categoryService.createCategory(other, categoryInput({ name: 'Lazer' }))

    const withCategory = await transactionService.createTransaction(owner, {
      title: 'Aluguel',
      amount: 1200,
      type: 'despesa',
      date: transactionDate,
      categoryId: category.id,
    })
    expect(withCategory.categoryId).toBe(category.id)

    await expectDomainError(
      transactionService.createTransaction(owner, {
        title: 'X',
        amount: 1,
        type: 'despesa',
        date: transactionDate,
        categoryId: otherCategory.id,
      }),
      DOMAIN_ERRORS.noPermission,
      DOMAIN_ERROR_CODES.FORBIDDEN,
    )
    await expectDomainError(
      transactionService.createTransaction(owner, {
        title: 'X',
        amount: 1,
        type: 'despesa',
        date: transactionDate,
        categoryId: '00000000-0000-0000-0000-000000000000',
      }),
      DOMAIN_ERRORS.categoryNotFound,
      DOMAIN_ERROR_CODES.NOT_FOUND,
    )
  })

  it('updateTransaction atualiza a própria e rejeita erros', async () => {
    const owner = await createUser('txn-upd-owner')
    const other = await createUser('txn-upd-other')

    const transaction = await transactionService.createTransaction(owner, {
      title: 'Cinema',
      amount: 40,
      type: 'despesa',
      date: transactionDate,
    })
    const updated = await transactionService.updateTransaction(owner, transaction.id, {
      title: 'Streaming',
      amount: 55,
      date: '2026-07-01',
    })

    expect(updated.title).toBe('Streaming')
    expect(updated.amount).toBe(55)
    expect(updated.date.toISOString()).toBe('2026-07-01T00:00:00.000Z')

    await expectDomainError(
      transactionService.updateTransaction(other, transaction.id, { title: 'X' }),
      DOMAIN_ERRORS.noPermission,
      DOMAIN_ERROR_CODES.FORBIDDEN,
    )
    await expectDomainError(
      transactionService.updateTransaction(owner, transaction.id, { title: '   ' }),
      DOMAIN_ERRORS.titleRequired,
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )
  })

  it('deleteTransaction remove a própria e rejeita erros', async () => {
    const owner = await createUser('txn-del-owner')
    const other = await createUser('txn-del-other')

    const transaction = await transactionService.createTransaction(owner, {
      title: 'Farmácia',
      amount: 30,
      type: 'despesa',
      date: transactionDate,
    })

    await expectDomainError(
      transactionService.deleteTransaction(other, transaction.id),
      DOMAIN_ERRORS.noPermission,
      DOMAIN_ERROR_CODES.FORBIDDEN,
    )

    expect(await transactionService.deleteTransaction(owner, transaction.id)).toBe(true)
    await expectDomainError(
      transactionService.getTransaction(owner, transaction.id),
      DOMAIN_ERRORS.transactionNotFound,
      DOMAIN_ERROR_CODES.NOT_FOUND,
    )
  })
})

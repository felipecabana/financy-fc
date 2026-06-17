import { afterEach, describe, expect, it } from 'vitest'

import authService from '../src/services/auth.service.js'
import categoryService from '../src/services/category.service.js'
import transactionService from '../src/services/transaction.service.js'
import {
  createEmailCleanup,
  TEST_PASSWORD,
  uniqueEmail,
} from './helpers/auth-test-utils.js'

describe('transaction service', () => {
  const cleanup = createEmailCleanup()

  afterEach(async () => {
    await cleanup.reset()
  })

  async function createUser(prefix: string) {
    const email = uniqueEmail(prefix)
    cleanup.track(email)
    const { user } = await authService.signup({ email, password: TEST_PASSWORD })
    return user.id
  }

  it('lista só transações do usuário', async () => {
    const userA = await createUser('txn-a')
    const userB = await createUser('txn-b')

    await transactionService.createTransaction(userA, {
      title: 'Salário',
      amount: 5000,
      type: 'receita',
    })
    await transactionService.createTransaction(userB, {
      title: 'Aluguel',
      amount: 1200,
      type: 'despesa',
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
    })
    const found = await transactionService.getTransaction(owner, transaction.id)

    expect(found.title).toBe('Mercado')

    await expect(transactionService.getTransaction(other, transaction.id)).rejects.toThrow(
      'Sem permissão para realizar esta ação.',
    )
    await expect(
      transactionService.getTransaction(owner, '00000000-0000-0000-0000-000000000000'),
    ).rejects.toThrow('Transação não encontrada.')
  })

  it('createTransaction valida campos obrigatórios e faz trim', async () => {
    const userId = await createUser('txn-create')

    const transaction = await transactionService.createTransaction(userId, {
      title: '  Internet  ',
      amount: 99.9,
      type: '  despesa  ',
    })
    expect(transaction.title).toBe('Internet')
    expect(transaction.type).toBe('despesa')

    await expect(
      transactionService.createTransaction(userId, { title: '', amount: 10, type: 'despesa' }),
    ).rejects.toThrow('Título é obrigatório.')
    await expect(
      transactionService.createTransaction(userId, { title: 'X', amount: Number.NaN, type: 'despesa' }),
    ).rejects.toThrow('Valor é obrigatório.')
    await expect(
      transactionService.createTransaction(userId, { title: 'X', amount: 10, type: '   ' }),
    ).rejects.toThrow('Tipo é obrigatório.')
  })

  it('createTransaction aceita categoria própria e rejeita categoria alheia ou inexistente', async () => {
    const owner = await createUser('txn-cat-owner')
    const other = await createUser('txn-cat-other')

    const category = await categoryService.createCategory(owner, { name: 'Moradia' })
    const otherCategory = await categoryService.createCategory(other, { name: 'Lazer' })

    const withCategory = await transactionService.createTransaction(owner, {
      title: 'Aluguel',
      amount: 1200,
      type: 'despesa',
      categoryId: category.id,
    })
    expect(withCategory.categoryId).toBe(category.id)

    await expect(
      transactionService.createTransaction(owner, {
        title: 'X',
        amount: 1,
        type: 'despesa',
        categoryId: otherCategory.id,
      }),
    ).rejects.toThrow('Sem permissão para realizar esta ação.')

    await expect(
      transactionService.createTransaction(owner, {
        title: 'X',
        amount: 1,
        type: 'despesa',
        categoryId: '00000000-0000-0000-0000-000000000000',
      }),
    ).rejects.toThrow('Categoria não encontrada.')
  })

  it('updateTransaction atualiza a própria e rejeita erros', async () => {
    const owner = await createUser('txn-upd-owner')
    const other = await createUser('txn-upd-other')

    const transaction = await transactionService.createTransaction(owner, {
      title: 'Cinema',
      amount: 40,
      type: 'despesa',
    })
    const updated = await transactionService.updateTransaction(owner, transaction.id, {
      title: 'Streaming',
      amount: 55,
    })

    expect(updated.title).toBe('Streaming')
    expect(updated.amount).toBe(55)

    await expect(
      transactionService.updateTransaction(other, transaction.id, { title: 'X' }),
    ).rejects.toThrow('Sem permissão para realizar esta ação.')
    await expect(
      transactionService.updateTransaction(owner, transaction.id, { title: '   ' }),
    ).rejects.toThrow('Título é obrigatório.')
  })

  it('deleteTransaction remove a própria e rejeita erros', async () => {
    const owner = await createUser('txn-del-owner')
    const other = await createUser('txn-del-other')

    const transaction = await transactionService.createTransaction(owner, {
      title: 'Farmácia',
      amount: 30,
      type: 'despesa',
    })

    await expect(transactionService.deleteTransaction(other, transaction.id)).rejects.toThrow(
      'Sem permissão para realizar esta ação.',
    )

    expect(await transactionService.deleteTransaction(owner, transaction.id)).toBe(true)
    await expect(transactionService.getTransaction(owner, transaction.id)).rejects.toThrow(
      'Transação não encontrada.',
    )
  })
})

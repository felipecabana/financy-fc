// @vitest-environment jsdom

import type { ComponentProps } from 'react'
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { TransactionDialog } from '@/pages/Dashboard/components/TransactionDialog'

import {
  mockCategoryA,
  mockTransactionUser1,
  renderWithDashboardApollo,
} from './helpers/dashboard-test-utils'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function mockCreateTransactionFetch() {
  return vi.fn().mockImplementation(async (_uri: string, options?: RequestInit) => {
    const body = JSON.parse(String(options?.body))

    if (body.operationName === 'CreateTransaction') {
      return jsonResponse({
        data: {
          createTransaction: {
            id: 'tx-new',
            title: body.variables.data.title,
            amount: body.variables.data.amount,
            type: body.variables.data.type,
            createdAt: '2026-06-20T00:00:00.000Z',
          },
        },
      })
    }

    return jsonResponse({ data: {} })
  })
}

function renderDialog(
  fetchImpl: typeof fetch,
  props: Partial<ComponentProps<typeof TransactionDialog>> = {},
) {
  const onOpenChange = vi.fn()
  const onSuccess = vi.fn()

  renderWithDashboardApollo(
    <TransactionDialog
      open
      onOpenChange={onOpenChange}
      mode="create"
      categories={[mockCategoryA]}
      onSuccess={onSuccess}
      {...props}
    />,
    fetchImpl,
  )

  return { onOpenChange, onSuccess }
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('TransactionDialog', () => {
  it('modo create inicia com formulario vazio', () => {
    renderDialog(vi.fn())

    expect(screen.getByText('Nova transação')).toBeTruthy()
    expect(screen.getByLabelText('Descrição')).toHaveProperty('value', '')
    expect(screen.getByLabelText('Data')).toHaveProperty('value', '')
    expect(screen.getByLabelText('Valor')).toHaveProperty('value', '')
  })

  it('modo edit preenche os campos da transacao', () => {
    renderDialog(vi.fn(), {
      mode: 'edit',
      transaction: mockTransactionUser1,
    })

    expect(screen.getByText('Editar transação')).toBeTruthy()
    expect(screen.getByLabelText('Descrição')).toHaveProperty('value', 'Mercado User 1')
    expect(screen.getByLabelText('Data')).toHaveProperty('value', '2026-06-15')
    expect(screen.getByLabelText('Valor')).toHaveProperty('value', '120.5')
    expect(screen.getByLabelText('Categoria')).toHaveProperty('value', 'cat-a')
  })

  it('exibe erro de validacao ao salvar sem descricao', () => {
    renderDialog(vi.fn())

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(screen.getByRole('alert').textContent).toBe('Preencha a descrição.')
  })

  it('fecha ao clicar no botao Fechar', () => {
    const { onOpenChange } = renderDialog(vi.fn())

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('chama onSuccess apos criar transacao com sucesso', async () => {
    const fetchMock = mockCreateTransactionFetch()
    const { onOpenChange, onSuccess } = renderDialog(fetchMock)

    fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'Almoço' } })
    fireEvent.change(screen.getByLabelText('Data'), { target: { value: '2026-06-20' } })
    fireEvent.change(screen.getByLabelText('Valor'), { target: { value: '45.90' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce()
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    expect(fetchMock).toHaveBeenCalled()
    const requestBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))
    expect(requestBody.operationName).toBe('CreateTransaction')
    expect(requestBody.variables.data).toMatchObject({
      title: 'Almoço',
      amount: 45.9,
      type: 'despesa',
    })
  })
})

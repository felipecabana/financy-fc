// @vitest-environment jsdom

import type { ComponentProps } from 'react'
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CategoryDialog } from '@/pages/Dashboard/components/CategoryDialog'

import { mockCategoryA, renderWithDashboardApollo } from './helpers/dashboard-test-utils'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function mockCategoryMutationsFetch() {
  return vi.fn().mockImplementation(async (_uri: string, options?: RequestInit) => {
    const body = JSON.parse(String(options?.body))

    if (body.operationName === 'CreateCategory') {
      return jsonResponse({
        data: {
          createCategory: {
            id: 'cat-new',
            name: body.variables.data.name,
            description: body.variables.data.description,
            icon: body.variables.data.icon,
            color: body.variables.data.color,
            createdAt: '2026-06-20T00:00:00.000Z',
          },
        },
      })
    }

    if (body.operationName === 'UpdateCategory') {
      return jsonResponse({
        data: {
          updateCategory: {
            id: body.variables.id,
            name: body.variables.data.name,
            description: body.variables.data.description,
            icon: body.variables.data.icon,
            color: body.variables.data.color,
            updatedAt: '2026-06-20T00:00:00.000Z',
          },
        },
      })
    }

    return jsonResponse({ data: {} })
  })
}

function renderDialog(
  fetchImpl: typeof fetch,
  props: Partial<ComponentProps<typeof CategoryDialog>> = {},
) {
  const onOpenChange = vi.fn()
  const onSuccess = vi.fn()

  renderWithDashboardApollo(
    <CategoryDialog
      open
      onOpenChange={onOpenChange}
      mode="create"
      onSuccess={onSuccess}
      {...props}
    />,
    fetchImpl,
  )

  return { onOpenChange, onSuccess }
}

function fillRequiredCategoryFields() {
  fireEvent.click(screen.getByRole('button', { name: 'utensils' }))
  fireEvent.click(screen.getByRole('button', { name: 'green' }))
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('CategoryDialog', () => {
  it('modo create inicia com formulario vazio', () => {
    renderDialog(vi.fn())

    expect(screen.getByText('Nova categoria')).toBeTruthy()
    expect(screen.getByLabelText('Título')).toHaveProperty('value', '')
    expect(screen.getByLabelText('Descrição')).toHaveProperty('value', '')
  })

  it('modo edit preenche os campos da categoria', () => {
    renderDialog(vi.fn(), {
      mode: 'edit',
      category: mockCategoryA,
    })

    expect(screen.getByText('Editar categoria')).toBeTruthy()
    expect(screen.getByLabelText('Título')).toHaveProperty('value', 'Alimentação')
    expect(screen.getByLabelText('Descrição')).toHaveProperty('value', 'Mercado e refeições')
    expect(screen.getByRole('button', { name: 'utensils', pressed: true })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'green', pressed: true })).toBeTruthy()
  })

  it('exibe erro de validacao ao salvar sem titulo', () => {
    renderDialog(vi.fn())

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(screen.getByRole('alert').textContent).toBe('Preencha o nome.')
  })

  it('exige icone e cor ao salvar', () => {
    renderDialog(vi.fn())

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Lazer' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(screen.getByRole('alert').textContent).toBe('Selecione um ícone.')
  })

  it('chama onSuccess apos criar categoria com sucesso', async () => {
    const fetchMock = mockCategoryMutationsFetch()
    const { onOpenChange, onSuccess } = renderDialog(fetchMock)

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Lazer' } })
    fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'Passeios' } })
    fillRequiredCategoryFields()
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce()
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    const requestBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))
    expect(requestBody.operationName).toBe('CreateCategory')
    expect(requestBody.variables.data).toEqual({
      name: 'Lazer',
      description: 'Passeios',
      icon: 'utensils',
      color: 'green',
    })
  })

  it('chama onSuccess apos atualizar categoria com sucesso', async () => {
    const fetchMock = mockCategoryMutationsFetch()
    const { onOpenChange, onSuccess } = renderDialog(fetchMock, {
      mode: 'edit',
      category: mockCategoryA,
    })

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Mercado' } })
    fireEvent.click(screen.getByRole('button', { name: 'shopping-cart' }))
    fireEvent.click(screen.getByRole('button', { name: 'orange' }))
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce()
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    const requestBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))
    expect(requestBody.operationName).toBe('UpdateCategory')
    expect(requestBody.variables).toEqual({
      id: 'cat-a',
      data: {
        name: 'Mercado',
        description: 'Mercado e refeições',
        icon: 'shopping-cart',
        color: 'orange',
      },
    })
  })
})

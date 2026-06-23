import { gql } from '@apollo/client'

import type { CreateTransactionInput, Transaction, UpdateTransactionInput } from '@/types'

export const CREATE_TRANSACTION = gql`
  mutation CreateTransaction($data: CreateTransactionInput!) {
    createTransaction(data: $data) {
      id
      title
      amount
      type
      date
      createdAt
    }
  }
`

export const UPDATE_TRANSACTION = gql`
  mutation UpdateTransaction($id: String!, $data: UpdateTransactionInput!) {
    updateTransaction(id: $id, data: $data) {
      id
      title
      amount
      type
      date
      updatedAt
    }
  }
`

export const DELETE_TRANSACTION = gql`
  mutation DeleteTransaction($id: String!) {
    deleteTransaction(id: $id)
  }
`

export type CreateTransactionMutationData = {
  createTransaction: Pick<Transaction, 'id' | 'title' | 'amount' | 'type' | 'date' | 'createdAt'>
}

export type UpdateTransactionMutationData = {
  updateTransaction: Pick<Transaction, 'id' | 'title' | 'amount' | 'type' | 'date' | 'updatedAt'>
}

export type CreateTransactionMutationVariables = {
  data: CreateTransactionInput
}

export type UpdateTransactionMutationVariables = {
  id: string
  data: UpdateTransactionInput
}

export type DeleteTransactionMutationData = {
  deleteTransaction: boolean
}

export type DeleteTransactionMutationVariables = {
  id: string
}

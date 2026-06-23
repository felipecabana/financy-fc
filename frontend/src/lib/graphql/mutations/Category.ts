import { gql } from '@apollo/client'

import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@/types'

export const CREATE_CATEGORY = gql`
  mutation CreateCategory($data: CreateCategoryInput!) {
    createCategory(data: $data) {
      id
      name
      createdAt
    }
  }
`

export const UPDATE_CATEGORY = gql`
  mutation UpdateCategory($id: String!, $data: UpdateCategoryInput!) {
    updateCategory(id: $id, data: $data) {
      id
      name
      updatedAt
    }
  }
`

export type CreateCategoryMutationData = {
  createCategory: Pick<Category, 'id' | 'name' | 'createdAt'>
}

export type UpdateCategoryMutationData = {
  updateCategory: Pick<Category, 'id' | 'name' | 'updatedAt'>
}

export type CreateCategoryMutationVariables = {
  data: CreateCategoryInput
}

export type UpdateCategoryMutationVariables = {
  id: string
  data: UpdateCategoryInput
}

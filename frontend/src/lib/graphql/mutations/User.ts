import { gql } from '@apollo/client'

import type { User } from '@/types'

export const UPDATE_USER = gql`
  mutation UpdateUser($data: UpdateUserInput!) {
    updateUser(data: $data) {
      id
      name
      email
      createdAt
      updatedAt
    }
  }
`

export type UpdateUserInput = {
  name: string
}

export type UpdateUserMutationData = {
  updateUser: User
}

export type UpdateUserMutationVariables = {
  data: UpdateUserInput
}

import { gql } from '@apollo/client'

import type { User } from '@/types'

export const ME_QUERY = gql`
  query Me {
    me {
      id
      name
      email
      createdAt
      updatedAt
    }
  }
`

export type MeQueryData = {
  me: User
}

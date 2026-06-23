import { gql } from '@apollo/client'

export const LIST_TRANSACTIONS = gql`
  query ListTransactions {
    listTransactions {
      id
      title
      amount
      type
      userId
      categoryId
      createdAt
      updatedAt
      category {
        id
        name
      }
    }
  }
`

import { gql } from '@apollo/client'

export const LIST_TRANSACTIONS = gql`
  query ListTransactions {
    listTransactions {
      id
      title
      amount
      type
      date
      userId
      categoryId
      createdAt
      updatedAt
      category {
        id
        name
        icon
        color
      }
    }
  }
`

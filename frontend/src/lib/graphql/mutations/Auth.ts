import { gql } from '@apollo/client'

import type { AuthPayload, LoginInput, SignupInput } from '@/types'

export const LOGIN_MUTATION = gql`
  mutation Login($data: LoginInput!) {
    login(data: $data) {
      user {
        id
        name
        email
        createdAt
        updatedAt
      }
    }
  }
`

export const SIGNUP_MUTATION = gql`
  mutation Signup($data: SignupInput!) {
    signup(data: $data) {
      user {
        id
        name
        email
        createdAt
        updatedAt
      }
    }
  }
`

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`

export type LoginMutationData = {
  login: AuthPayload
}

export type SignupMutationData = {
  signup: AuthPayload
}

export type LoginMutationVariables = {
  data: LoginInput
}

export type SignupMutationVariables = {
  data: SignupInput
}

export type LogoutMutationData = {
  logout: boolean
}

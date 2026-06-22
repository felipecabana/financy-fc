import { gql } from '@apollo/client'

import type { AuthPayload, LoginInput, SignupInput } from '@/types'

export const LOGIN_MUTATION = gql`
  mutation Login($data: LoginInput!) {
    login(data: $data) {
      token
      user {
        id
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
      token
      user {
        id
        email
        createdAt
        updatedAt
      }
    }
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

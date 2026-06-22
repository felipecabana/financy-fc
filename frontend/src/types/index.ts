export interface User {
  id: string
  email: string
  createdAt: string
  updatedAt: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface SignupInput {
  email: string
  password: string
}

export interface AuthPayload {
  token: string
  user: User
}

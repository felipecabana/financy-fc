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

export interface Category {
  id: string
  name: string
  userId: string
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: string
  title: string
  amount: number
  type: string
  userId: string
  categoryId?: string | null
  category?: Category | null
  createdAt: string
  updatedAt: string
}

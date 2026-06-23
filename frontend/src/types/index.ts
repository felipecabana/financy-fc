export interface User {
  id: string
  name: string
  email: string
  createdAt: string
  updatedAt: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface SignupInput {
  name: string
  email: string
  password: string
}

export interface AuthPayload {
  user: User
}

export interface Category {
  id: string
  name: string
  description?: string | null
  icon?: string | null
  color?: string | null
  userId: string
  createdAt: string
  updatedAt: string
}

export interface CreateCategoryInput {
  name: string
  icon: string
  color: string
  description?: string | null
}

export interface UpdateCategoryInput {
  name: string
  icon: string
  color: string
  description?: string | null
}

export interface CreateTransactionInput {
  title: string
  amount: number
  type: string
  date: string
  categoryId?: string | null
}

export interface UpdateTransactionInput {
  title?: string
  amount?: number
  type?: string
  date?: string
  categoryId?: string | null
}

export interface Transaction {
  id: string
  title: string
  amount: number
  type: string
  date: string
  userId: string
  categoryId?: string | null
  category?: Category | null
  createdAt: string
  updatedAt: string
}

import { useQuery } from '@apollo/client/react'

import { LIST_CATEGORIES, LIST_TRANSACTIONS } from '@/lib/graphql/queries'
import { useAuthStore } from '@/stores/auth'
import type { Category, Transaction } from '@/types'

export function useDashboardData() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const categoriesQuery = useQuery<{ listCategories: Category[] }>(LIST_CATEGORIES, {
    skip: !isAuthenticated,
  })

  const transactionsQuery = useQuery<{ listTransactions: Transaction[] }>(LIST_TRANSACTIONS, {
    skip: !isAuthenticated,
  })

  return {
    categories: categoriesQuery.data?.listCategories ?? [],
    transactions: transactionsQuery.data?.listTransactions ?? [],
    loading: categoriesQuery.loading || transactionsQuery.loading,
    error: categoriesQuery.error ?? transactionsQuery.error,
    refetchCategories: categoriesQuery.refetch,
    refetchTransactions: transactionsQuery.refetch,
  }
}

import type { GraphqlContext } from '../../../config/context/index.js'
import categoryService from '../../../services/category.service.js'

export interface CreateCategoryInput {
  name: string
}

export interface UpdateCategoryInput {
  name?: string
}

type CategoryParent = {
  createdAt: Date
  updatedAt: Date
}

export default {
  Query: {
    listCategories: async (_: unknown, __: unknown, context: GraphqlContext) => {
      const userId = context.validate()
      return categoryService.listCategories(userId)
    },
    getCategory: async (_: unknown, { id }: { id: string }, context: GraphqlContext) => {
      const userId = context.validate()
      return categoryService.getCategory(userId, id)
    },
  },
  Mutation: {
    createCategory: async (
      _: unknown,
      { data }: { data: CreateCategoryInput },
      context: GraphqlContext,
    ) => {
      const userId = context.validate()
      return categoryService.createCategory(userId, data)
    },
    updateCategory: async (
      _: unknown,
      { id, data }: { id: string; data: UpdateCategoryInput },
      context: GraphqlContext,
    ) => {
      const userId = context.validate()
      return categoryService.updateCategory(userId, id, data)
    },
    deleteCategory: async (_: unknown, { id }: { id: string }, context: GraphqlContext) => {
      const userId = context.validate()
      return categoryService.deleteCategory(userId, id)
    },
  },
  Category: {
    createdAt: (parent: CategoryParent) => parent.createdAt.toISOString(),
    updatedAt: (parent: CategoryParent) => parent.updatedAt.toISOString(),
  },
}

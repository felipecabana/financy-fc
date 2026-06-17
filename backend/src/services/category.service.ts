import { prismaClient } from '../../prisma/prisma.js'
import { findOwnedCategory } from '../helpers/ownership.js'

interface CreateCategoryInput {
  name: string
}

interface UpdateCategoryInput {
  name?: string
}

class CategoryService {
  private assertName(name: string | undefined) {
    if (!name?.trim()) {
      throw new Error('Nome é obrigatório.')
    }
  }

  async listCategories(userId: string) {
    return prismaClient.category.findMany({ where: { userId } })
  }

  async getCategory(userId: string, id: string) {
    return findOwnedCategory(userId, id)
  }

  async createCategory(userId: string, data: CreateCategoryInput) {
    this.assertName(data.name)

    return prismaClient.category.create({
      data: { name: data.name.trim(), userId },
    })
  }

  async updateCategory(userId: string, id: string, data: UpdateCategoryInput) {
    await findOwnedCategory(userId, id)

    if (data.name !== undefined) {
      this.assertName(data.name)
    }

    return prismaClient.category.update({
      where: { id },
      data: { name: data.name?.trim() },
    })
  }

  async deleteCategory(userId: string, id: string) {
    await findOwnedCategory(userId, id)
    await prismaClient.category.delete({ where: { id } })
    return true
  }
}

export default new CategoryService()

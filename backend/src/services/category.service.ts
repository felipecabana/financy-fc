import { prismaClient } from '../../prisma/prisma.js'
import { UnauthorizedError } from '../errors/UnauthorizedError.js'
import { isCategoryColor, isCategoryIcon } from '../helpers/category-fields.js'
import { findOwnedCategory } from '../helpers/ownership.js'

interface CreateCategoryInput {
  name: string
  icon: string
  color: string
  description?: string | null
}

interface UpdateCategoryInput {
  name: string
  icon: string
  color: string
  description?: string | null
}

class CategoryService {
  private assertName(name: string | undefined) {
    if (!name?.trim()) {
      throw new UnauthorizedError('Nome é obrigatório.')
    }
  }

  private assertIcon(icon: string | undefined) {
    if (!icon?.trim()) {
      throw new UnauthorizedError('Ícone é obrigatório.')
    }

    if (!isCategoryIcon(icon.trim())) {
      throw new UnauthorizedError('Ícone inválido.')
    }
  }

  private assertColor(color: string | undefined) {
    if (!color?.trim()) {
      throw new UnauthorizedError('Cor é obrigatória.')
    }

    if (!isCategoryColor(color.trim())) {
      throw new UnauthorizedError('Cor inválida.')
    }
  }

  private normalizeDescription(description: string | null | undefined) {
    if (description === undefined || description === null) {
      return null
    }

    const trimmed = description.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  private assertCategoryFields(data: { name: string; icon: string; color: string }) {
    this.assertName(data.name)
    this.assertIcon(data.icon)
    this.assertColor(data.color)
  }

  async listCategories(userId: string) {
    return prismaClient.category.findMany({ where: { userId } })
  }

  async getCategory(userId: string, id: string) {
    return findOwnedCategory(userId, id)
  }

  async createCategory(userId: string, data: CreateCategoryInput) {
    this.assertCategoryFields(data)

    return prismaClient.category.create({
      data: {
        name: data.name.trim(),
        icon: data.icon.trim(),
        color: data.color.trim(),
        description: this.normalizeDescription(data.description),
        userId,
      },
    })
  }

  async updateCategory(userId: string, id: string, data: UpdateCategoryInput) {
    await findOwnedCategory(userId, id)
    this.assertCategoryFields(data)

    const updateData: {
      name: string
      icon: string
      color: string
      description?: string | null
    } = {
      name: data.name.trim(),
      icon: data.icon.trim(),
      color: data.color.trim(),
    }

    if (data.description !== undefined) {
      updateData.description = this.normalizeDescription(data.description)
    }

    return prismaClient.category.update({
      where: { id },
      data: updateData,
    })
  }

  async deleteCategory(userId: string, id: string) {
    await findOwnedCategory(userId, id)
    await prismaClient.category.delete({ where: { id } })
    return true
  }
}

export default new CategoryService()

import type { CategoryColor, CategoryIcon } from './category-fields.js'

export type DefaultCategory = {
  name: string
  description: string
  icon: CategoryIcon
  color: CategoryColor
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  {
    name: 'Alimentação',
    description: 'Restaurantes, delivery e refeições',
    icon: 'utensils',
    color: 'blue',
  },
  {
    name: 'Entretenimento',
    description: 'Cinema, jogos e lazer',
    icon: 'ticket',
    color: 'pink',
  },
  {
    name: 'Investimento',
    description: 'Aplicações e retornos financeiros',
    icon: 'piggy-bank',
    color: 'green',
  },
  {
    name: 'Mercado',
    description: 'Compras de supermercado e mantimentos',
    icon: 'shopping-cart',
    color: 'orange',
  },
  {
    name: 'Salário',
    description: 'Renda mensal e bonificações',
    icon: 'briefcase-business',
    color: 'green',
  },
  {
    name: 'Saúde',
    description: 'Medicamentos, consultas e exames',
    icon: 'heart-pulse',
    color: 'red',
  },
  {
    name: 'Transporte',
    description: 'Gasolina, transporte público e viagens',
    icon: 'car-front',
    color: 'purple',
  },
  {
    name: 'Utilidades',
    description: 'Energia, água, internet e telefone',
    icon: 'tool-case',
    color: 'yellow',
  },
]

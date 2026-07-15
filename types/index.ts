export type Category =
  | 'chef_signature'
  | 'luxury'
  | 'attieke'
  | 'jollof'
  | 'side'
  | 'natural_drinks'
  | 'desserts'
  | 'soft_drinks'

export type MenuItem = {
  id: string
  name: string
  category: Category
  basePrice?: number // some items have fixed prices, others custom
  images?: string[]
}

export type OrderItem = {
  id: string
  name: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export type Order = {
  id: string
  order_number: string
  created_at: string
  items_count?: number
  items?: OrderItem[]
  subtotal: number
  vatAmount: number
  nhilAmount: number
  getfundAmount: number
  serviceAmount: number
  serviceRateSnapshot?: number
  discountAmount?: number
  discountRateSnapshot?: number
  total: number
  payment_method?: 'cash' | 'card' | 'momo' | 'other'
  order_status: 'pending' | 'delivered' | 'cancelled' | 'cooking' | 'ready' | 'served'
  payment_status: 'unpaid' | 'paid' | 'refunded'
  cashier_name: string
  waiter_name?: string
  tableNumber?: string
  payment_reference?: string | null
  reference_number?: string
  store_phone?: string
}

export type UserRole = 'ADMIN' | 'WAITER' | 'CASHIER'

export interface MockUser {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
  createdAt: string
}

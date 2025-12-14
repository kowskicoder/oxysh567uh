export interface User {
  id: string
  telegramId: number
  username: string
  firstName: string
  lastName: string
  balance: number
  coins: number
  level: number
  xp: number
  points: number
  profileImageUrl?: string
}

export interface Wallet {
  balance: number
  coins: number
  currency: string
  totalSpent: number
  totalEarned: number
  lastUpdated: number
}

export interface Transaction {
  id: string
  type: string
  amount: number
  description: string
  status: string
  createdAt: string
}

export interface Event {
  id: number
  title: string
  description: string
  category: string
  yesCount: number
  noCount: number
  status: string
  createdAt: string
  deadline: string
}

export interface Challenge {
  id: number
  title: string
  description: string
  category: string
  wagerAmount: number
  status: string
  createdAt: string
  deadline: string
  winner?: string
}

export interface ApiResponse<T> {
  ok: boolean
  data?: T
  error?: string
  code?: string
  timestamp: number
}

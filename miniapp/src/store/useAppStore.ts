import { create } from 'zustand'

interface User {
  id: string
  telegramId: string
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

interface AppStore {
  user: User | null
  setUser: (user: User | null) => void
  updateBalance: (amount: number) => void
  isAuthenticated: boolean
  setAuthenticated: (value: boolean) => void
  activeTab: 'wallet' | 'events' | 'challenges' | 'leaderboard' | 'profile'
  setActiveTab: (tab: 'wallet' | 'events' | 'challenges' | 'leaderboard' | 'profile') => void
}

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  updateBalance: (amount) =>
    set((state) => ({
      user: state.user ? { ...state.user, balance: state.user.balance + amount } : null,
    })),
  isAuthenticated: false,
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  activeTab: 'wallet',
  setActiveTab: (tab) => set({ activeTab: tab }),
}))

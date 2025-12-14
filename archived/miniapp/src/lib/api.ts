import axios, { AxiosInstance } from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

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

interface AuthResponse {
  ok: boolean
  user: User
  timestamp: number
}

interface Wallet {
  balance: number
  coins: number
  currency: string
  totalSpent: number
  totalEarned: number
  lastUpdated: number
}

interface Transaction {
  id: string
  type: string
  amount: number
  description: string
  status: string
  createdAt: string
}

interface WalletResponse {
  ok: boolean
  wallet: Wallet
  recentTransactions: Transaction[]
}

interface Event {
  id: number
  title: string
  description: string
  category: string
  entryFee: number
  status: string
  createdAt: string
  deadline: string
  participants: number
  yesVotes: number
  noVotes: number
}

interface EventsResponse {
  ok: boolean
  events: Event[]
  pagination?: { limit: number; offset: number; total: number }
}

interface Challenge {
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

interface ChallengesResponse {
  ok: boolean
  created: Challenge[]
  accepted: Challenge[]
}

interface StatsResponse {
  ok: boolean
  stats: {
    participationCount: number
    challengesCreated: number
    challengesAccepted: number
    totalEvents: number
  }
}

interface AchievementsResponse {
  ok: boolean
  achievements: Array<{ name: string; icon: string }>
}

interface LeaderboardResponse {
  ok: boolean
  leaderboard: Array<{ id: string; username: string; level: number; points: number }>
}

class ApiClient {
  private client: AxiosInstance
  private initData: string = ''

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 10000,
    })

    this.client.interceptors.request.use((config) => {
      if (this.initData) {
        config.headers['X-Telegram-Init-Data'] = this.initData
      }
      return config
    })

    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        const message = error.response?.data?.error || error.message || 'An error occurred'
        return Promise.reject(new Error(message))
      }
    )
  }

  setInitData(data: string) {
    this.initData = data
  }

  async authenticate(initData: string): Promise<AuthResponse> {
    const response: AuthResponse = await this.client.post('/api/telegram/mini-app/auth', { initData })
    this.initData = initData
    return response
  }

  async getUser() {
    return this.client.get<unknown, { user: User; stats: any }>('/api/telegram/mini-app/user')
  }

  async getWallet(): Promise<WalletResponse> {
    return this.client.get('/api/telegram/mini-app/wallet')
  }

  async initiateDeposit(amount: number): Promise<{
    status: boolean
    message: string
    data?: {
      authorization_url: string
      access_code: string
      reference: string
    }
  }> {
    return this.client.post('/api/telegram/mini-app/deposit', { amount })
  }

  async initiateWithdraw(amount: number): Promise<{
    success: boolean
    message: string
    withdrawalId?: string
  }> {
    return this.client.post('/api/telegram/mini-app/withdraw', { amount })
  }

  async getEvents(
    limit = 20,
    offset = 0,
    category?: string,
    status?: string
  ): Promise<EventsResponse> {
    const params = { limit, offset, ...(category && { category }), ...(status && { status }) }
    return this.client.get('/api/telegram/mini-app/events', { params })
  }

  async getEventDetails(eventId: number) {
    return this.client.get(`/api/telegram/mini-app/events/${eventId}`)
  }

  async joinEvent(eventId: number, prediction: boolean) {
    return this.client.post(`/api/events/${eventId}/join`, { prediction })
  }

  async leaveEvent(eventId: number) {
    return this.client.post(`/api/events/${eventId}/leave`)
  }

  async getChallenges(): Promise<ChallengesResponse> {
    return this.client.get('/api/telegram/mini-app/challenges')
  }

  async createChallenge(data: {
    title: string
    description: string
    category: string
    wagerAmount: number
    deadline: string
    acceptedUserId?: string
  }) {
    return this.client.post('/api/telegram/mini-app/challenges/create', data)
  }

  async acceptChallenge(challengeId: number) {
    return this.client.post(`/api/telegram/mini-app/challenges/${challengeId}/accept`)
  }

  async getStats(): Promise<StatsResponse> {
    return this.client.get('/api/telegram/mini-app/stats')
  }

  async getAchievements(): Promise<AchievementsResponse> {
    return this.client.get('/api/telegram/mini-app/achievements')
  }

  async getLeaderboard(limit = 50): Promise<LeaderboardResponse> {
    return this.client.get('/api/telegram/mini-app/leaderboard', { params: { limit } })
  }

  // User discovery & search
  async searchUsers(query: string): Promise<any> {
    return this.client.get('/api/users/search', { params: { q: query } })
  }

  async getSuggestedUsers(): Promise<any> {
    return this.client.get('/api/users/suggestions')
  }

  async getUserProfile(userId: string): Promise<any> {
    return this.client.get(`/api/users/${userId}/profile`)
  }
}

export const apiClient = new ApiClient()
export type { AuthResponse, WalletResponse, Event, Challenge, User }

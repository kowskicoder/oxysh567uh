import express, { Request, Response } from 'express'
import * as dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import walletRoutes from './routes/wallet.js'
import eventsRoutes from './routes/events.js'
import challengesRoutes from './routes/challenges.js'
import statsRoutes from './routes/stats.js'
import usersRoutes from './routes/users.js'
import telegramRoutes from './routes/telegram.js'
import { client } from './db/connection.js'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

const app = express()
const PORT = parseInt(process.env.PORT || '5001', 10)

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// CORS headers
app.use((req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-Telegram-Init-Data')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  
  next()
})

// Logging middleware
app.use((req: Request, res: Response, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`)
  next()
})

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    ok: true,
    service: 'bantah-miniapp-backend',
    timestamp: Date.now(),
  })
})

// Routes
app.use('/api', authRoutes)
app.use('/api', walletRoutes)
app.use('/api', eventsRoutes)
app.use('/api', challengesRoutes)
app.use('/api', statsRoutes)
app.use('/api', usersRoutes)
app.use('/api', telegramRoutes)

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    ok: false,
    error: 'Endpoint not found',
    timestamp: Date.now(),
  })
})

// Error handler
app.use((error: any, req: Request, res: Response) => {
  console.error('Server error:', error)
  res.status(500).json({
    ok: false,
    error: 'Internal server error',
    timestamp: Date.now(),
  })
})

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚀 Bantah Mini-App Backend Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Port: ${PORT}
🌐 URL: http://localhost:${PORT}
📊 Health: http://localhost:${PORT}/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Available Endpoints:
  POST   /api/auth                   - Authenticate with Telegram
  GET    /api/wallet                 - Get wallet balance
  GET    /api/events                 - Get prediction events
  POST   /api/events/:id/join        - Join prediction
  GET    /api/challenges             - Get challenges
  POST   /api/challenges/create      - Create challenge
  POST   /api/challenges/:id/accept  - Accept challenge
  GET    /api/stats                  - Get user stats
  GET    /api/leaderboard            - Get leaderboard
`)
})

export default app

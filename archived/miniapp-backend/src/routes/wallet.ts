import { Router, Response, Request } from 'express'
import { client } from '../db/connection.js'
import { telegramAuthMiddleware, AuthenticatedRequest } from '../middleware/telegram.js'
import { initializePaystackTransaction, verifyPaystackPayment, verifyPaystackWebhookSignature, generatePaystackReference } from '../utils/paystack.js'
import type { ApiResponse, Wallet, Transaction } from '../types/index.js'

const router = Router()

/**
 * GET /api/wallet
 * Get user's wallet balance and recent transactions
 */
router.get('/wallet', telegramAuthMiddleware, async (req: AuthenticatedRequest, res: Response<ApiResponse<{ wallet: Wallet; recentTransactions: Transaction[] }>>) => {
  try {
    const telegramId = req.telegramUser?.id?.toString()

    if (!telegramId) {
      return res.status(401).json({
        ok: false,
        error: 'Unauthorized',
        timestamp: Date.now(),
      })
    }

    // Query user from database
    const result = await client`
      SELECT id, balance, coins FROM users
      WHERE telegram_id = ${telegramId}
      LIMIT 1
    `

    if (result.length === 0) {
      return res.status(404).json({
        ok: false,
        error: 'User not found',
        timestamp: Date.now(),
      })
    }

    const user = result[0] as { id: string; balance: string | number; coins: string | number }

    // Calculate totalSpent and totalEarned from transactions
    let totalSpent = 0
    let totalEarned = 0
    try {
      const statsResult = await client`
        SELECT 
          COALESCE(SUM(CASE WHEN type IN ('bet', 'withdrawal') THEN amount ELSE 0 END), 0) as spent,
          COALESCE(SUM(CASE WHEN type IN ('deposit', 'bet_win', 'challenge_win', 'event_win') THEN amount ELSE 0 END), 0) as earned
        FROM transactions
        WHERE user_id = ${user.id}
      `
      if (statsResult.length > 0) {
        const stats = statsResult[0] as any
        totalSpent = typeof stats.spent === 'string' ? parseInt(stats.spent) : stats.spent || 0
        totalEarned = typeof stats.earned === 'string' ? parseInt(stats.earned) : stats.earned || 0
      }
    } catch (error) {
      console.log('Note: Could not calculate transaction stats')
    }

    // Format wallet data
    const wallet: Wallet = {
      balance: typeof user.balance === 'string' ? parseInt(user.balance) : user.balance,
      coins: typeof user.coins === 'string' ? parseInt(user.coins) : user.coins,
      currency: 'NGN',
      totalSpent,
      totalEarned,
      lastUpdated: Date.now(),
    }

    // Query transaction history from database
    let recentTransactions: Transaction[] = []
    try {
      const txResult = await client`
        SELECT id, type, amount, description, status, created_at
        FROM transactions
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
        LIMIT 10
      `
      
      recentTransactions = (txResult as any[]).map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: typeof tx.amount === 'string' ? parseInt(tx.amount) : tx.amount,
        description: tx.description,
        status: tx.status,
        createdAt: new Date(tx.created_at).toISOString(),
      }))
    } catch (error) {
      console.log('Note: Transaction table query failed, using empty list')
      recentTransactions = []
    }

    res.json({
      ok: true,
      data: {
        wallet,
        recentTransactions,
      },
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Wallet error:', error)
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch wallet',
      timestamp: Date.now(),
    })
  }
})

/**
 * POST /api/deposit
 * Initiate a deposit via Paystack
 */
router.post('/deposit', telegramAuthMiddleware, async (req: AuthenticatedRequest, res: Response<ApiResponse<{ authorization_url: string; access_code: string; reference: string }>>) => {
  try {
    const { amount } = req.body
    const telegramId = req.telegramUser?.id?.toString()

    if (!amount || amount <= 0 || !telegramId) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid amount or missing user',
        timestamp: Date.now(),
      })
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) {
      console.error('PAYSTACK_SECRET_KEY not set')
      return res.status(500).json({
        ok: false,
        error: 'Payment service unavailable',
        timestamp: Date.now(),
      })
    }

    const reference = generatePaystackReference(telegramId)
    const paystackResponse = await initializePaystackTransaction(
      `telegram_${telegramId}@bantah.app`,
      amount,
      reference,
      secretKey
    )

    if (!paystackResponse.status) {
      console.error('Paystack initialization failed:', paystackResponse)
      return res.status(400).json({
        ok: false,
        error: paystackResponse.message || 'Failed to initialize payment',
        timestamp: Date.now(),
      })
    }

    // Create pending transaction record
    try {
      await client`
        INSERT INTO transactions (user_id, type, amount, description, related_id, status, created_at)
        VALUES (${telegramId}, 'deposit', ${amount}, 'Deposit initiated', ${reference}, 'pending', now())
      `
    } catch (txErr) {
      console.warn('Could not insert deposit transaction:', (txErr as any)?.message || txErr)
    }

    console.log(`Deposit initiated for user ${telegramId}: ₦${amount} (reference: ${reference})`)

    res.json({
      ok: true,
      data: {
        authorization_url: paystackResponse.data?.authorization_url || '',
        access_code: paystackResponse.data?.access_code || '',
        reference: paystackResponse.data?.reference || reference,
      },
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Deposit error:', error)
    res.status(500).json({
      ok: false,
      error: 'Failed to initiate deposit',
      timestamp: Date.now(),
    })
  }
})

/**
 * POST /api/withdraw
 * Initiate a withdrawal to user's bank account
 */
router.post('/withdraw', telegramAuthMiddleware, async (req: AuthenticatedRequest, res: Response<ApiResponse<{ success: boolean; message: string }>>) => {
  try {
    const { amount } = req.body
    const telegramId = req.telegramUser?.id?.toString()

    if (!amount || amount <= 0 || !telegramId) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid amount or missing user',
        timestamp: Date.now(),
      })
    }

    // Get user to check balance
    const userResult = await client`
      SELECT id, balance FROM users
      WHERE telegram_id = ${telegramId}
      LIMIT 1
    `

    if (!userResult || userResult.length === 0) {
      return res.status(404).json({
        ok: false,
        error: 'User not found',
        timestamp: Date.now(),
      })
    }

    const userBalance = typeof userResult[0].balance === 'string' 
      ? parseInt(userResult[0].balance) 
      : userResult[0].balance || 0

    if (userBalance < amount) {
      return res.status(400).json({
        ok: false,
        error: 'Insufficient balance',
        timestamp: Date.now(),
      })
    }

    const reference = `withdraw_${telegramId}_${Date.now()}`

    // Create pending withdrawal transaction
    try {
      await client`
        INSERT INTO transactions (user_id, type, amount, description, related_id, status, created_at)
        VALUES (${telegramId}, 'withdrawal', ${amount}, 'Withdrawal request', ${reference}, 'pending', now())
      `
      
      // Deduct from user balance
      await client`
        UPDATE users SET balance = balance - ${amount}
        WHERE telegram_id = ${telegramId}
      `
    } catch (txErr) {
      console.error('Withdrawal transaction error:', txErr)
      return res.status(500).json({
        ok: false,
        error: 'Failed to process withdrawal',
        timestamp: Date.now(),
      })
    }

    console.log(`Withdrawal initiated for user ${telegramId}: ₦${amount}`)

    res.json({
      ok: true,
      data: {
        success: true,
        message: 'Withdrawal request submitted. You will receive your funds within 24 hours.',
      },
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Withdrawal error:', error)
    res.status(500).json({
      ok: false,
      error: 'Failed to process withdrawal',
      timestamp: Date.now(),
    })
  }
})

/**
 * POST /api/webhook/paystack
 * Handle Paystack webhook for payment verification
 */
router.post('/webhook/paystack', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-paystack-signature'] as string
    const secretKey = process.env.PAYSTACK_SECRET_KEY

    if (!secretKey) {
      console.error('PAYSTACK_SECRET_KEY not set')
      return res.status(500).json({ ok: false, error: 'Server configuration error' })
    }

    const payload = JSON.stringify(req.body)
    const isValid = verifyPaystackWebhookSignature(payload, signature, secretKey)

    if (!isValid) {
      console.warn('Invalid Paystack webhook signature')
      return res.status(401).json({ ok: false, error: 'Invalid signature' })
    }

    const event = req.body.event
    const data = req.body.data

    if (event === 'charge.success') {
      const reference = data.reference
      const amount = data.amount / 100 // Convert from kobo
      const status = data.status

      if (status === 'success') {
        // Extract telegram ID from reference
        const telegramIdMatch = reference.match(/miniapp_([0-9]+)_/)
        if (!telegramIdMatch) {
          console.warn('Could not extract telegram ID from reference:', reference)
          return res.status(200).json({ ok: true }) // Still return 200 to acknowledge webhook
        }

        const telegramId = telegramIdMatch[1]

        try {
          // Update transaction status and user balance
          await client`
            UPDATE transactions
            SET status = 'completed'
            WHERE related_id = ${reference} AND type = 'deposit'
          `

          await client`
            UPDATE users
            SET balance = balance + ${amount}
            WHERE telegram_id = ${telegramId}
          `

          console.log(`Deposit confirmed for user ${telegramId}: ₦${amount}`)
        } catch (dbError) {
          console.error('Database error processing webhook:', dbError)
        }
      }
    }

    res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(200).json({ ok: true }) // Always return 200 to prevent retries
  }
})

export default router

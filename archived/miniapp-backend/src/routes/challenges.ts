import { Router, Response } from 'express'
import { client } from '../db/connection.js'
import { telegramAuthMiddleware, AuthenticatedRequest } from '../middleware/telegram.js'
import type { ApiResponse, Challenge } from '../types/index.js'

const router = Router()

/**
 * GET /api/challenges
 * Get user's challenges (created and accepted)
 */
router.get('/challenges', telegramAuthMiddleware, async (req: AuthenticatedRequest, res: Response<ApiResponse<{ created: Challenge[]; accepted: Challenge[] }>>) => {
  try {
    const telegramId = req.telegramUser?.id?.toString()
    const userId = `telegram-${telegramId}`

    if (!telegramId) {
      return res.status(401).json({
        ok: false,
        error: 'Unauthorized',
        timestamp: Date.now(),
      })
    }

    // Get challenges created by user
    const createdResult = await client`
      SELECT id, title, description, category, amount, status, created_at, due_date, result
      FROM challenges
      WHERE challenger = ${userId}
    `

    // Get challenges accepted by user
    const acceptedResult = await client`
      SELECT id, title, description, category, amount, status, created_at, due_date, result
      FROM challenges
      WHERE challenged = ${userId}
    `

    // Convert to API format
    const formatChallenge = (c: any): Challenge => ({
      id: c.id,
      title: c.title,
      description: c.description || '',
      category: c.category,
      wagerAmount: typeof c.amount === 'string' ? parseInt(c.amount) : c.amount,
      status: c.status,
      createdAt: new Date(c.created_at).toISOString(),
      deadline: new Date(c.due_date).toISOString(),
      winner: c.result,
    })

    res.json({
      ok: true,
      data: {
        created: (createdResult as any[]).map(formatChallenge),
        accepted: (acceptedResult as any[]).map(formatChallenge),
      },
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Challenges error:', error)
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch challenges',
      timestamp: Date.now(),
    })
  }
})

/**
 * POST /api/challenges/create
 * Create a new challenge
 */
router.post('/challenges/create', telegramAuthMiddleware, async (req: AuthenticatedRequest, res: Response<ApiResponse<{ challengeId: number }>>) => {
  try {
    const { title, description, category, wagerAmount, deadline } = req.body
    const telegramId = req.telegramUser?.id?.toString()
    const userId = `telegram-${telegramId}`

    if (!title || !category || !wagerAmount || !telegramId) {
      return res.status(400).json({
        ok: false,
        error: 'Missing required fields',
        timestamp: Date.now(),
      })
    }

    // Create challenge in database
    const dueDate = deadline ? new Date(deadline) : new Date(Date.now() + 604800000) // 7 days default
    
    const insertResult = await client`
      INSERT INTO challenges (challenger, challenged, title, description, category, amount, status, due_date)
      VALUES (${userId}, '', ${title}, ${description || ''}, ${category}, ${wagerAmount}, 'pending', ${dueDate})
      RETURNING id
    `

    const challengeId = insertResult[0]?.id || 0

    console.log(`Created challenge ${challengeId} by user ${telegramId}`)

    res.json({
      ok: true,
      data: { challengeId },
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Create challenge error:', error)
    res.status(500).json({
      ok: false,
      error: 'Failed to create challenge',
      timestamp: Date.now(),
    })
  }
})

/**
 * POST /api/challenges/:id/accept
 * Accept a challenge from another user
 */
router.post('/challenges/:id/accept', telegramAuthMiddleware, async (req: AuthenticatedRequest, res: Response<ApiResponse<{ success: boolean }>>) => {
  try {
    const challengeId = parseInt(req.params.id)
    const telegramId = req.telegramUser?.id?.toString()
    const userId = `telegram-${telegramId}`

    if (!challengeId || !telegramId) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid request',
        timestamp: Date.now(),
      })
    }

    // Update challenge with accepted user
    await client`
      UPDATE challenges
      SET challenged = ${userId}, status = 'active'
      WHERE id = ${challengeId}
    `

    console.log(`User ${telegramId} accepted challenge ${challengeId}`)

    res.json({
      ok: true,
      data: { success: true },
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Accept challenge error:', error)
    res.status(500).json({
      ok: false,
      error: 'Failed to accept challenge',
      timestamp: Date.now(),
    })
  }
})

/**
 * POST /api/challenges/:id/settle
 * Settle a challenge result (draw, challenger, challenged)
 */
router.post('/challenges/:id/settle', telegramAuthMiddleware, async (req: AuthenticatedRequest, res: Response<ApiResponse<{ success: boolean }>>) => {
  try {
    const challengeId = parseInt(req.params.id)
    const { result } = req.body // 'challenger' | 'challenged' | 'draw'

    if (!challengeId || !result) {
      return res.status(400).json({ ok: false, error: 'Invalid request', timestamp: Date.now() })
    }

    // Fetch challenge
    const challengeResult = await client`
      SELECT id, challenger, challenged, amount, status
      FROM challenges
      WHERE id = ${challengeId}
      LIMIT 1
    `

    const challengeData = challengeResult[0]
    if (!challengeData) {
      return res.status(404).json({ ok: false, error: 'Challenge not found', timestamp: Date.now() })
    }

    if (challengeData.status === 'completed') {
      return res.status(400).json({ ok: false, error: 'Challenge already settled', timestamp: Date.now() })
    }

    // Determine payouts
    const stake = parseInt(challengeData.amount || '0')
    let txs: any[] = []

    if (result === 'draw') {
      // Refund both
      txs.push({ userId: challengeData.challenger, amount: stake, type: 'challenge_refund', description: `Refund for challenge ${challengeId}` })
      txs.push({ userId: challengeData.challenged, amount: stake, type: 'challenge_refund', description: `Refund for challenge ${challengeId}` })
    } else if (result === 'challenger') {
      // Challenger wins: gets stake*2
      txs.push({ userId: challengeData.challenger, amount: stake * 2, type: 'challenge_win', description: `Challenge ${challengeId} win` })
    } else if (result === 'challenged') {
      txs.push({ userId: challengeData.challenged, amount: stake * 2, type: 'challenge_win', description: `Challenge ${challengeId} win` })
    } else {
      return res.status(400).json({ ok: false, error: 'Invalid result', timestamp: Date.now() })
    }

    // Update challenge status and result
    await client`
      UPDATE challenges SET status = 'completed', result = ${result}, completed_at = now()
      WHERE id = ${challengeId}
    `

    // Update escrow and create transactions
    try {
      // Release escrow
      await client`
        UPDATE escrow SET status = 'released', released_at = now()
        WHERE challenge_id = ${challengeId}
      `

      // Create transactions
      for (const tx of txs) {
        await client`
          INSERT INTO transactions (user_id, type, amount, description, related_id, status, created_at)
          VALUES (${tx.userId}, ${tx.type}, ${tx.amount}, ${tx.description}, ${challengeId}, 'completed', now())
        `
      }
      // Create notifications for challenge settlement
      try {
        if (result === 'draw') {
          await client`
            INSERT INTO notifications (user_id, type, title, message, data, created_at)
            VALUES (${challengeData.challenger}, 'challenge_refund', 'Challenge refunded', ${`Your challenge ${challengeId} was refunded (draw)`}, ${JSON.stringify({ challengeId })}, now()),
                   (${challengeData.challenged}, 'challenge_refund', 'Challenge refunded', ${`Your challenge ${challengeId} was refunded (draw)`}, ${JSON.stringify({ challengeId })}, now())
          `
        } else if (result === 'challenger') {
          await client`
            INSERT INTO notifications (user_id, type, title, message, data, created_at)
            VALUES (${challengeData.challenger}, 'challenge_win', 'Challenge won', ${`You won challenge ${challengeId}`}, ${JSON.stringify({ challengeId })}, now())
          `
        } else if (result === 'challenged') {
          await client`
            INSERT INTO notifications (user_id, type, title, message, data, created_at)
            VALUES (${challengeData.challenged}, 'challenge_win', 'Challenge won', ${`You won challenge ${challengeId}`}, ${JSON.stringify({ challengeId })}, now())
          `
        }
      } catch (notifyErr) {
        console.warn('Could not insert challenge notifications:', (notifyErr as any)?.message || notifyErr)
      }
    } catch (txErr) {
      console.warn('Could not update escrow or create transactions:', txErr)
    }

    res.json({ ok: true, data: { success: true }, timestamp: Date.now() })
  } catch (error) {
    console.error('Settle challenge error:', error)
    res.status(500).json({ ok: false, error: 'Failed to settle challenge', timestamp: Date.now() })
  }
})

export default router

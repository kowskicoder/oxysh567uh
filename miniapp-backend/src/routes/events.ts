import { Router, Response } from 'express'
import { client } from '../db/connection.js'
import { telegramAuthMiddleware, AuthenticatedRequest } from '../middleware/telegram.js'
import type { ApiResponse, Event } from '../types/index.js'

const router = Router()

/**
 * GET /api/events
 * Get list of prediction events
 */
router.get('/events', telegramAuthMiddleware, async (req: AuthenticatedRequest, res: Response<ApiResponse<{ events: Event[] }>>) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
    const offset = parseInt(req.query.offset as string) || 0

    // Query events from database
    const result = await client`
      SELECT id, title, description, category, yes_pool as yesCount, no_pool as noCount, status, created_at as createdAt, end_date as deadline
      FROM events
      WHERE status != 'cancelled'
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const dbEvents = result || []

    // Convert to API format
    const responseEvents: Event[] = (dbEvents as any[]).map((evt: any) => ({
      id: evt.id,
      title: evt.title,
      description: evt.description || '',
      category: evt.category,
      yesCount: evt.yescount || 0,
      noCount: evt.nocount || 0,
      status: evt.status,
      createdAt: evt.createdat ? new Date(evt.createdat).toISOString() : new Date().toISOString(),
      deadline: evt.deadline ? new Date(evt.deadline).toISOString() : new Date().toISOString(),
    }))

    res.json({
      ok: true,
      data: {
        events: responseEvents,
      },
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Events error:', error)
    // Return mock data on error
    const mockEvents: Event[] = [
      {
        id: 1,
        title: 'Will Bitcoin reach $100k?',
        description: 'Prediction market on Bitcoin price',
        category: 'crypto',
        yesCount: 1250,
        noCount: 850,
        status: 'active',
        createdAt: new Date(Date.now() - 345600000).toISOString(),
        deadline: new Date(Date.now() + 2592000000).toISOString(),
      },
    ]
    res.json({
      ok: true,
      data: { events: mockEvents },
      timestamp: Date.now(),
    })
  }
})

/**
 * POST /api/events/:id/join
 * Join a prediction event
 */
router.post('/events/:id/join', telegramAuthMiddleware, async (req: AuthenticatedRequest, res: Response<ApiResponse<{ success: boolean }>>) => {
  try {
    const eventId = parseInt(req.params.id)
    const { prediction, amount } = req.body
    const userId = req.telegramUser?.id?.toString()

    if (!eventId || prediction === undefined || !amount || !userId) {
      return res.status(400).json({
        ok: false,
        error: 'Missing required fields',
        timestamp: Date.now(),
      })
    }

    // Basic DB operations: insert participant, update pools, and record a transaction
    try {
      // Check event exists
      const eventResult = await client`
        SELECT id, yes_pool, no_pool, event_pool, entry_fee, max_participants, status
        FROM events
        WHERE id = ${eventId}
        LIMIT 1
      `
      const eventData = eventResult[0]
      if (!eventData) {
        return res.status(404).json({ ok: false, error: 'Event not found', timestamp: Date.now() })
      }

      if (eventData.status === 'cancelled' || eventData.status === 'completed') {
        return res.status(400).json({ ok: false, error: 'Event not active', timestamp: Date.now() })
      }

      // Check for max participants
      if (eventData.max_participants && eventData.max_participants > 0) {
        const countResult = await client`
          SELECT COUNT(*)::int AS count FROM event_participants WHERE event_id = ${eventId}
        `
        const participantsCount = parseInt(countResult[0]?.count || '0')
        if (participantsCount >= eventData.max_participants) {
          return res.status(400).json({ ok: false, error: 'Event is full', timestamp: Date.now() })
        }
      }

      // Insert participant
      const insertResult = await client`
        INSERT INTO event_participants (event_id, user_id, prediction, amount, status)
        VALUES (${eventId}, ${userId}, ${prediction}, ${amount}, 'active')
        RETURNING id
      `

      // Update event pools
      if (prediction) {
        await client`
          UPDATE events SET yes_pool = yes_pool + ${amount}, event_pool = event_pool + ${amount}
          WHERE id = ${eventId}
        `
      } else {
        await client`
          UPDATE events SET no_pool = no_pool + ${amount}, event_pool = event_pool + ${amount}
          WHERE id = ${eventId}
        `
      }

      // Record a transaction for the bet
      try {
        await client`
          INSERT INTO transactions (user_id, type, amount, description, related_id, status, created_at)
          VALUES (${userId}, 'bet', ${amount}, ${`Bet on event ${eventId}`}, ${eventId}, 'completed', now())
        `
      } catch (txErr) {
        console.warn('Could not insert transaction record:', (txErr as any)?.message || txErr)
      }

      // Notify event creator (if present)
      try {
        const creatorResult = await client`
          SELECT creator_id FROM events WHERE id = ${eventId} LIMIT 1
        `
        const creatorId = creatorResult[0]?.creator_id
        if (creatorId) {
          await client`
            INSERT INTO notifications (user_id, type, title, message, data, created_at)
            VALUES (${creatorId}, 'event_participation', 'New participant', ${`User ${userId} joined event ${eventId}`}, ${JSON.stringify({ participant: userId, eventId })}, now())
          `
        }
      } catch (notifyErr) {
        console.warn('Could not insert notification:', (notifyErr as any)?.message || notifyErr)
      }

      console.log(`User ${userId} predicted ${prediction} on event ${eventId}`)

      res.json({ ok: true, data: { success: true }, timestamp: Date.now() })
    } catch (dbError) {
      console.error('Join event db error:', dbError)
      res.status(500).json({ ok: false, error: 'Failed to join event', timestamp: Date.now() })
    }
  } catch (error) {
    console.error('Join event error:', error)
    res.status(500).json({
      ok: false,
      error: 'Failed to join event',
      timestamp: Date.now(),
    })
  }
})

/**
 * GET /api/events/:id
 * Get a specific event's details
 */
router.get('/events/:id', telegramAuthMiddleware, async (req: AuthenticatedRequest, res: Response<ApiResponse<Event>>) => {
  try {
    const eventId = parseInt(req.params.id)

    if (!eventId) {
      return res.status(400).json({ ok: false, error: 'Invalid event ID', timestamp: Date.now() })
    }

    const result = await client`
      SELECT id, title, description, category, yes_pool as yesCount, no_pool as noCount, status, 
             created_at as createdAt, end_date as deadline, creator_id, max_participants, entry_fee
      FROM events
      WHERE id = ${eventId}
      LIMIT 1
    `

    if (!result || result.length === 0) {
      return res.status(404).json({ ok: false, error: 'Event not found', timestamp: Date.now() })
    }

    const evt = result[0] as any

    const event: Event = {
      id: evt.id,
      title: evt.title,
      description: evt.description || '',
      category: evt.category,
      yesCount: evt.yescount || 0,
      noCount: evt.nocount || 0,
      status: evt.status,
      createdAt: evt.createdat ? new Date(evt.createdat).toISOString() : new Date().toISOString(),
      deadline: evt.deadline ? new Date(evt.deadline).toISOString() : new Date().toISOString(),
    }

    res.json({
      ok: true,
      data: event,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Get event details error:', error)
    res.status(500).json({ ok: false, error: 'Failed to fetch event', timestamp: Date.now() })
  }
})

/**
 * POST /api/events/:id/leave
 * Leave/cancel participation in an event
 */
router.post('/events/:id/leave', telegramAuthMiddleware, async (req: AuthenticatedRequest, res: Response<ApiResponse<{ success: boolean }>>) => {
  try {
    const eventId = parseInt(req.params.id)
    const userId = req.telegramUser?.id?.toString()

    if (!eventId || !userId) {
      return res.status(400).json({ ok: false, error: 'Missing required fields', timestamp: Date.now() })
    }

    try {
      // Get the participant record to find their prediction and amount
      const participantResult = await client`
        SELECT id, prediction, amount FROM event_participants
        WHERE event_id = ${eventId} AND user_id = ${userId}
        LIMIT 1
      `

      if (!participantResult || participantResult.length === 0) {
        return res.status(404).json({ ok: false, error: 'Participant not found', timestamp: Date.now() })
      }

      const participant = participantResult[0] as any
      const amount = participant.amount

      // Delete the participant
      await client`
        DELETE FROM event_participants
        WHERE event_id = ${eventId} AND user_id = ${userId}
      `

      // Update event pools (reverse the bet)
      if (participant.prediction) {
        await client`
          UPDATE events SET yes_pool = yes_pool - ${amount}, event_pool = event_pool - ${amount}
          WHERE id = ${eventId}
        `
      } else {
        await client`
          UPDATE events SET no_pool = no_pool - ${amount}, event_pool = event_pool - ${amount}
          WHERE id = ${eventId}
        `
      }

      // Reverse the transaction
      try {
        await client`
          INSERT INTO transactions (user_id, type, amount, description, related_id, status, created_at)
          VALUES (${userId}, 'bet_refund', ${amount}, ${`Refund for leaving event ${eventId}`}, ${eventId}, 'completed', now())
        `
      } catch (txErr) {
        console.warn('Could not insert refund transaction:', (txErr as any)?.message || txErr)
      }

      console.log(`User ${userId} left event ${eventId}`)
      res.json({ ok: true, data: { success: true }, timestamp: Date.now() })
    } catch (dbError) {
      console.error('Leave event db error:', dbError)
      res.status(500).json({ ok: false, error: 'Failed to leave event', timestamp: Date.now() })
    }
  } catch (error) {
    console.error('Leave event error:', error)
    res.status(500).json({ ok: false, error: 'Failed to leave event', timestamp: Date.now() })
  }
})

export default router

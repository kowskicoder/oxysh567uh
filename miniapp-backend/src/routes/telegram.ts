import { Router, Request, Response } from 'express'
import axios from 'axios'
import { client } from '../db/connection.js'
import { verifyTelegramData } from '../middleware/telegram.js'
import { telegramAuthMiddleware } from '../middleware/telegram.js'

const router = Router()

// GET /api/telegram/status -- verifies bot token and channel access
router.get('/telegram/status', async (req: Request, res: Response) => {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN
    const channelId = process.env.TELEGRAM_CHANNEL_ID

    if (!token) {
      return res.status(400).json({ ok: false, error: 'TELEGRAM_BOT_TOKEN not configured' })
    }

    const me = await axios.get(`https://api.telegram.org/bot${token}/getMe`)
    const botInfo = me.data?.result || null

    let channelInfo = null
    if (channelId) {
      const chat = await axios.get(`https://api.telegram.org/bot${token}/getChat`, { params: { chat_id: channelId } })
      channelInfo = chat.data?.result || null
    }

    res.json({ ok: true, data: { botInfo, channelInfo }, timestamp: Date.now() })
  } catch (err: any) {
    console.error('Telegram status error:', err?.response?.data || err?.message || err)
    res.status(500).json({ ok: false, error: 'Failed to verify Telegram bot', timestamp: Date.now() })
  }
})

// POST /api/telegram/webhook -- handle bot updates from Bot API
router.post('/telegram/webhook', async (req: Request, res: Response) => {
  try {
    const update = req.body
    console.log('Telegram webhook update received:', JSON.stringify(update).slice(0, 1000))

    // Simple webhook processing: log message text for now
    if (update?.message) {
      console.log('Incoming message from Telegram:', update.message)
    }

    res.json({ ok: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    res.status(500).json({ ok: false, error: 'Webhook processing failed' })
  }
})

// POST /api/telegram/validate - validate initData (for testing signature verification)
router.post('/telegram/validate', async (req: Request, res: Response) => {
  try {
    const { initData } = req.body
    if (!initData) return res.status(400).json({ ok: false, error: 'Missing initData' })

    const user = verifyTelegramData(initData)
    if (!user) return res.status(401).json({ ok: false, error: 'Invalid Telegram signature' })

    res.json({ ok: true, data: { user }, timestamp: Date.now() })
  } catch (err) {
    console.error('Validate initData error:', err)
    res.status(500).json({ ok: false, error: 'Failed to validate initData' })
  }
})

// POST /api/telegram/link -- create a deep link to start bot for linking
router.post('/telegram/link', telegramAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN
    if (!token) {
      return res.status(400).json({ ok: false, error: 'TELEGRAM_BOT_TOKEN not configured' })
    }

    const me = await axios.get(`https://api.telegram.org/bot${token}/getMe`)
    const username = me.data?.result?.username
    if (!username) return res.status(500).json({ ok: false, error: 'Unable to resolve bot username' })

    // Create a unique token to link accounts (basic - use timestamp + telegramId)
    const telegramUser = (req as any).telegramUser
    const linkToken = Buffer.from(`${telegramUser.id}:${Date.now()}`).toString('base64')
    const link = `https://t.me/${username}?start=${linkToken}`

    // Save token binding in DB (for later verification) if table exists - don't fail if missing
    try {
      await client`
        INSERT INTO telegram_link_tokens (token, telegram_id, created_at)
        VALUES (${linkToken}, ${telegramUser.id.toString()}, now())
        ON CONFLICT (token) DO UPDATE SET created_at = now()
      `
    } catch (dbErr) {
      console.warn('Could not save telegram link token (table may not exist):', (dbErr as any)?.message || dbErr)
    }

    res.json({ ok: true, data: { link }, timestamp: Date.now() })
  } catch (error) {
    console.error('Create link error:', error)
    res.status(500).json({ ok: false, error: 'Failed to create link', timestamp: Date.now() })
  }
})

export default router

import { Router, Request, Response } from 'express'
import { client } from '../db/connection.js'
import { verifyTelegramData } from '../middleware/telegram.js'
import type { ApiResponse, User } from '../types/index.js'

const router = Router()

/**
 * POST /api/auth
 * Authenticate user with Telegram initData
 * Returns user object with balance
 */
router.post('/auth', async (req: Request, res: Response<ApiResponse<{ user: User; token: string }>>) => {
  try {
    const { initData } = req.body

    if (!initData) {
      return res.status(400).json({
        ok: false,
        error: 'Missing initData',
        timestamp: Date.now(),
      })
    }

    // Verify Telegram data
    const telegramUser = verifyTelegramData(initData)

    if (!telegramUser) {
      return res.status(401).json({
        ok: false,
        error: 'Invalid Telegram data',
        timestamp: Date.now(),
      })
    }

    // Query or create user in database
    try {
      const result = await client`
        SELECT id, username, first_name, last_name, profile_image_url, balance, coins, level, xp, points
        FROM users
        WHERE telegram_id = ${telegramUser.id.toString()}
        LIMIT 1
      `

      let user = result[0]

      // If user doesn't exist, create one
      if (!user) {
        const newId = `telegram-${telegramUser.id}`
        const newEmail = `telegram-${telegramUser.id}@bantah.app`
        const newUsername = telegramUser.username || `user${telegramUser.id}`

        await client`
          INSERT INTO users (
            id, email, password, first_name, last_name, username,
            telegram_id, telegram_username, profile_image_url, is_telegram_user,
            balance, coins, level, xp, points
          ) VALUES (
            ${newId}, ${newEmail}, 'telegram', 
            ${telegramUser.first_name || 'Telegram'},
            ${telegramUser.last_name || 'User'},
            ${newUsername},
            ${telegramUser.id.toString()},
            ${telegramUser.username || null},
            ${telegramUser.photo_url || null},
            true,
            0, 0, 1, 0, 1000
          )
        `

        const created = await client`
          SELECT id, username, first_name, last_name, profile_image_url, balance, coins, level, xp, points
          FROM users
          WHERE telegram_id = ${telegramUser.id.toString()}
          LIMIT 1
        `
        user = created[0]
      }

      // Convert DB user to API response format
      const responseUser: User = {
        id: user.id,
        telegramId: telegramUser.id,
        username: user.username || `user${telegramUser.id}`,
        firstName: user.first_name || 'User',
        lastName: user.last_name || '',
        balance: parseInt(user.balance) || 0,
        coins: user.coins || 0,
        level: user.level || 1,
        xp: user.xp || 0,
        points: user.points || 0,
        profileImageUrl: user.profile_image_url,
      }

      res.json({
        ok: true,
        data: {
          user: responseUser,
          token: Buffer.from(initData).toString('base64'),
        },
        timestamp: Date.now(),
      })
    } catch (dbError) {
      console.error('Database error:', dbError)
      // Return fallback user
      const fallbackUser: User = {
        id: `telegram-${telegramUser.id}`,
        telegramId: telegramUser.id,
        username: telegramUser.username || `user${telegramUser.id}`,
        firstName: telegramUser.first_name || 'User',
        lastName: telegramUser.last_name || '',
        balance: 0,
        coins: 0,
        level: 1,
        xp: 0,
        points: 0,
        profileImageUrl: telegramUser.photo_url,
      }

      res.json({
        ok: true,
        data: {
          user: fallbackUser,
          token: Buffer.from(initData).toString('base64'),
        },
        timestamp: Date.now(),
      })
    }
  } catch (error) {
    console.error('Auth error:', error)
    res.status(500).json({
      ok: false,
      error: 'Authentication failed',
      timestamp: Date.now(),
    })
  }
})

export default router

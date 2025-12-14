import { createHmac } from 'crypto'
import { Request, Response, NextFunction } from 'express'

export interface AuthenticatedRequest extends Request {
  telegramUser?: {
    id: number
    username?: string
    first_name?: string
    last_name?: string
    photo_url?: string
  }
}

/**
 * Verify Telegram mini-app initData signature
 * Implements: https://core.telegram.org/bots/webapps#validating-data-received-from-the-web-app
 */
export function verifyTelegramData(initData: string): { id: number; username?: string; first_name?: string; last_name?: string; photo_url?: string } | null {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN not set')
    return null
  }

  try {
    // Parse initData
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    
    if (!hash) {
      console.warn('No hash in initData')
      return null
    }

    // Remove hash from params
    params.delete('hash')

    // Create data-check-string
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')

    // Verify signature
    const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest()
    const signature = createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

    if (signature !== hash) {
      console.warn('Invalid Telegram signature')
      return null
    }

    // Extract user data
    const userParam = params.get('user')
    if (!userParam) {
      console.warn('No user data in initData')
      return null
    }

    const user = JSON.parse(userParam)
    return user
  } catch (error) {
    console.error('Error verifying Telegram data:', error)
    return null
  }
}

/**
 * Middleware to verify Telegram authentication
 */
export function telegramAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['x-telegram-init-data'] as string

  if (!authHeader) {
    return res.status(401).json({ ok: false, error: 'Missing Telegram authentication data' })
  }

  const user = verifyTelegramData(authHeader)

  if (!user) {
    return res.status(401).json({ ok: false, error: 'Invalid Telegram authentication' })
  }

  req.telegramUser = user
  next()
}

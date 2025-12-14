import { Router, Request, Response } from 'express'
import { client } from '../db/connection.js'
import { verifyTelegramAuth } from '../middleware/auth.js'

const router = Router()

/**
 * GET /api/users/search?q=query
 * Search for users by username or name
 * Returns: Array of users matching the search query
 */
router.get('/search', verifyTelegramAuth, async (req: Request, res: Response) => {
  try {
    const searchQuery = (req.query.q as string)?.trim() || ''
    const userId = (req as any).userId
    
    if (!searchQuery || searchQuery.length < 2) {
      return res.json({ users: [] })
    }

    const searchLower = `%${searchQuery.toLowerCase()}%`

    const users = await client`
      SELECT 
        id,
        username,
        firstName,
        lastName,
        profileImageUrl,
        level,
        points
      FROM users
      WHERE 
        (LOWER(username) LIKE ${searchLower} OR 
         LOWER(firstName) LIKE ${searchLower} OR 
         LOWER(lastName) LIKE ${searchLower})
        AND id != ${userId}
      ORDER BY 
        CASE 
          WHEN LOWER(username) = LOWER(${searchQuery}) THEN 1
          WHEN LOWER(username) LIKE CONCAT(${searchQuery}, '%') THEN 2
          ELSE 3
        END,
        points DESC
      LIMIT 20
    `

    res.json({
      users: users.map((u: any) => ({
        id: u.id,
        username: u.username,
        firstName: u.firstName,
        lastName: u.lastName,
        profileImageUrl: u.profileImageUrl,
        level: u.level,
        points: u.points,
        displayName: `${u.firstName}${u.lastName ? ' ' + u.lastName : ''}`,
      })),
    })
  } catch (error) {
    console.error('User search error:', error)
    res.status(500).json({ error: 'Failed to search users' })
  }
})

/**
 * GET /api/users/suggestions
 * Get suggested users to challenge (top players, recent players, etc.)
 * Returns: Array of suggested users
 */
router.get('/suggestions', verifyTelegramAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId

    // Get top players (most points) excluding current user
    const topPlayers = await client`
      SELECT 
        id,
        username,
        firstName,
        lastName,
        profileImageUrl,
        level,
        points
      FROM users
      WHERE id != ${userId}
      ORDER BY points DESC
      LIMIT 5
    `

    // Get recently active users
    const recentActive = await client`
      SELECT 
        id,
        username,
        firstName,
        lastName,
        profileImageUrl,
        level,
        points
      FROM users
      WHERE id != ${userId}
      ORDER BY updatedAt DESC
      LIMIT 5
    `

    const suggestions = {
      topPlayers: topPlayers.map((u: any) => ({
        id: u.id,
        username: u.username,
        firstName: u.firstName,
        lastName: u.lastName,
        profileImageUrl: u.profileImageUrl,
        level: u.level,
        points: u.points,
        displayName: `${u.firstName}${u.lastName ? ' ' + u.lastName : ''}`,
        category: 'Top Players',
      })),
      recentActive: recentActive.map((u: any) => ({
        id: u.id,
        username: u.username,
        firstName: u.firstName,
        lastName: u.lastName,
        profileImageUrl: u.profileImageUrl,
        level: u.level,
        points: u.points,
        displayName: `${u.firstName}${u.lastName ? ' ' + u.lastName : ''}`,
        category: 'Recently Active',
      })),
    }

    res.json(suggestions)
  } catch (error) {
    console.error('Suggestions error:', error)
    res.status(500).json({ error: 'Failed to fetch suggestions' })
  }
})

/**
 * GET /api/users/:userId/profile
 * Get a user's public profile
 */
router.get('/:userId/profile', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params

    const user = await client`
      SELECT 
        id,
        username,
        firstName,
        lastName,
        profileImageUrl,
        level,
        xp,
        points
      FROM users
      WHERE id = ${userId}
    `

    if (!user.length) {
      return res.status(404).json({ error: 'User not found' })
    }

    const userProfile = user[0]
    
    res.json({
      id: userProfile.id,
      username: userProfile.username,
      firstName: userProfile.firstName,
      lastName: userProfile.lastName,
      profileImageUrl: userProfile.profileImageUrl,
      level: userProfile.level,
      xp: userProfile.xp,
      points: userProfile.points,
      displayName: `${userProfile.firstName}${userProfile.lastName ? ' ' + userProfile.lastName : ''}`,
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch user profile' })
  }
})

export default router

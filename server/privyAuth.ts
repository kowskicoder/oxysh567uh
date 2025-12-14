import { PrivyClient } from '@privy-io/server-auth';

const PRIVY_APP_ID = process.env.PRIVY_APP_ID || 'cmc9a12oh01lnky0m1agzgdoc';
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET || 'HkeiV3uHt5F9uJhJGFjUSbsAFujpjTQFQGzhbMVa9X2aMFaeU3xuSBycAxogfLYM39jjeZVDyUTGv6zSMZ42YbR';

if (!process.env.PRIVY_APP_ID) {
  console.warn('⚠️ PRIVY_APP_ID not set in environment variables, using default');
}

if (!process.env.PRIVY_APP_SECRET) {
  console.warn('⚠️ PRIVY_APP_SECRET not set in environment variables, using default (ROTATE THIS SECRET!)');
}

export const privyClient = new PrivyClient(PRIVY_APP_ID, PRIVY_APP_SECRET);

export async function verifyPrivyToken(token: string) {
  try {
    const verifiedClaims = await privyClient.verifyAuthToken(token);
    return verifiedClaims;
  } catch (error) {
    console.error('Privy token verification failed:', error);
    return null;
  }
}

import { storage } from './storage';

async function getUserFromDb(userId: string) {
  try {
    // Fetch user from actual database
    const user = await storage.getUser(userId);
    return user;
  } catch (error) {
    console.error('Error fetching user from database:', error);
    return null;
  }
}

async function upsertPrivyUser(verifiedClaims: any) {
  try {
    const userId = verifiedClaims.userId || verifiedClaims.sub;
    let dbUser = await getUserFromDb(userId);
    
    if (!dbUser) {
      const email = verifiedClaims.email || `${userId}@privy.user`;
      
      const existingByEmail = await storage.getUserByEmail(email);
      if (existingByEmail) {
        return existingByEmail;
      }
      
      const username = verifiedClaims.email?.split('@')[0] || `user_${userId.slice(-8)}`;
      
      dbUser = await storage.upsertUser({
        id: userId,
        email: email,
        password: 'PRIVY_AUTH_USER',
        firstName: verifiedClaims.given_name || verifiedClaims.name || 'Privy',
        lastName: verifiedClaims.family_name || 'User',
        username: username,
        profileImageUrl: verifiedClaims.picture,
      });
    }
    
    // Extract Telegram data from Privy linkedAccounts if user signed in with Telegram
    if (verifiedClaims.linkedAccounts) {
      const telegramAccount = verifiedClaims.linkedAccounts.find((account: any) => account.type === 'telegram');
      if (telegramAccount && telegramAccount.telegramUserId) {
        console.log(`🔗 Telegram account detected in Privy claims: ${telegramAccount.telegramUserId}`);
        
        // Update user with Telegram ID if not already set
        if (!dbUser.telegramId) {
          dbUser = await storage.updateUserTelegramInfo(userId, {
            telegramId: telegramAccount.telegramUserId.toString(),
            telegramUsername: telegramAccount.telegramUsername || `tg_${telegramAccount.telegramUserId}`,
            isTelegramUser: true,
          });
          console.log(`✅ User ${userId} linked with Telegram ID ${telegramAccount.telegramUserId}`);
        }
      }
    }
    
    return dbUser;
  } catch (error) {
    console.error('Error upserting Privy user:', error);
    throw error;
  }
}

export async function PrivyAuthMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;

  // Allow Passport session as fallback if no Privy token provided
  if (!authHeader && req.isAuthenticated && req.isAuthenticated()) {
    // If a session is active, attach the user cartaints (existing user object) and proceed
    try {
      const sessionUser = req.user;
      if (sessionUser) {
        req.user = sessionUser;
        return next();
      }
    } catch (err) {
      console.error('Error using session-based auth fallback:', err);
      // fallthrough to token-based verification
    }
  }

  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header missing' });
  }

  try {
    const verifiedClaims = await verifyPrivyToken(token);

    const userId = verifiedClaims?.userId || verifiedClaims?.sub;
    if (!verifiedClaims || !userId) {
      return res.status(401).json({ message: 'Invalid token or user ID not found' });
    }

    const dbUser = await upsertPrivyUser(verifiedClaims);

    if (!dbUser) {
      return res.status(500).json({ message: 'Failed to create or retrieve user' });
    }

    // Attach user to request with proper structure for routes
    // Privy auth structure - set both id and claims for compatibility
    req.user = {
      id: dbUser.id,
      email: dbUser.email || '',
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      username: dbUser.username,
      isAdmin: dbUser.isAdmin || false,
      claims: {
        sub: dbUser.id,
        email: dbUser.email,
        first_name: dbUser.firstName,
        last_name: dbUser.lastName,
      }
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Internal server error during authentication' });
  }
}
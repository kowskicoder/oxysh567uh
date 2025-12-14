import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    try {
      const issuerUrl = process.env.ISSUER_URL ?? "https://replit.com/oidc";
      const replId = process.env.REPL_ID!;
      
      console.log("OIDC Configuration:");
      console.log("- Issuer URL:", issuerUrl);
      console.log("- REPL_ID:", replId);
      
      const config = await client.discovery(new URL(issuerUrl), replId);
      console.log("OIDC discovery successful");
      return config;
    } catch (error) {
      console.error("OIDC discovery failed:", error);
      throw error;
    }
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
      sameSite: 'lax',
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    try {
      const claims = tokens.claims();
      console.log("Token claims:", claims);
      
      if (!claims || !claims.sub) {
        console.error("Invalid claims - missing sub (user ID)");
        return verified(new Error("Invalid user claims"), null);
      }
      
      const user = {};
      updateUserSession(user, tokens);
      await upsertUser(claims);
      
      console.log("User authenticated successfully:", claims.sub);
      verified(null, user);
    } catch (error) {
      console.error("Error in verify function:", error);
      verified(error, null);
    }
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    console.log("Login request for hostname:", req.hostname);
    console.log("Available strategies:", Object.keys(passport._strategies || {}));
    
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    // Log the callback URL and parameters for debugging
    console.log("Callback URL:", req.url);
    console.log("Callback query:", req.query);
    console.log("Hostname:", req.hostname);
    
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, (err) => {
      if (err) {
        console.error("Authentication error:", err);
        console.error("Error details:", {
          message: err.message,
          stack: err.stack,
          code: err.code
        });
        
        // If it's an unknown_user_id error, try alternative approach
        if (err.message?.includes('unknown_user_id') || err.error === 'unknown_user_id') {
          console.log("Unknown user ID error - trying alternative authentication");
          // Clear any existing session and try again
          req.session.destroy(() => {
            return res.redirect('/api/login');
          });
          return;
        }
        
        return res.status(500).json({ 
          message: "Authentication failed", 
          error: err.message 
        });
      }
      next();
    });
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });

  // Debug route to check authentication state
  app.get("/api/debug/auth", (req, res) => {
    const sessionInfo = {
      sessionId: req.sessionID,
      isAuthenticated: req.isAuthenticated(),
      user: req.user ? {
        claims: req.user.claims,
        expires_at: req.user.expires_at,
        hasAccessToken: !!req.user.access_token,
        hasRefreshToken: !!req.user.refresh_token,
      } : null,
      session: req.session,
    };
    res.json(sessionInfo);
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

// Admin authentication middleware
export const isAdmin: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now > user.expires_at) {
    const refreshToken = user.refresh_token;
    if (!refreshToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const config = await getOidcConfig();
      const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
      updateUserSession(user, tokenResponse);
    } catch (error) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  }

  try {
    // Get user from database to check admin status
    const { db } = await import("./db");
    const { users } = await import("../shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.claims.sub)
    });

    if (!dbUser) {
      return res.status(401).json({ message: "User not found" });
    }

    // Check if user is admin
    if (!dbUser.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    return next();
  } catch (error) {
    console.error("Admin authentication error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

import { type Request, type Response } from "express";

// Simple test route to verify authentication setup
export function addAuthTestRoutes(app: any) {
  app.get("/api/test/auth-status", (req: Request, res: Response) => {
    res.json({
      isAuthenticated: req.isAuthenticated(),
      sessionId: req.sessionID,
      user: req.user ? {
        claims: req.user.claims,
        expires_at: req.user.expires_at,
      } : null,
      cookieSettings: req.session.cookie,
    });
  });

  app.get("/api/test/clear-session", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to clear session" });
      }
      res.json({ message: "Session cleared successfully" });
    });
  });
}
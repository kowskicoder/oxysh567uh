# Telegram Mini-App Rollout Guide

## Overview
Deployed a lightweight Telegram Mini-App for Bantah that shares the same database and backend as the main web app. Users can authenticate via Telegram's `initData` without Privy, or link existing accounts.

---

## Features Implemented

### 1. **Telegram-Only Authentication** ✅
- **Endpoint:** `POST /api/telegram/mini-app/auth`
- **Flow:**
  1. Mini-app extracts `initData` from Telegram WebApp
  2. Verifies signature using `TELEGRAM_BOT_TOKEN`
  3. Creates or finds user in DB (with `id: telegram_${telegramId}`)
  4. Creates Passport session (req.login)
- **Session Fallback:** Middleware now allows either Privy token OR Passport session

### 2. **Mini-App UI with Tabs** ✅
- **Location:** `/telegram-mini-app` route
- **Tabs:**
  - **Profile** → Username, bio (from `/api/profile`)
  - **Wallet** → Balance & coins (from `/api/wallet/balance`)
  - **Challenges** → Active challenges list (from `/api/challenges`)
- **Deep Links:** URL params `?tab=wallet`, `?tab=profile`, `?tab=challenges`

### 3. **Bot Command Integration** ✅
- `/start` → Quick access menu (Wallet, Profile, Challenges, Create)
- `/balance` → Wallet balance with "Add Funds" button
- `/mychallenges` → Active challenges count with "View All" button
- All buttons use `web_app` buttons that open mini-app with `?tab=X`

### 4. **Account Linking (Existing Flow)** ✅
- Users can still link Privy accounts to Telegram via the existing `/api/telegram/mini-app/link` endpoint
- Telegram users can optionally connect crypto wallets later

---

## Files Modified

### Server
- `server/privyAuth.ts` - Added Passport session fallback to `PrivyAuthMiddleware`
- `server/routes.ts` - Added `/api/telegram/mini-app/auth` and bot command handlers
- `server/telegramBot.ts` - Added helper methods: `sendQuickAccessMenu`, `sendBalanceNotification`, `sendChallengesNotification`

### Client
- `client/src/pages/TelegramMiniApp.tsx` - Refactored to support Telegram-only auth + tab UI

---

## Deployment Steps

### 1. **Environment Variables**
Ensure these are set:
```
TELEGRAM_BOT_TOKEN=<your-bot-token>
TELEGRAM_BOT_USERNAME=@your_bot_name
FRONTEND_URL=https://your-domain.com (or REPLIT_DOMAINS)
```

### 2. **Database**
No migrations needed. Uses existing `users` table with:
- `telegramId` (stores Telegram user ID)
- `isTelegramUser` (boolean flag)

### 3. **Bot Setup**
- Bot commands are auto-registered in the webhook handler
- Inline buttons use `web_app` to open mini-app URL
- No slash command polling changes needed

### 4. **Build & Deploy**
```bash
npm run build
npm start
```

---

## Testing Checklist

### Mini-App Auth Flow
- [ ] Open mini-app link in Telegram mobile app
- [ ] Verify `initData` is extracted correctly (check console)
- [ ] Confirm user is created with `telegram_${id}` format
- [ ] Verify tabs load data correctly

### Deep Linking
- [ ] Test `?tab=wallet` → Opens wallet tab
- [ ] Test `?tab=profile` → Opens profile tab
- [ ] Test `?tab=challenges` → Opens challenges tab

### Bot Commands
- [ ] `/start` → Shows quick access menu (for linked users)
- [ ] `/balance` → Shows balance with "Add Funds" button
- [ ] `/mychallenges` → Shows active challenges count

### Cross-Platform
- [ ] Telegram user can see same wallet balance on webapp (if logged in with same Telegram identity)
- [ ] Privy-linked users can still link Telegram account

---

## Known Limitations & Future Improvements

### Current Gaps
1. **No crypto features in mini-app** → Users must use webapp for full Privy/wallet flows
2. **Read-only challenges** → Can view but not create/accept challenges from mini-app (by design, to keep lightweight)
3. **No push notifications** → Mini-app polling only; full notifications on webapp

### Future Enhancements
- [ ] Challenge creation button in mini-app (if needed)
- [ ] Deposit/withdraw from mini-app wallet
- [ ] Telegram notifications for new challenges
- [ ] Leaderboard tab in mini-app
- [ ] Share challenge link to Telegram directly from mini-app

---

## Architecture Diagram

```
Telegram User
    ↓
/telegram-mini-app
    ├─ Extract initData
    ├─ POST /api/telegram/mini-app/auth
    ├─ Verify signature
    └─ Create Telegram user + Passport session
         ↓
    Access shared APIs:
    ├─ /api/profile
    ├─ /api/wallet/balance
    └─ /api/challenges
         ↓
    Same PostgreSQL DB ← Web app also uses this
```

---

## Rollback Plan

If issues arise:
1. Revert commits to `server/privyAuth.ts`, `server/routes.ts`, `server/telegramBot.ts`, `client/src/pages/TelegramMiniApp.tsx`
2. Update bot to remove new command handlers
3. Keep old `/telegram-mini-app` route serving an error message

---

## Support & Debugging

### Check Telegram initData validity:
```bash
curl -X POST http://localhost:3000/api/telegram/mini-app/auth \
  -H "Content-Type: application/json" \
  -d '{"initData": "..."}'
```

### Verify Passport session:
```bash
curl http://localhost:3000/api/auth/user (checks req.user)
```

### Bot webhook status:
Check `/api/telegram/status` for bot connection health.

---

## Ownership & Next Steps

- **Staging:** Deploy to staging env, test bot commands + mini-app
- **Production:** Merge to main, deploy, announce in Telegram channel
- **Monitor:** Check logs for auth failures, API errors

---

**Date Completed:** December 11, 2025  
**Status:** ✅ Ready for deployment

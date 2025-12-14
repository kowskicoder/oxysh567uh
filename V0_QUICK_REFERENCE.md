# V0.dev Quick Reference Card

## 🎯 QUICK COPY-PASTE PROMPTS

### STEP 1: TYPES & UTILS
```
Create TypeScript types and utility functions for a Telegram Mini-App.

Requirements:
1. Define interfaces:
   - TelegramUser (id, username, firstName, balance, coins, level, xp)
   - UserProfile (extends TelegramUser, includes stats)
   - WalletData (balance, coins, currency, transactions)
   - EventData (id, title, category, entryFee, participants, yesVotes, noVotes)
   - ChallengeData (id, title, wagerAmount, status, creator, acceptor)
   - LeaderboardEntry (rank, username, level, points, xp)

2. Create utility functions:
   - formatBalance(amount: number): string - Format NGN amounts with ₦ symbol
   - formatCoinBalance(coins: number): string - Format coins
   - truncateUsername(username: string, length: number): string
   - getTimeRemaining(deadline: Date): string
   - getCategoryColor(category: string): string

3. Export all from single file

Use TypeScript with full type safety.
```

**Save as**: `src/types/index.ts` + `src/utils/format.ts`

---

### STEP 2: API CLIENT
```
Create an API client service for a Telegram Mini-App.

Requirements:
1. Use axios with:
   - baseURL: process.env.VITE_API_URL || 'http://localhost:5000'
   - timeout: 10000
   - Request interceptor adding X-Telegram-Init-Data header

2. Create functions:
   - authenticateUser(initData: string)
   - getWallet()
   - getEvents(limit, offset)
   - getEventDetails(eventId)
   - getChallenges()
   - getLeaderboard(limit)
   - getUserProfile()
   - getAchievements()

3. Export apiClient and all functions

Include error handling and TypeScript types.
```

**Save as**: `src/services/api.ts`

---

### STEP 3: TELEGRAM HOOKS
```
Create React hooks for Telegram Mini-App initialization.

Requirements:
1. useTelegram() hook:
   - Retrieves launch parameters
   - Extracts initData
   - Extracts user
   - Returns: { initData, user, startParam, isLoading, error }

2. useWebApp() hook:
   - Gets WebApp instance
   - Expands app to fullscreen
   - Sets dark background
   - Returns WebApp instance

3. useAuth() hook:
   - Uses useTelegram()
   - Calls authenticateUser API
   - Stores initData in localStorage
   - Returns: { user, isLoading, error, isAuthenticated }

Export all hooks. Use TypeScript.
```

**Save as**: `src/hooks/useTelegram.ts` + `src/hooks/useAuth.ts`

---

### STEP 4: LAYOUT & NAVIGATION
```
Create main layout with bottom tab navigation.

Requirements:
1. Layout component:
   - Takes children prop
   - Header with logo/user info
   - Bottom nav with 4 tabs
   - Mobile safe areas
   - Dark theme

2. Tabs: Wallet (💰), Events (🎯), Challenges (🥊), Profile (👤)

3. BottomNavigation component:
   - Tab switching with onClick
   - Active tab indicator
   - React Router integration
   - Smooth transitions

4. Header component:
   - App title "Bantah"
   - User info on right (if logged in)
   - Sticky top
   - Dark background

5. Styling:
   - Mobile-first (320px minimum)
   - Dark theme (#0F1419)
   - Orange accent (#FF6B35)
   - Tailwind CSS

Output: Layout.tsx, Header.tsx, BottomNavigation.tsx
```

**Save as**: `src/components/Layout.tsx`, `src/components/Navbar.tsx`, `src/components/BottomNavigation.tsx`

---

### STEP 5: WALLET PAGE
```
Create Wallet page with components.

Requirements:
1. BalanceCard:
   - Large balance display with ₦
   - Separate coins display
   - Currency toggle
   - Update timestamp
   - Gradient background

2. TransactionItem:
   - Transaction type
   - Amount (color-coded)
   - Description
   - Date/time
   - Status badge

3. TransactionList:
   - Maps transactions
   - "No transactions" empty state
   - Scrollable
   - React Query integration

4. ActionButtons:
   - Deposit button
   - Withdraw button
   - Request funds button

5. WalletPage component:
   - useQuery for wallet data
   - Loading skeleton
   - Error message
   - All components together
   - Refresh button

Use React Query, Tailwind, dark theme, TypeScript.
```

**Save as**: `src/pages/Wallet.tsx`, `src/components/Cards/BalanceCard.tsx`, `src/components/Cards/TransactionItem.tsx`

---

### STEP 6: EVENTS PAGE
```
Create Events browsing page.

Requirements:
1. EventCard:
   - Title with category badge
   - Entry fee
   - Participant count
   - YES/NO vote bars with percentages
   - Time remaining
   - "Join Event" button
   - Hover effects

2. EventFilter:
   - Category dropdown
   - Status filter
   - Clear button

3. EventDetailModal:
   - Full description
   - Pool statistics
   - YES/NO breakdown
   - Creator info
   - Entry fee confirmation
   - "Place Prediction" button

4. PredictionSelector:
   - YES and NO buttons
   - Selected state
   - Returns boolean

5. EventsPage:
   - useQuery for events
   - Pagination (load more)
   - Filter functionality
   - EventCard mapping
   - Modal on click
   - Loading skeleton
   - Error state
   - Pull-to-refresh

Use React Query, Tailwind, dark theme, TypeScript. Include category colors.
```

**Save as**: `src/pages/Events.tsx`, `src/components/Cards/EventCard.tsx`, `src/components/Modals/EventDetailModal.tsx`

---

### STEP 7: CHALLENGES PAGE
```
Create Challenges page.

Requirements:
1. ChallengeCard:
   - Title and description
   - Wager amount (₦)
   - Creator name
   - Status badge (pending/matched/completed)
   - Deadline
   - Status-coded colors

2. CreateChallengeForm:
   - Title input
   - Description textarea
   - Category dropdown
   - Wager amount (check balance)
   - Deadline picker
   - Submit/Cancel buttons
   - Validation with errors

3. ChallengeDetailModal:
   - Challenge details
   - Creator/acceptor info
   - Wager confirmation
   - Status timeline
   - Action buttons (Accept/Decline)

4. ChallengesList:
   - Created and Accepted sections
   - ChallengeCard mapping
   - Empty state
   - Filter by status

5. ChallengesPage:
   - useQuery for challenges
   - "Create Challenge" button
   - ChallengesList
   - Form modal
   - Detail modal
   - Loading/error states

Use React Query, Tailwind, dark theme, TypeScript. Include form validation.
```

**Save as**: `src/pages/Challenges.tsx`, `src/components/Cards/ChallengeCard.tsx`, `src/components/Modals/ChallengeDetailModal.tsx`

---

### STEP 8: PROFILE & LEADERBOARD
```
Create Profile and Leaderboard pages.

Requirements:
1. StatBlock:
   - Icon/emoji
   - Label
   - Large value
   - Optional subtext
   - Card container

2. ProfileHeader:
   - Profile image/avatar
   - Username with @
   - Level badge (large, colorful)
   - XP progress bar

3. StatsSection:
   - Grid layout: Level, XP bar, Points, Streak, Challenges
   - Uses StatBlock
   - Color-coded

4. AchievementGrid:
   - 6-8 badges
   - Icon/emoji, name, completion %
   - Locked in gray
   - Tooltip on hover

5. ProfilePage:
   - useAuth hook
   - useQuery for stats/achievements
   - ProfileHeader
   - StatsSection
   - AchievementGrid
   - Settings button
   - Loading skeleton

6. LeaderboardItem:
   - Rank (large)
   - Username
   - Avatar
   - Points
   - Level badge
   - Highlight current user
   - Top 3 special styling

7. LeaderboardPage:
   - useQuery for leaderboard
   - Top 50 users
   - Highlight user position
   - Pull-to-refresh
   - Search/filter optional
   - LeaderboardItem mapping

Use React Query, Tailwind, dark theme, TypeScript.
```

**Save as**: `src/pages/Profile.tsx`, `src/pages/Leaderboard.tsx`

---

### STEP 9: MAIN APP
```
Create main App component with routing.

Requirements:
1. App.tsx:
   - Telegram SDK initialization
   - useAuth hook for authentication
   - React Router with routes:
     * / (home/dashboard)
     * /wallet
     * /events
     * /challenges
     * /profile
     * /leaderboard
   - Layout component wrapper
   - Loading screen during auth
   - Error screen if auth fails
   - Redirect if not authenticated
   - Handle deep links (?startapp=event_123)

2. Dashboard page:
   - Welcome message with username
   - Quick stats cards (balance, level, challenges)
   - Featured events (top 3)
   - Recent activity list
   - Quick action buttons

3. QueryClientProvider:
   - Wrap entire app
   - 5min staleTime, 10min gcTime

4. Theming:
   - Tailwind dark theme
   - Colors: Dark (#0F1419), Accent (#FF6B35)

Use React Router, React Query, TypeScript, Tailwind.
Include error boundaries.
```

**Save as**: `src/App.tsx`, `src/pages/Home.tsx`

---

## 📋 SAVE FILE LOCATIONS

| Step | Component | Save Path |
|------|-----------|-----------|
| 1 | Types | `src/types/index.ts` |
| 1 | Utils | `src/utils/format.ts` |
| 2 | API Client | `src/services/api.ts` |
| 3 | Telegram Hooks | `src/hooks/useTelegram.ts` |
| 3 | Auth Hook | `src/hooks/useAuth.ts` |
| 4 | Layout | `src/components/Layout.tsx` |
| 4 | Header | `src/components/Navbar.tsx` |
| 4 | BottomNav | `src/components/BottomNavigation.tsx` |
| 5 | Wallet Page | `src/pages/Wallet.tsx` |
| 5 | Balance Card | `src/components/Cards/BalanceCard.tsx` |
| 5 | Transaction Item | `src/components/Cards/TransactionItem.tsx` |
| 6 | Events Page | `src/pages/Events.tsx` |
| 6 | Event Card | `src/components/Cards/EventCard.tsx` |
| 6 | Event Modal | `src/components/Modals/EventDetailModal.tsx` |
| 7 | Challenges Page | `src/pages/Challenges.tsx` |
| 7 | Challenge Card | `src/components/Cards/ChallengeCard.tsx` |
| 7 | Challenge Modal | `src/components/Modals/ChallengeDetailModal.tsx` |
| 8 | Profile Page | `src/pages/Profile.tsx` |
| 8 | Leaderboard Page | `src/pages/Leaderboard.tsx` |
| 9 | App | `src/App.tsx` |
| 9 | Home/Dashboard | `src/pages/Home.tsx` |

---

## 🔧 STEP 10: MANUAL CONFIG FILES

Create these files manually:

### `.env`
```
VITE_API_URL=http://localhost:5000
VITE_TELEGRAM_BOT_USERNAME=@bantah_bot
```

### `vite.config.ts` (update)
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
```

### `tailwind.config.ts` (update)
```typescript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B35',
        secondary: '#004E89',
        dark: '#0F1419',
        surface: '#1A1F2E',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}
```

---

## ✅ CHECKLIST

- [ ] STEP 0: Project setup + npm install + npm run dev
- [ ] STEP 1: Types & Utils (v0)
- [ ] STEP 2: API Client (v0)
- [ ] STEP 3: Telegram Hooks (v0)
- [ ] STEP 4: Layout & Navigation (v0)
- [ ] STEP 5: Wallet Page (v0)
- [ ] STEP 6: Events Page (v0)
- [ ] STEP 7: Challenges Page (v0)
- [ ] STEP 8: Profile & Leaderboard (v0)
- [ ] STEP 9: Main App (v0)
- [ ] STEP 10: Config files (manual)
- [ ] Test app at http://localhost:5173
- [ ] Connect backend (set VITE_API_URL correctly)
- [ ] Test auth flow
- [ ] Test wallet, events, challenges
- [ ] Deploy to Telegram

---

## 🎯 TOTAL TIME: ~70 minutes

Keep this card handy while building!


# V0.dev - Telegram Mini-App Build Guide (Step-by-Step)

**Project**: Bantah Telegram Mini-App  
**Building With**: v0.dev (Generative UI)  
**Target**: React + TypeScript  
**Total Steps**: 8 phases

---

## ✅ STEP 0: PROJECT SETUP (Do this FIRST in your terminal)

Before going to v0, create the project structure:

```bash
# Create new Vite React project
npm create vite@latest telegram-mini-app -- --template react-ts
cd telegram-mini-app

# Install dependencies
npm install
npm install @telegram-apps/sdk @telegram-apps/sdk-react @telegram-apps/ui-react @telegram-apps/signals-react
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install zustand axios
npm install recharts
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Create folder structure
mkdir -p src/components/Cards src/components/Modals src/pages src/hooks src/context src/services src/store src/types src/utils

# Start dev server
npm run dev
```

**Result**: You'll have a React + TypeScript project running on http://localhost:5173

---

## 🎯 STEP 1: CREATE TYPES & UTILS (Paste into v0)

**In v0.dev**, create a new file generation with this prompt:

```
Create TypeScript types and utility functions for a Telegram Mini-App.

Requirements:
1. Define these interfaces:
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
   - getTimeRemaining(deadline: Date): string - Calculate time until deadline
   - getCategoryColor(category: string): string - Return color for category badge

3. Export all from single file for easy importing

Use TypeScript with full type safety.
```

**Expected Output**: A file with types and utilities - save it as `src/types/index.ts` and `src/utils/format.ts`

---

## 🔌 STEP 2: CREATE API CLIENT (Paste into v0)

**Prompt for v0.dev**:

```
Create an API client service for a Telegram Mini-App that connects to a backend API.

Requirements:
1. Use axios for HTTP requests
2. Create apiClient instance with:
   - baseURL: process.env.VITE_API_URL || 'http://localhost:5000'
   - timeout: 10000
   - Request interceptor that adds X-Telegram-Init-Data header from localStorage

3. Create async functions:
   - authenticateUser(initData: string): Promise<{ok: boolean, user: any}>
   - getWallet(): Promise<{ok: boolean, wallet: any, recentTransactions: any[]}>
   - getEvents(limit: number = 20, offset: number = 0): Promise<{ok: boolean, events: any[]}>
   - getEventDetails(eventId: number): Promise<{ok: boolean, event: any, stats: any}>
   - getChallenges(): Promise<{ok: boolean, created: any[], accepted: any[]}>
   - getLeaderboard(limit: number = 50): Promise<{ok: boolean, leaderboard: any[]}>
   - getUserProfile(): Promise<{ok: boolean, user: any, stats: any}>
   - getAchievements(): Promise<{ok: boolean, profile: any, stats: any}>

4. Export apiClient and all functions

Include proper error handling and TypeScript types for all responses.
```

**Save as**: `src/services/api.ts`

---

## 🔐 STEP 3: TELEGRAM SDK SETUP (Paste into v0)

**Prompt for v0.dev**:

```
Create a React hook for Telegram Mini-App initialization.

Requirements:
1. Use @telegram-apps/sdk-react library
2. Create useTelegram() hook that:
   - Retrieves launch parameters using retrieveLaunchParams()
   - Extracts initData from launch params
   - Extracts user from initData.user
   - Returns: { initData, user, startParam, isLoading, error }

3. Create useWebApp() hook that:
   - Gets Telegram.WebApp instance
   - Expands app to fullscreen
   - Sets background color to dark
   - Enables closing confirmation if needed
   - Returns WebApp instance for use in components

4. Create useAuth() hook that:
   - Uses useTelegram() to get initData
   - Calls authenticateUser API on mount
   - Stores initData in localStorage
   - Returns: { user, isLoading, error, isAuthenticated }

5. Export all hooks from single file

Use TypeScript with proper typing.
```

**Save as**: `src/hooks/useTelegram.ts` and `src/hooks/useAuth.ts`

---

## 🎨 STEP 4: LAYOUT & NAVIGATION (Paste into v0)

**Prompt for v0.dev**:

```
Create the main layout component for a Telegram Mini-App with bottom tab navigation.

Requirements:
1. Main Layout component that:
   - Takes children as prop
   - Has header with logo/title and user info
   - Has bottom navigation with 4 tabs (icons + labels)
   - Padding accounts for mobile safe areas
   - Dark theme with gradient background

2. Bottom tabs:
   - Wallet (💰 icon)
   - Events (🎯 icon)  
   - Challenges (🥊 icon)
   - Profile (👤 icon)

3. Tab Navigation component that:
   - Shows active tab indicator
   - Handles tab switching with onClick
   - Uses React Router for navigation
   - Smooth transitions between tabs

4. Header component that:
   - Shows app title "Bantah"
   - Shows user level and username on right (if logged in)
   - Sticky to top
   - Dark background

5. Styling:
   - Mobile-first (320px minimum)
   - Dark theme (#0F1419 background)
   - Orange accent (#FF6B35) for active tabs
   - Tailwind CSS

Output: BottomNavigation.tsx, Header.tsx, Layout.tsx
```

**Save as**: `src/components/Layout.tsx`, `src/components/Navbar.tsx`, `src/components/BottomNavigation.tsx`

---

## 💰 STEP 5: WALLET COMPONENTS (Paste into v0)

**Prompt for v0.dev**:

```
Create Wallet page and components for a Telegram Mini-App.

Requirements:
1. BalanceCard component:
   - Display large balance number with ₦ symbol
   - Show coins separate from NGN balance
   - Currency toggle button
   - Update badge (last updated timestamp)
   - Card-style with gradient background

2. TransactionItem component:
   - Shows transaction type (deposit, bet, win, loss)
   - Amount with color (green for deposits/wins, red for bets/losses)
   - Description
   - Date and time
   - Status badge (completed, pending)

3. TransactionList component:
   - Maps over transaction array
   - Shows "No transactions" if empty
   - Scrollable list
   - React Query integration for auto-refresh

4. ActionButtons component:
   - Deposit button (opens payment flow)
   - Withdraw button (if available)
   - Request funds button
   - Proper spacing and sizing

5. Wallet page component that:
   - Uses useQuery hook for wallet data
   - Shows loading skeleton if loading
   - Shows error message if error
   - Displays all components together
   - Refresh button with loading state

Use React Query for data fetching, Tailwind CSS for styling, dark theme.
Include proper TypeScript types.
```

**Save as**: `src/pages/Wallet.tsx`, `src/components/Cards/BalanceCard.tsx`, `src/components/Cards/TransactionItem.tsx`

---

## 🎯 STEP 6: EVENTS COMPONENTS (Paste into v0)

**Prompt for v0.dev**:

```
Create Events browsing page and components for a Telegram Mini-App.

Requirements:
1. EventCard component:
   - Title with category badge (Crypto, Sports, Gaming, Music, Politics)
   - Entry fee display
   - Participant count
   - YES/NO vote bars (showing percentages)
   - Time remaining until deadline
   - "Join Event" button
   - Hover effects

2. EventFilter component:
   - Filter by category dropdown
   - Filter by status (active, pending, completed)
   - Clear filters button
   - Mobile-friendly design

3. EventDetailModal component:
   - Full event description
   - Current pool statistics (detailed)
   - YES/NO vote breakdown with percentages
   - Creator info
   - Entry fee confirmation
   - Large "Place Prediction" button with prediction selector
   - Close button

4. PredictionSelector component:
   - Two large buttons: YES and NO
   - Selected state with highlight
   - Returns boolean

5. EventsPage component that:
   - Uses useQuery for events list
   - Implements pagination (load more button)
   - Filter functionality
   - Maps over events to show EventCards
   - Opens EventDetailModal on card click
   - Shows loading skeleton during load
   - Shows error state
   - Pull-to-refresh capability (optional)

Use React Query, Tailwind CSS, dark theme, TypeScript.
Include category colors and proper styling.
```

**Save as**: `src/pages/Events.tsx`, `src/components/Cards/EventCard.tsx`, `src/components/Modals/EventDetailModal.tsx`

---

## 🥊 STEP 7: CHALLENGES COMPONENTS (Paste into v0)

**Prompt for v0.dev**:

```
Create Challenges page and components for a Telegram Mini-App.

Requirements:
1. ChallengeCard component:
   - Title and description
   - Wager amount with ₦ symbol
   - Creator name
   - Status badge (pending, matched, in_progress, completed)
   - Deadline/time remaining
   - Color-coded by status (yellow=pending, green=matched, blue=in_progress, gray=completed)

2. CreateChallengeForm component:
   - Form fields:
     * Title (text input, required)
     * Description (textarea, required)
     * Category dropdown (Gaming, Sports, Crypto, Skills, Other)
     * Wager amount (number input, required, must be ≤ user balance)
     * Deadline (date/time picker, optional)
   - Submit button
   - Cancel button
   - Form validation with error messages
   - Balance check - show if insufficient

3. ChallengeDetailModal component:
   - Challenge full details
   - Creator and acceptor info
   - Wager amount confirmation
   - Current status with timeline
   - Action buttons based on status:
     * If pending: "Accept Challenge" and "Decline"
     * If matched: Show opponent info
   - Evidence submission (if applicable)

4. ChallengesList component:
   - Separate sections: "Created" and "Accepted"
   - Maps ChallengeCard components
   - Shows empty state if none
   - Filter by status

5. ChallengesPage component that:
   - Uses useQuery for challenges data
   - Shows "Create Challenge" button in header
   - ChallengesList showing created and accepted
   - CreateChallengeForm modal (toggle with button)
   - ChallengeDetailModal on card click
   - Loading and error states
   - React Query integration

Use React Query, Tailwind CSS, dark theme, TypeScript.
Include proper form validation.
```

**Save as**: `src/pages/Challenges.tsx`, `src/components/Cards/ChallengeCard.tsx`, `src/components/Modals/ChallengeDetailModal.tsx`

---

## 👤 STEP 8: PROFILE & LEADERBOARD (Paste into v0)

**Prompt for v0.dev**:

```
Create Profile and Leaderboard pages for a Telegram Mini-App.

Requirements:
1. StatBlock component:
   - Icon/emoji
   - Label
   - Large value
   - Optional subtext
   - Card-style container

2. ProfileHeader component:
   - Profile image (avatar or placeholder)
   - Username with @ symbol
   - Level badge (large, colorful)
   - XP progress bar toward next level

3. StatsSection component:
   - Grid layout showing:
     * Level
     * XP (with progress bar)
     * Points
     * Streak
     * Total challenges participated
   - Uses StatBlock component
   - Color-coded based on value

4. AchievementGrid component:
   - Shows 6-8 achievement badges
   - Each shows: icon/emoji, name, completion %
   - Locked achievements shown in gray
   - Tooltip on hover showing description

5. ProfilePage component that:
   - Uses useAuth hook for current user
   - Uses useQuery for user stats and achievements
   - Displays ProfileHeader
   - Displays StatsSection
   - Displays AchievementGrid
   - Settings button (for future)
   - Loading skeleton
   - Error state

6. LeaderboardItem component:
   - Rank number (large)
   - Username
   - Avatar/placeholder
   - Points
   - Level badge
   - Highlight current user row
   - Different styling for top 3 (gold, silver, bronze)

7. LeaderboardPage component that:
   - Uses useQuery for leaderboard data
   - Shows top 50 users
   - Highlights current user's position
   - Pull-to-refresh
   - Search/filter by username (optional)
   - Loading state
   - Maps LeaderboardItem components

Use React Query, Tailwind CSS, dark theme, TypeScript.
Include proper icons/emojis for achievements.
```

**Save as**: `src/pages/Profile.tsx`, `src/pages/Leaderboard.tsx`

---

## 🏗️ STEP 9: MAIN APP SETUP (Paste into v0)

**Prompt for v0.dev**:

```
Create the main App component and routing for a Telegram Mini-App.

Requirements:
1. App.tsx should:
   - Use Telegram SDK to initialize app
   - Use useAuth hook for authentication
   - Implement React Router with these routes:
     * / (home/dashboard)
     * /wallet
     * /events
     * /challenges
     * /profile
     * /leaderboard
   - Use Layout component as wrapper
   - Show loading screen during auth
   - Show error screen if auth fails
   - Redirect to / if not authenticated
   - Handle deep links from Telegram (e.g., ?startapp=event_123)

2. Main Dashboard page that:
   - Shows welcome message with user name
   - Quick stats cards (balance, level, active challenges)
   - Featured events section (top 3)
   - Recent activity list
   - Quick action buttons

3. QueryClientProvider setup:
   - Wrap entire app
   - Configure with sensible defaults (5min staleTime)

4. Theming:
   - Tailwind dark theme throughout
   - Color scheme: Dark (#0F1419), Accent (#FF6B35)

Use React Router, React Query, TypeScript, Tailwind CSS.
Include error boundaries.
```

**Save as**: `src/App.tsx`, `src/pages/Home.tsx`

---

## 🌍 STEP 10: ENVIRONMENT & CONFIG (Do Manually)

Create these files in your project root:

**.env**:
```
VITE_API_URL=http://localhost:5000
VITE_TELEGRAM_BOT_USERNAME=@bantah_bot
```

**vite.config.ts** (update):
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

**tailwind.config.ts**:
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
      backgroundColor: {
        dark: '#0F1419',
      }
    },
  },
  darkMode: 'class',
  plugins: [],
}
```

---

## 🚀 EXECUTION ORDER

Follow this exact order:

1. ✅ **STEP 0**: Project setup in terminal (npm create, install deps)
2. ✅ **STEP 1**: Types & Utils (go to v0, paste prompt, save outputs)
3. ✅ **STEP 2**: API Client (paste prompt to v0, save)
4. ✅ **STEP 3**: Telegram hooks (paste prompt to v0, save)
5. ✅ **STEP 4**: Layout & Navigation (paste prompt to v0, save)
6. ✅ **STEP 5**: Wallet page (paste prompt to v0, save)
7. ✅ **STEP 6**: Events page (paste prompt to v0, save)
8. ✅ **STEP 7**: Challenges page (paste prompt to v0, save)
9. ✅ **STEP 8**: Profile & Leaderboard (paste prompt to v0, save)
10. ✅ **STEP 9**: Main App & Routing (paste prompt to v0, save)
11. ✅ **STEP 10**: Environment & Config (do manually)

---

## 💡 TIPS FOR V0.DEV

1. **Copy-paste entire prompts as-is** - v0 works best with detailed requirements
2. **One component per generation** - Break larger prompts if needed
3. **Check generated code** - Review and adjust styling/colors as needed
4. **Import paths** - v0 might not get all imports right, fix them manually
5. **TypeScript** - Explicitly mention TypeScript types in prompts
6. **Dark theme** - Specify Tailwind dark mode in prompts
7. **Icons** - Use emoji or text labels, not icon libraries
8. **React Query** - v0 understands React Query, use it in prompts
9. **Responsive** - Mention "mobile-first" and "responsive" in prompts
10. **Preview** - Test each component as you build

---

## 📦 FINAL STRUCTURE

After following all steps, your `src/` will look like:

```
src/
├── components/
│   ├── Layout.tsx
│   ├── Navbar.tsx
│   ├── BottomNavigation.tsx
│   ├── Cards/
│   │   ├── BalanceCard.tsx
│   │   ├── EventCard.tsx
│   │   ├── ChallengeCard.tsx
│   │   ├── TransactionItem.tsx
│   │   └── LeaderboardItem.tsx
│   └── Modals/
│       ├── EventDetailModal.tsx
│       └── ChallengeDetailModal.tsx
├── pages/
│   ├── Home.tsx
│   ├── Wallet.tsx
│   ├── Events.tsx
│   ├── Challenges.tsx
│   ├── Profile.tsx
│   └── Leaderboard.tsx
├── hooks/
│   ├── useTelegram.ts
│   └── useAuth.ts
├── services/
│   └── api.ts
├── types/
│   └── index.ts
├── utils/
│   └── format.ts
├── App.tsx
└── main.tsx
```

---

## ✅ WHAT TO DO NOW

1. Run **STEP 0** in your terminal to set up the project
2. Then come back and I'll guide you through **STEP 1** with v0

Ready? Start with STEP 0! 🚀


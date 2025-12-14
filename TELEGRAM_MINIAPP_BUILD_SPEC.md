# Bantah Telegram Mini-App - Complete Build Specification & Prompt

## Project Overview

**Bantah** is a social betting and peer-to-peer challenge platform. The Telegram mini-app is the mobile-first frontend that allows users to participate in all Bantah features directly within Telegram. This is a **standalone React application** that connects to the backend API at `https://your-api-domain.com`.

### Key Statistics
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite 5+
- **UI Library**: @telegram-apps/ui-react v0.3.0 (official Telegram UI Kit)
- **SDK**: @telegram-apps/sdk v0.21.5 (official Telegram Mini-App SDK)
- **State Management**: TanStack Query (React Query) for data fetching
- **Target**: Telegram Mini-App (mobile-optimized)
- **Deployment**: Separate domain or CDN

---

## Architecture & User Flow

### Authentication Flow
1. **Telegram Verification**: User opens mini-app in Telegram
2. **initData Extraction**: App extracts `initData` from Telegram's `WebApp.initData`
3. **Backend Verification**: Send `initData` to `/api/telegram/mini-app/auth`
4. **Auto User Creation**: Backend creates user if doesn't exist, returns user data
5. **Session Stored**: Store user data in React Context/Zustand
6. **Persistent Header**: Send auth token in `X-Telegram-Init-Data` header for all API calls

### Navigation Structure
```
├── Home/Dashboard
│   ├── Quick Stats (Balance, Level, Streak)
│   ├── Featured Events
│   └── Recent Activity
├── Wallet (Tab 1)
│   ├── Balance Display
│   ├── Deposit Button
│   ├── Transaction History
│   └── Withdraw (if applicable)
├── Events (Tab 2)
│   ├── Browse Events
│   ├── Filter by Category (Crypto, Sports, Gaming, Music, Politics)
│   ├── Join Event
│   └── Event Details Modal
├── Challenges (Tab 3)
│   ├── My Challenges (Created & Accepted)
│   ├── Create New Challenge
│   ├── Challenge Details
│   └── Accept Challenge
├── Profile (Tab 4)
│   ├── User Stats (Level, XP, Points)
│   ├── Achievements
│   ├── Leaderboard Rank
│   └── Settings
└── Leaderboard
    ├── Global Rankings
    ├── Filter by timeframe
    └── Compare with friends
```

---

## Features & Functionality

### 1. **Wallet System**
**Purpose**: Manage user's balance and coins

**Functionality**:
- Display current balance (NGN currency)
- Display coins balance (platform currency for Telegram)
- Recent transactions (last 10)
- Deposit button (opens Paystack payment)
- Transaction history with types: deposit, withdrawal, bet_placed, challenge_won, challenge_lost
- Real-time balance updates

**UI Components**:
- Balance card with large number display
- Currency toggle (NGN ↔ Coins)
- Transaction list with date, amount, type, status
- Action buttons (Deposit, Withdraw)

**API Endpoints**:
- `GET /api/telegram/mini-app/wallet` - Get wallet info
- `POST /api/telegram/mini-app/deposit` - Initiate deposit
- Existing: `POST /api/wallet/verify-payment` (Paystack webhook)

---

### 2. **Events System**
**Purpose**: Browse and participate in prediction events

**Features**:
- **Browse Events**: List all active/upcoming events with pagination
- **Filter**: By category, status, entry fee range
- **Event Details**: Full description, deadline, current pool stats
- **Join Event**: Select YES/NO prediction and submit
- **Pool Display**: Real-time YES/NO vote counts and percentages
- **Status Tracking**: Pending, active, completed, cancelled

**Event Categories**:
- Crypto (Bitcoin, Ethereum predictions)
- Sports (Football, Basketball, etc.)
- Gaming (Esports matches, in-game events)
- Music (Award shows, chart rankings)
- Politics (Election outcomes, announcements)

**UI Components**:
- Event cards with title, category badge, entry fee, deadline
- Pool visualization (pie chart or bar graph)
- Event detail modal/page
- Prediction selector (big YES/NO buttons)
- Confirmation dialog before submitting

**API Endpoints**:
- `GET /api/telegram/mini-app/events?limit=20&offset=0` - List events
- `GET /api/telegram/mini-app/events/:eventId` - Event details
- Existing: `POST /api/events/:id/join` - Join event with prediction
- Existing: `POST /api/events/:id/leave` - Leave event

---

### 3. **Challenges System**
**Purpose**: Direct peer-to-peer betting between users

**Features**:
- **Create Challenge**: Specify opponent, wager, description, category
- **Accept Challenge**: View and accept incoming challenges
- **Challenge States**: Pending, matched, in_progress, completed, disputed
- **My Challenges**: Tab showing created and accepted challenges
- **Evidence Support**: Upload proof/evidence when challenge completes
- **Dispute Management**: Report if results are inaccurate

**Challenge Details Screen**:
- Challenge title and description
- Wager amount
- Creator and opponent info
- Current status
- Deadline/time remaining
- Actions (Accept, Decline, Submit Evidence, Report)

**UI Components**:
- Challenge cards with status badge
- Challenge creation form
- Challenge detail modal
- Challenge status timeline
- Evidence upload interface

**API Endpoints**:
- `GET /api/telegram/mini-app/challenges` - List user's challenges
- `POST /api/telegram/mini-app/challenges/create` - Create new challenge
- `POST /api/telegram/mini-app/challenges/:challengeId/accept` - Accept challenge
- Existing: `PUT /api/challenges/:id` - Update challenge
- Existing: `POST /api/challenges/:id/messages` - Challenge chat

---

### 4. **Profile & Gamification**
**Purpose**: Track user progress and achievements

**Profile Information**:
- Username and profile image
- Level (1-100+)
- Experience Points (XP)
- Platform Points
- Win streak counter
- Join date

**Achievements System**:
- 50+ achievement types
- Display earned and progress toward locked achievements
- Achievement categories: Betting, Challenges, Social, Milestones

**Statistics**:
- Total events participated
- Total challenges (created & accepted)
- Win/loss ratio
- Highest multiplier
- Total winnings/losses

**Leaderboard**:
- Global rankings by points
- Top 100 users
- User's rank and progress to next tier
- Compare with friends

**API Endpoints**:
- `GET /api/telegram/mini-app/user` - Get user profile
- `GET /api/telegram/mini-app/achievements` - Get achievements
- `GET /api/telegram/mini-app/stats` - Get statistics
- `GET /api/telegram/mini-app/leaderboard?limit=50` - Global leaderboard

---

### 5. **Real-Time Features**
**Purpose**: Live updates and responsiveness

**Features**:
- Live pool updates (YES/NO counts)
- Notification badges (new events, challenge requests)
- Real-time balance sync after transactions
- Typing indicators in challenge chat
- Join/leave activity notifications

**Implementation**:
- TanStack Query for automatic refetching
- WebSocket for real-time updates (optional enhancement)
- Polling fallback for compatibility

---

## Design System

### Color Palette
- **Primary**: #FF6B35 (Orange - CTA buttons)
- **Secondary**: #004E89 (Dark Blue - Headers)
- **Success**: #2ECC71 (Green - Wins, positive actions)
- **Warning**: #F39C12 (Orange - Pending, warnings)
- **Danger**: #E74C3C (Red - Losses, errors)
- **Background**: #0F1419 (Very dark blue/black)
- **Surface**: #1A1F2E (Dark surface)
- **Text**: #FFFFFF (White) / #B0B5C3 (Light gray)

### Typography
- **Headers**: 18-24px, Bold (weight 700)
- **Body**: 14-16px, Regular (weight 400)
- **Small**: 12-13px, Regular (weight 400)
- **Mono**: 12-14px for amounts/numbers

### Spacing
- Mobile-first design
- Safe area insets for notches
- Bottom padding for Telegram action button
- Compact on mobile, generous on tablet

### Components to Build
1. **BottomTab Navigation** - 4-5 tabs at bottom
2. **Balance Card** - Large display with currency
3. **EventCard** - Compact event listing
4. **ChallengeCard** - Compact challenge listing
5. **PoolVisualization** - YES/NO stats display
6. **LeaderboardItem** - Rank, user, points
7. **TransactionItem** - Transaction history row
8. **Modal/Drawer** - Event/Challenge details
9. **AchievementBadge** - Achievement icon + progress
10. **StatBlock** - Single stat display (Level, XP, etc)

---

## API Integration Details

### Authentication
**Every API request must include**:
```
Header: X-Telegram-Init-Data: <initData string from Telegram>
```

**First call** (during app load):
```javascript
POST /api/telegram/mini-app/auth
Body: {
  initData: "<Telegram initData>"
}
Response: {
  ok: true,
  user: {
    id: "uuid",
    telegramId: "123456789",
    username: "john_doe",
    firstName: "John",
    balance: 5000.00,
    coins: 1500,
    level: 5,
    xp: 1200,
    profileImageUrl: "https://..."
  },
  timestamp: 1702340000000
}
```

### Base URL
- Replace `<API_URL>` with environment variable
- Example: `https://api.bantah.com` or `https://your-replit-domain.replit.dev`

### Error Handling
All responses follow this pattern:
```javascript
{
  ok: false,
  error: "Error message"
}
```

Standard HTTP status codes:
- 200: Success
- 400: Bad request (missing fields)
- 401: Unauthorized (invalid auth)
- 404: Not found (resource doesn't exist)
- 500: Server error

### Rate Limiting
- 100 requests per minute per user
- Implement client-side request queuing
- Show loading states for all async operations

---

## Technical Implementation Details

### Project Setup
```bash
npm create vite@latest telegram-mini-app -- --template react-ts
cd telegram-mini-app
npm install
```

### Dependencies to Install
```bash
npm install @telegram-apps/sdk @telegram-apps/sdk-react @telegram-apps/ui-react @telegram-apps/signals-react
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install zustand axios
npm install recharts # For charts/visualizations
npm install tailwindcss postcss autoprefixer
```

### Folder Structure
```
src/
├── main.tsx                 # Entry point
├── App.tsx                  # Main app component
├── index.css               # Global styles
├── components/
│   ├── Layout.tsx          # Main layout with bottom nav
│   ├── Navbar.tsx          # Top header
│   ├── BottomNavigation.tsx
│   ├── Cards/
│   │   ├── BalanceCard.tsx
│   │   ├── EventCard.tsx
│   │   ├── ChallengeCard.tsx
│   │   ├── TransactionItem.tsx
│   │   ├── LeaderboardItem.tsx
│   │   └── StatBlock.tsx
│   └── Modals/
│       ├── EventDetailModal.tsx
│       ├── ChallengeDetailModal.tsx
│       └── DepositModal.tsx
├── pages/
│   ├── Home.tsx            # Dashboard
│   ├── Wallet.tsx          # Wallet tab
│   ├── Events.tsx          # Events browsing
│   ├── Challenges.tsx      # Challenges management
│   ├── Profile.tsx         # User profile
│   └── Leaderboard.tsx     # Global leaderboard
├── hooks/
│   ├── useAuth.ts          # Authentication hook
│   ├── useTelegram.ts      # Telegram SDK hook
│   ├── useWallet.ts        # Wallet queries
│   ├── useEvents.ts        # Events queries
│   └── useChallenges.ts    # Challenges queries
├── context/
│   └── AuthContext.tsx     # Auth state
├── services/
│   └── api.ts              # API client
├── store/
│   └── appStore.ts         # Global state (Zustand)
├── types/
│   └── index.ts            # TypeScript types
└── utils/
    ├── format.ts           # Formatting utilities
    └── constants.ts        # Constants & config
```

### Key Implementation Patterns

#### 1. **Telegram SDK Initialization**
```typescript
import { retrieveLaunchParams } from '@telegram-apps/sdk-react';

export function useTelegram() {
  const [lp, lpLoading] = retrieveLaunchParams();
  
  const initData = lp?.initData?.toString() || '';
  const user = lp?.initData?.user;
  const startParam = lp?.startParam;
  
  return { initData, user, startParam, lpLoading };
}
```

#### 2. **API Client Setup**
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Add auth header interceptor
apiClient.interceptors.request.use((config) => {
  const initData = localStorage.getItem('initData');
  if (initData) {
    config.headers['X-Telegram-Init-Data'] = initData;
  }
  return config;
});
```

#### 3. **React Query Setup**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
    },
  },
});
```

#### 4. **useWallet Hook Example**
```typescript
export function useWallet() {
  const query = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const response = await apiClient.get('/api/telegram/mini-app/wallet');
      return response.data;
    },
    enabled: !!useAuth().user,
  });

  return query;
}
```

---

## User Experience Requirements

### Performance
- **Initial Load**: < 2 seconds
- **Page Navigation**: < 500ms
- **Data Fetch**: Show skeleton loaders while loading
- **Optimistic Updates**: Update UI before confirmation

### Mobile Optimization
- **Bottom Navigation Tab**: Don't get hidden by keyboard
- **Safe Area**: Account for notches and home indicators
- **Touch Targets**: Minimum 44x44 px
- **Scroll Performance**: Virtual scrolling for long lists
- **Bottom Sheet Modals**: Swipeable dismiss

### Accessibility
- Semantic HTML
- ARIA labels for icons
- Keyboard navigation
- Color contrast (WCAG AA minimum)
- Loading states clear to screen readers

### Error Handling
- User-friendly error messages
- Retry buttons for failed requests
- Offline indicator
- Network error graceful fallback

---

## Telegram Mini-App Specific Features

### 1. **Telegram Integration**
- Use official Telegram UI Kit components
- Follow Telegram design language
- Support Telegram's dark/light theme switching
- Handle app expansion to fullscreen
- Use Telegram's vibration API for feedback

### 2. **Deep Linking**
- Support start parameters: `/telegram-mini-app?startapp=event_123`
- Parse and navigate to specific events/challenges
- Share challenge/event links back to Telegram

### 3. **In-Telegram Payments**
- Integrate with Telegram Payment System (future)
- Currently use Paystack redirect

### 4. **Web App Features**
- Request back button integration
- MainButton for primary CTAs
- ClosingBehavior handling
- Vibration feedback

---

## Development Workflow

### Environment Variables
```
VITE_API_URL=http://localhost:5000         # Dev
VITE_API_URL=https://api.bantah.com        # Production
VITE_TELEGRAM_BOT_USERNAME=@bantah_bot
```

### Development Commands
```bash
npm run dev      # Start dev server (usually http://localhost:5173)
npm run build    # Build for production
npm run preview  # Preview production build
npm run type-check # Type check
```

### Testing in Telegram
1. Deploy to accessible HTTPS URL
2. Set bot webhook to mini-app URL
3. Open Telegram, start bot
4. Bot sends button with mini-app link
5. Click to open in mini-app

### Deployment
- Build: `npm run build`
- Output folder: `dist/`
- Serve static files from this folder
- Set environment variable: `VITE_API_URL=<production-api-url>`

---

## Success Criteria

### Core Features (MVP)
- ✅ Authentication via Telegram initData
- ✅ Display user balance and coins
- ✅ Browse and join events
- ✅ Create and manage challenges
- ✅ View personal stats and leaderboard
- ✅ Transaction history
- ✅ Profile customization

### Quality Standards
- ✅ Zero TypeScript errors
- ✅ Mobile responsive (320px - 480px minimum)
- ✅ Accessible (keyboard navigation, screen readers)
- ✅ Fast (Lighthouse score > 80)
- ✅ Error handling for all API failures
- ✅ Loading states for all async operations
- ✅ Proper error boundaries

### Nice-to-Have Enhancements
- Push notifications for events and challenges
- Real-time updates via WebSocket
- Offline mode with local caching
- Achievement animations
- Challenge proof submission with image uploads
- Social sharing within Telegram
- Referral link sharing

---

## API Reference Summary

### Authentication
- `POST /api/telegram/mini-app/auth` - Initial auth with initData

### User Data
- `GET /api/telegram/mini-app/user` - Get user profile
- `GET /api/telegram/mini-app/stats` - Get user statistics
- `GET /api/telegram/mini-app/achievements` - Get achievements

### Wallet
- `GET /api/telegram/mini-app/wallet` - Get wallet info
- `POST /api/telegram/mini-app/deposit` - Initiate deposit

### Events
- `GET /api/telegram/mini-app/events` - List events (paginated)
- `GET /api/telegram/mini-app/events/:eventId` - Get event details
- `POST /api/events/:id/join` - Join event with prediction
- `POST /api/events/:id/leave` - Leave event

### Challenges
- `GET /api/telegram/mini-app/challenges` - Get user challenges
- `POST /api/telegram/mini-app/challenges/create` - Create challenge
- `POST /api/telegram/mini-app/challenges/:id/accept` - Accept challenge

### Leaderboard
- `GET /api/telegram/mini-app/leaderboard?limit=50` - Get global leaderboard

---

## Important Notes

### Security
- **Never expose bot token in frontend**
- Always verify initData server-side
- Use HTTPS for all API calls
- Validate all user inputs before API submission
- Don't store sensitive data in localStorage (except initData temporarily)

### Performance
- Implement pagination (20 items per page minimum)
- Use React Query for smart caching
- Lazy load images
- Code splitting by route
- Debounce search inputs

### Testing
- Test on real Telegram client
- Test on various device sizes (iPhone SE, iPhone 14 Pro, Android devices)
- Test on slow networks (throttle in DevTools)
- Test error scenarios (network down, 401, 404, 500)

---

## Additional Resources

### Official Documentation
- Telegram Mini Apps: https://core.telegram.org/bots/webapps
- Telegram SDK: https://telegram-apps.github.io/
- Telegram UI Kit: https://github.com/Telegram-Mini-Apps/ui-react

### Similar Projects for Reference
- Telegram Web App examples
- PWA betting platforms
- React query patterns

---

## Prompt for AI Coding Agent

If using an AI coding agent (like GitHub Copilot), here's the comprehensive prompt:

> Build a **Telegram Mini-App using React + TypeScript** for Bantah - a social betting platform. The app should be a **standalone frontend** connecting to the provided backend API.
>
> **Key Requirements**:
> 1. **Authentication**: Verify users via Telegram initData signature (HMAC-SHA256)
> 2. **4-Tab Navigation**: Wallet, Events, Challenges, Profile
> 3. **Wallet Tab**: Display balance, coins, transaction history, deposit button
> 4. **Events Tab**: Browse prediction events by category (Crypto, Sports, Gaming, etc.), join with YES/NO predictions
> 5. **Challenges Tab**: Create/accept P2P challenges with wagers
> 6. **Profile Tab**: User stats, achievements, leaderboard ranking
> 7. **Design**: Mobile-first, dark theme, Telegram UI Kit components
> 8. **State Management**: React Query for data + Zustand for global state
> 9. **Error Handling**: Graceful fallbacks, user-friendly messages, offline support
> 10. **Performance**: < 2s initial load, skeleton loaders, optimistic updates
>
> **API Endpoints to Use**:
> - `POST /api/telegram/mini-app/auth` - Authenticate
> - `GET /api/telegram/mini-app/user` - User profile
> - `GET /api/telegram/mini-app/wallet` - Wallet info
> - `GET /api/telegram/mini-app/challenges` - User challenges
> - `GET /api/telegram/mini-app/events` - Browse events
> - Plus existing endpoints for joining/creating events/challenges
>
> **Tech Stack**:
> - React 18+ with TypeScript
> - Vite for bundling
> - TanStack Query (React Query) for data fetching
> - Zustand for state management
> - Tailwind CSS for styling
> - @telegram-apps/sdk for Telegram integration
> - @telegram-apps/ui-react for UI components
>
> Build a complete, production-ready mini-app with proper TypeScript types, error handling, loading states, and mobile optimization. Follow best practices for React performance and accessibility.

---

End of Specification. Ready to build! 🚀

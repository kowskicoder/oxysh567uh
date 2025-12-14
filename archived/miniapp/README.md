# Bantah Telegram Mini-App

A mobile-first Telegram Mini-App for social betting and challenges, built with React + TypeScript.

## Features

- 💰 **Wallet Management** - View balance, transaction history, and deposit funds
- 🎯 **Prediction Events** - Browse and join YES/NO prediction events across multiple categories
- 🥊 **P2P Challenges** - Create and accept challenges with friends for betting
- 👤 **Profile & Leaderboard** - Track stats, achievements, and global rankings
- 📱 **Mobile-First Design** - Optimized for Telegram's mobile environment
- 🔒 **Secure Authentication** - Telegram SDK signature verification

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand + React Query
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **API Client**: Axios

## Setup

### Prerequisites

- Node.js 18+ installed

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Update .env.local with your API URL
# VITE_API_URL=http://localhost:5000  (or your production API)
```

### Development

```bash
# Start dev server (http://localhost:5173)
npm run dev

# View in browser
# Visit: http://localhost:5173
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── tabs/                    # Main tab screens
│   │   ├── WalletTab.tsx
│   │   ├── EventsTab.tsx
│   │   ├── ChallengesTab.tsx
│   │   └── ProfileTab.tsx
│   ├── modals/                  # Modal components
│   │   ├── DepositModal.tsx
│   │   └── CreateChallengeModal.tsx
│   ├── BottomNav.tsx            # Bottom tab navigation
│   ├── LoadingScreen.tsx        # Initial load state
│   └── AuthError.tsx            # Auth error display
├── lib/
│   └── api.ts                   # API client with all endpoints
├── store/
│   └── useAppStore.ts           # Global app state (Zustand)
├── App.tsx                      # Main app with auth flow
├── MainApp.tsx                  # App layout & tab routing
├── main.tsx                     # React entry point
└── index.css                    # Global styles + Tailwind
```

## API Integration

All endpoints are pre-configured in `src/lib/api.ts`:

### Authentication
- `POST /api/telegram/mini-app/auth` - Authenticate via Telegram

### User Profile
- `GET /api/telegram/mini-app/user` - Get user profile
- `GET /api/telegram/mini-app/stats` - Get user statistics
- `GET /api/telegram/mini-app/achievements` - Get achievements

### Wallet
- `GET /api/telegram/mini-app/wallet` - Get wallet info & transactions
- `POST /api/telegram/mini-app/deposit` - Initiate deposit (Paystack)

### Events (Prediction Betting)
- `GET /api/telegram/mini-app/events` - List events (paginated, filterable)
- `GET /api/telegram/mini-app/events/:id` - Get event details
- `POST /api/events/:id/join` - Join event with prediction
- `POST /api/events/:id/leave` - Leave event

### Challenges (P2P Betting)
- `GET /api/telegram/mini-app/challenges` - Get user's challenges
- `POST /api/telegram/mini-app/challenges/create` - Create new challenge
- `POST /api/telegram/mini-app/challenges/:id/accept` - Accept challenge

### Social
- `GET /api/telegram/mini-app/leaderboard` - Get top players

## Development Tips

### Mock Data for Testing

If you need to test without Telegram:

1. Edit `.env.local` with test `VITE_TEST_INIT_DATA`
2. Or modify `src/App.tsx` to skip authentication in development

### State Management

Use the `useAppStore` hook in any component:

```tsx
import { useAppStore } from '@/store/useAppStore'

function MyComponent() {
  const { user, activeTab, setActiveTab } = useAppStore()
  // ...
}
```

### Data Fetching

Use React Query for server state:

```tsx
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

function MyComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => apiClient.getWallet(),
  })
  // ...
}
```

## Deployment

### Vercel (Recommended)

```bash
# Push to GitHub and connect to Vercel
# Vercel will auto-deploy on push to main
```

### Manual Deployment

```bash
# Build
npm run build

# Deploy dist/ folder to your hosting
# Configure environment variables in hosting dashboard:
# VITE_API_URL=https://your-api-domain.com
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5000` |
| `VITE_TEST_INIT_DATA` | Test Telegram initData (dev only) | `query_id=...&user=%7B...` |

## Telegram Mini-App Setup

To add this as a Telegram Bot Mini-App:

1. **Create a Telegram Bot** via @BotFather
2. **Set Mini-App URL** in bot settings to your deployed app URL
3. **Create deep link**: `https://t.me/your_bot_name/app`
4. **Share with users** - they can open directly from Telegram

## Error Handling

The app includes graceful error handling:

- Authentication errors show a user-friendly message
- Network errors are caught and displayed as toasts
- Failed API calls use React Query's error states
- Form validation prevents invalid submissions

## Performance

- Lazy-loaded components
- Optimized bundle size (~150KB gzipped)
- Skeleton loaders for better UX
- Debounced search/filter operations

## Browser Support

- Chrome/Chromium (all versions)
- Safari 14+
- Firefox 78+
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

MIT

## Support

For issues or questions:
1. Check the [API Reference](../TELEGRAM_MINIAPP_API_REFERENCE.md)
2. Review the [Build Spec](../TELEGRAM_MINIAPP_BUILD_SPEC.md)
3. Contact the team

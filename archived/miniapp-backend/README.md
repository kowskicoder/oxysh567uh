# Bantah Mini-App Backend

Lightweight Express.js backend for the Telegram mini-app. Handles authentication, wallet, events, challenges, and user stats.

## Features

- ✅ Telegram WebApp authentication (signature verification)
- ✅ User wallet and balance management
- ✅ Prediction events API
- ✅ Challenge creation and management
- ✅ User statistics and leaderboard
- ✅ PostgreSQL database integration (shared with main backend)
- ✅ Type-safe with TypeScript

## Quick Start

### 1. Install Dependencies

```bash
cd miniapp-backend
npm install
```

### 2. Configure Environment

```bash
cp .env.local .env.local
# Edit .env.local with your values
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token
- `PORT`: Server port (default: 5001)
- `NODE_ENV`: development or production

### 3. Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:5001`

## API Endpoints

### Authentication

```bash
POST /api/auth
Content-Type: application/json

{
  "initData": "query_id=...&user=...&hash=..."
}
```

### Wallet

```bash
GET /api/wallet
X-Telegram-Init-Data: <initData>
```

### Events

```bash
# Get events
GET /api/events?limit=20&offset=0&category=crypto&status=active
X-Telegram-Init-Data: <initData>

# Join event
POST /api/events/1/join
X-Telegram-Init-Data: <initData>

{
  "prediction": true
}
```

### Challenges

```bash
# Get challenges
GET /api/challenges
X-Telegram-Init-Data: <initData>

# Create challenge
POST /api/challenges/create
X-Telegram-Init-Data: <initData>

{
  "title": "Beat my score",
  "description": "Can you score higher?",
  "category": "gaming",
  "wagerAmount": 5000,
  "deadline": "2024-01-31T23:59:59Z"
}

# Accept challenge
POST /api/challenges/1/accept
X-Telegram-Init-Data: <initData>
```

### Stats & Leaderboard

```bash
# Get user stats
GET /api/stats
X-Telegram-Init-Data: <initData>

# Get leaderboard
GET /api/leaderboard?limit=10
```

## Testing with curl

```bash
# Check health
curl http://localhost:5001/health

# Test auth (replace with real initData)
curl -X POST http://localhost:5001/api/auth \
  -H "Content-Type: application/json" \
  -d '{"initData":"query_id=test&user=%7B%22id%22%3A123%7D&hash=test"}'
```

## Development

### Build TypeScript

```bash
npm run build
```

### Type Check

```bash
npm run type-check
```

### Start Production Build

```bash
npm run build && npm start
```

## Architecture

- **Express.js** - HTTP server
- **TypeScript** - Type safety
- **Drizzle ORM** - Database (shares schema with main backend)
- **PostgreSQL** - Database
- **Crypto** - Telegram signature verification

## Database

Uses the same PostgreSQL database and Drizzle ORM schema as the main backend. All tables are shared:
- `users` - User accounts
- `events` - Prediction events
- `challenges` - User challenges
- `wallets` - User balances
- `predictions` - Event predictions

No separate migrations needed - reuses existing schema.

## Telegram Integration

Verifies Telegram WebApp `initData` using the official algorithm:
1. Extract `hash` from `initData`
2. Create `data-check-string` from other parameters
3. Generate HMAC-SHA256 signature using bot token
4. Compare with provided hash

See: https://core.telegram.org/bots/webapps#validating-data-received-from-the-web-app

## Deployment


### Environment Variables (Production)

```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
TELEGRAM_BOT_TOKEN=<your-bot-token>
PORT=5001
NODE_ENV=production
```

## Troubleshooting

### Connection Refused

Ensure PostgreSQL is running and `DATABASE_URL` is correct.

### Invalid Telegram Data

Check that:
1. `TELEGRAM_BOT_TOKEN` is correct
2. `initData` format is valid
3. Telegram WebApp is providing the data correctly

### Port Already in Use

Change `PORT` environment variable to an available port.

## Future Enhancements

- [ ] Database queries (currently using mock data)
- [ ] User session tokens
- [ ] Rate limiting
- [ ] Request validation
- [ ] Payment processing
- [ ] Notification queue integration
- [ ] Analytics logging

## License

MIT

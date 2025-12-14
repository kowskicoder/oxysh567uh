# Bantah Telegram Mini-App - API Quick Reference

## Base URL
```
Development:  http://localhost:5000
Production:   https://your-api-domain.com
```

## Authentication Header
All requests (except `/auth`) must include:
```
X-Telegram-Init-Data: <initData string from Telegram.WebApp>
```

---

## Endpoints

### 1. Authentication

#### POST `/api/telegram/mini-app/auth`
Authenticate user via Telegram initData. Called once on app startup.

**Request**:
```javascript
{
  "initData": "query_id=...&user=%7B%22id%22%3A123456789...&auth_date=1702340000&hash=..."
}
```

**Response** (200):
```javascript
{
  "ok": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "telegramId": "123456789",
    "username": "john_doe",
    "firstName": "John",
    "lastName": "Doe",
    "balance": 5000.00,
    "coins": 1500,
    "level": 5,
    "xp": 1200,
    "points": 2500,
    "profileImageUrl": "https://..."
  },
  "timestamp": 1702340000000
}
```

**Error** (401):
```javascript
{
  "ok": false,
  "error": "Invalid authentication signature"
}
```

---

### 2. User Profile

#### GET `/api/telegram/mini-app/user`
Get authenticated user's complete profile with statistics.

**Headers**: Requires `X-Telegram-Init-Data`

**Response** (200):
```javascript
{
  "ok": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "telegramId": "123456789",
    "username": "john_doe",
    "firstName": "John",
    "balance": 5000.00,
    "coins": 1500,
    "level": 5,
    "xp": 1200,
    "points": 2500,
    "streak": 3,
    "isAdmin": false,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "stats": {
    "participationCount": 12,
    "challengesCreated": 5,
    "challengesAccepted": 8,
    "totalEvents": 12
  }
}
```

---

### 3. Wallet

#### GET `/api/telegram/mini-app/wallet`
Get user's wallet information and recent transactions.

**Headers**: Requires `X-Telegram-Init-Data`

**Query Parameters**:
- None

**Response** (200):
```javascript
{
  "ok": true,
  "wallet": {
    "balance": 5000.00,
    "coins": 1500,
    "currency": "NGN",
    "totalSpent": 2500.00,
    "totalEarned": 7500.00,
    "lastUpdated": 1702340000000
  },
  "recentTransactions": [
    {
      "id": "tx_001",
      "type": "deposit",
      "amount": 1000.00,
      "description": "Deposit via Paystack",
      "status": "completed",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": "tx_002",
      "type": "bet_placed",
      "amount": -500.00,
      "description": "Event: Bitcoin Price Prediction",
      "status": "completed",
      "createdAt": "2024-01-14T15:20:00Z"
    }
  ]
}
```

#### POST `/api/telegram/mini-app/deposit`
Initiate a wallet deposit via Paystack.

**Headers**: Requires `X-Telegram-Init-Data`

**Request**:
```javascript
{
  "amount": 5000.00
}
```

**Response** (200):
```javascript
{
  "ok": true,
  "message": "Deposit initiated",
  "paymentUrl": "https://pay.paystack.co/pay?amount=500000&email=user@example.com"
}
```

---

### 4. Events

#### GET `/api/telegram/mini-app/events`
List all available events for browsing. Paginated.

**Headers**: None required (public endpoint)

**Query Parameters**:
- `limit`: Number of results (default: 20, max: 100)
- `offset`: Number of results to skip (default: 0)
- `category`: Filter by category (optional) - crypto, sports, gaming, music, politics
- `status`: Filter by status (optional) - active, pending, completed

**Response** (200):
```javascript
{
  "ok": true,
  "events": [
    {
      "id": 1,
      "title": "Bitcoin Price > $50k by Dec 31",
      "description": "Will Bitcoin price exceed $50,000?",
      "category": "crypto",
      "entryFee": 1000.00,
      "status": "active",
      "createdAt": "2024-01-15T10:30:00Z",
      "deadline": "2024-12-31T23:59:59Z",
      "participants": 245,
      "yesVotes": 158,
      "noVotes": 87
    },
    {
      "id": 2,
      "title": "Will Nigeria win AFCON 2024?",
      "description": "Will Nigeria's national team win Africa Cup of Nations?",
      "category": "sports",
      "entryFee": 500.00,
      "status": "active",
      "createdAt": "2024-01-14T08:00:00Z",
      "deadline": "2024-02-10T19:00:00Z",
      "participants": 512,
      "yesVotes": 380,
      "noVotes": 132
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 245
  }
}
```

#### GET `/api/telegram/mini-app/events/:eventId`
Get detailed information about a specific event.

**Headers**: None required (public endpoint)

**Response** (200):
```javascript
{
  "ok": true,
  "event": {
    "id": 1,
    "title": "Bitcoin Price > $50k by Dec 31",
    "description": "Will Bitcoin price exceed $50,000 by end of year?",
    "category": "crypto",
    "entryFee": 1000.00,
    "status": "active",
    "result": null,
    "createdAt": "2024-01-15T10:30:00Z",
    "deadline": "2024-12-31T23:59:59Z"
  },
  "stats": {
    "totalParticipants": 245,
    "yesCount": 158,
    "noCount": 87,
    "yesPercentage": "64.5",
    "noPercentage": "35.5"
  }
}
```

#### POST `/api/events/:eventId/join`
Join an event with a prediction.

**Headers**: Requires `X-Telegram-Init-Data`

**Request**:
```javascript
{
  "prediction": true // true for YES, false for NO
}
```

**Response** (200):
```javascript
{
  "ok": true,
  "message": "Successfully joined event",
  "participant": {
    "eventId": 1,
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "prediction": true,
    "amount": 1000.00,
    "status": "active",
    "joinedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 5. Challenges

#### GET `/api/telegram/mini-app/challenges`
Get all challenges (created and accepted by user).

**Headers**: Requires `X-Telegram-Init-Data`

**Response** (200):
```javascript
{
  "ok": true,
  "created": [
    {
      "id": 5,
      "title": "Will you beat me at 2K25?",
      "description": "Online multiplayer match",
      "category": "gaming",
      "wagerAmount": 2000.00,
      "status": "pending",
      "createdAt": "2024-01-15T10:30:00Z",
      "deadline": "2024-01-20T23:59:59Z",
      "winner": null
    }
  ],
  "accepted": [
    {
      "id": 7,
      "title": "Bet on Chelsea vs City",
      "description": "Match outcome prediction",
      "category": "sports",
      "wagerAmount": 5000.00,
      "status": "matched",
      "createdAt": "2024-01-14T15:20:00Z",
      "deadline": "2024-01-21T17:30:00Z",
      "winner": null
    }
  ],
  "stats": {
    "total": 2,
    "createdCount": 1,
    "acceptedCount": 1
  }
}
```

#### POST `/api/telegram/mini-app/challenges/create`
Create a new challenge.

**Headers**: Requires `X-Telegram-Init-Data`

**Request**:
```javascript
{
  "title": "Will you beat me at 2K25?",
  "description": "Online multiplayer match, winner takes all",
  "category": "gaming",
  "wagerAmount": 2000.00,
  "deadline": "2024-01-20T23:59:59Z",
  "acceptedUserId": null // Optional: specify opponent
}
```

**Response** (201):
```javascript
{
  "ok": true,
  "challenge": {
    "id": 5,
    "title": "Will you beat me at 2K25?",
    "description": "Online multiplayer match, winner takes all",
    "category": "gaming",
    "wagerAmount": 2000.00,
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### POST `/api/telegram/mini-app/challenges/:challengeId/accept`
Accept a pending challenge.

**Headers**: Requires `X-Telegram-Init-Data`

**Request**:
```javascript
{}
```

**Response** (200):
```javascript
{
  "ok": true,
  "message": "Challenge accepted",
  "challenge": {
    "id": 5,
    "status": "matched"
  }
}
```

---

### 6. Profile & Achievements

#### GET `/api/telegram/mini-app/achievements`
Get user's achievements and progression.

**Headers**: Requires `X-Telegram-Init-Data`

**Response** (200):
```javascript
{
  "ok": true,
  "profile": {
    "username": "john_doe",
    "level": 5,
    "xp": 1200,
    "points": 2500,
    "streak": 3
  },
  "stats": {
    "totalEvents": 12,
    "totalChallenges": 5,
    "wins": 8
  }
}
```

#### GET `/api/telegram/mini-app/stats`
Get comprehensive user statistics.

**Headers**: Requires `X-Telegram-Init-Data`

**Response** (200):
```javascript
{
  "ok": true,
  "stats": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "level": 5,
    "xp": 1200,
    "points": 2500,
    "balance": 5000.00,
    "coins": 1500,
    "streak": 3,
    "joinedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### GET `/api/telegram/mini-app/leaderboard`
Get global leaderboard rankings.

**Headers**: None required (public endpoint)

**Query Parameters**:
- `limit`: Number of top users (default: 50, max: 100)

**Response** (200):
```javascript
{
  "ok": true,
  "leaderboard": [
    {
      "rank": 1,
      "username": "crypto_king",
      "level": 25,
      "points": 45000,
      "xp": 125000
    },
    {
      "rank": 2,
      "username": "betting_pro",
      "level": 23,
      "points": 42500,
      "xp": 118000
    },
    {
      "rank": 3,
      "username": "john_doe",
      "level": 5,
      "points": 2500,
      "xp": 1200
    }
  ]
}
```

---

## Error Responses

### 400 Bad Request
```javascript
{
  "ok": false,
  "error": "Missing required fields"
}
```

### 401 Unauthorized
```javascript
{
  "ok": false,
  "error": "Invalid authentication signature"
}
```

### 404 Not Found
```javascript
{
  "ok": false,
  "error": "Challenge not found"
}
```

### 500 Internal Server Error
```javascript
{
  "ok": false,
  "error": "Failed to fetch user data"
}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid auth or missing header |
| 404 | Not Found - Resource doesn't exist |
| 500 | Server Error - Internal server error |

---

## Pagination

For endpoints that return lists (events, transactions, leaderboard):

**Query Parameters**:
```
?limit=20&offset=0
```

**Response**:
```javascript
{
  "ok": true,
  "data": [...],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 245
  }
}
```

---

## Rate Limiting

**Limits**: 100 requests per minute per user

**Headers** (in response):
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1702340060
```

---

## Example Usage in React

```typescript
import axios from 'axios';

const API_URL = 'http://localhost:5000';

// Create API client
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Add auth interceptor
apiClient.interceptors.request.use((config) => {
  const initData = localStorage.getItem('initData');
  if (initData) {
    config.headers['X-Telegram-Init-Data'] = initData;
  }
  return config;
});

// Usage in hook
async function authenticateUser(initData: string) {
  const response = await apiClient.post('/api/telegram/mini-app/auth', {
    initData,
  });
  return response.data;
}

async function getWallet() {
  const response = await apiClient.get('/api/telegram/mini-app/wallet');
  return response.data;
}

async function joinEvent(eventId: number, prediction: boolean) {
  const response = await apiClient.post(`/api/events/${eventId}/join`, {
    prediction,
  });
  return response.data;
}
```

---

## Notes

- All amounts are in **NGN (Nigerian Naira)**
- Timestamps are in **ISO 8601** format
- User IDs are **UUIDs** (v4 format)
- Event/Challenge IDs are **integers**
- Telegram IDs are **strings** (Telegram user numeric ID converted to string)
- All decimal values have **2 decimal places** precision

---

Last Updated: January 2025

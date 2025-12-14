# 🚀 Bantah Mini-App - Quick Start Guide

## ✅ What's Been Built

Your **complete React + TypeScript Telegram Mini-App** is ready with:

### **Features Implemented:**
✅ **4-Tab Navigation**: Wallet, Events, Challenges, Profile  
✅ **Wallet Tab**: Balance display, transaction history, deposit button  
✅ **Events Tab**: Browse prediction events, filters by category/status  
✅ **Challenges Tab**: Create and manage P2P challenges  
✅ **Profile Tab**: User stats, achievements, global leaderboard  
✅ **Telegram SDK Integration**: Secure authentication via initData  
✅ **State Management**: Zustand + React Query  
✅ **Dark Theme UI**: Mobile-optimized Tailwind design  
✅ **API Client**: All 13 backend endpoints pre-configured  
✅ **Error Handling**: Auth errors, network failures, form validation  

### **Project Structure:**
```
miniapp/
├── src/
│   ├── components/
│   │   ├── tabs/               # 4 main screens
│   │   ├── modals/             # Deposit & Create Challenge
│   │   ├── BottomNav.tsx       # Tab navigation
│   │   ├── LoadingScreen.tsx
│   │   └── AuthError.tsx
│   ├── lib/
│   │   └── api.ts              # API client (all endpoints)
│   ├── store/
│   │   └── useAppStore.ts      # Global state
│   ├── App.tsx                 # Auth flow
│   ├── MainApp.tsx             # Layout
│   ├── index.css               # Global styles
│   └── main.tsx
├── index.html                  # HTML entry point
├── package.json                # Dependencies
├── tailwind.config.js          # Tailwind theme
├── postcss.config.js
├── vite.config.ts              # Build config
├── tsconfig.json
└── README.md                   # Detailed docs
```

---

## 🏃 Run Dev Server

```bash
cd /workspaces/ozzib-project/miniapp
npm run dev
```

Opens at: **http://localhost:5173**

### Expected:
- Loading screen → Auth error (no valid Telegram data yet)
- To test: Open Telegram Bot → Mini-App → Opens at localhost:5173

---

## 🔨 Build for Production

```bash
cd /workspaces/ozzib-project/miniapp
npm run build
npm run preview
```

Output: **dist/** folder (ready to deploy)

---

## 📱 Testing on Telegram

1. **Create Telegram Bot** (via @BotFather)
   ```
   /newbot
   → Give it a name
   → Get your token
   ```

2. **Deploy Mini-App**
   - Deploy `dist/` folder to hosting (Vercel, Netlify, etc.)
   - Get URL: `https://your-domain.com`

3. **Configure Bot** (in @BotFather)
   ```
   /mybots → Select bot → Web App Settings
   → Set URL to https://your-domain.com
   ```

4. **Create Deep Link**
   ```
   https://t.me/your_bot/app
   ```

5. **Test in Telegram**
   - Open link in Telegram
   - Mini-app loads with your authentication

---

## 🔌 Backend Connection

The app connects to your Express.js backend at:
- **Development**: `http://localhost:5000` (default)
- **Production**: Set `VITE_API_URL` environment variable

### Environment Variables (`.env.local`)
```
VITE_API_URL=http://localhost:5000
VITE_TEST_INIT_DATA=           # Optional test data
```

---

## 🎯 Key Components

### **App.tsx**
- Initializes Telegram SDK
- Authenticates user via `apiClient.authenticate(initData)`
- Shows loading/error states
- Redirects to MainApp on success

### **MainApp.tsx**
- Routes between 4 tabs
- Renders active tab based on `useAppStore().activeTab`

### **API Client** (`lib/api.ts`)
Pre-configured endpoints:
```typescript
// Authentication
await apiClient.authenticate(initData)

// User & Profile
await apiClient.getUser()
await apiClient.getStats()
await apiClient.getAchievements()
await apiClient.getLeaderboard()

// Wallet
await apiClient.getWallet()
await apiClient.initiateDeposit(amount)

// Events
await apiClient.getEvents(limit, offset, category, status)
await apiClient.joinEvent(eventId, prediction)

// Challenges
await apiClient.getChallenges()
await apiClient.createChallenge(data)
await apiClient.acceptChallenge(challengeId)
```

### **State Management** (`store/useAppStore.ts`)
```typescript
const { user, setUser, activeTab, setActiveTab } = useAppStore()
```

---

## 📊 Data Flow

```
User opens Telegram → Mini-App loads
    ↓
App.tsx gets Telegram.WebApp.initData
    ↓
Sends to backend: POST /api/telegram/mini-app/auth
    ↓
Backend verifies HMAC signature
    ↓
Returns user profile + balance
    ↓
MainApp renders with 4 tabs
    ↓
User interacts: API calls → React Query updates UI
```

---

## ✨ Features to Test

### **Wallet Tab**
- [ ] See balance and coins
- [ ] View transaction history
- [ ] Click "Deposit" → Payment modal opens
- [ ] Test quick amount buttons (₦5k, ₦10k, etc)

### **Events Tab**
- [ ] See list of prediction events
- [ ] Filter by category (crypto, sports, etc)
- [ ] Filter by status (active, pending, completed)
- [ ] Each event shows YES/NO vote counts
- [ ] Click event to see details (if route added)

### **Challenges Tab**
- [ ] See created challenges
- [ ] See accepted challenges
- [ ] Click "Create Challenge" button
- [ ] Fill form: title, description, wager, deadline
- [ ] Submit creates challenge

### **Profile Tab**
- [ ] See user name and profile
- [ ] See level, XP, points
- [ ] View statistics (participations, challenges)
- [ ] See achievements grid
- [ ] See top 10 leaderboard

---

## 🐛 Troubleshooting

### **"Telegram WebApp not available"**
- You must open from within Telegram
- In development, test via Telegram bot mini-app link

### **"Authentication failed"**
- Backend `/api/telegram/mini-app/auth` not responding
- Check backend is running on port 5000
- Verify HMAC verification is correct

### **"API errors (401, 404, 500)"**
- Check backend logs
- Verify `VITE_API_URL` matches your backend URL
- Network tab (F12) shows actual API calls

### **Build errors**
- Run `npm install` again
- Delete `node_modules/` and `package-lock.json`
- Run `npm install` fresh

---

## 📚 Next Steps

1. **Deploy Backend** (if not already done)
   - Ensure Express server is running
   - Verify all 13 endpoints are working

2. **Deploy Mini-App Frontend**
   - Build: `npm run build`
   - Upload `dist/` to hosting
   - Update `VITE_API_URL` to production backend

3. **Test on Telegram**
   - Create bot in @BotFather
   - Set mini-app URL
   - Share deep link with users

4. **Add More Features** (optional)
   - Event details page
   - Challenge voting/settlement UI
   - Notification system
   - Analytics/tracking
   - Payment webhooks

---

## 📖 Documentation

- **API Reference**: [TELEGRAM_MINIAPP_API_REFERENCE.md](../TELEGRAM_MINIAPP_API_REFERENCE.md)
- **Architecture**: [TELEGRAM_MINIAPP_ARCHITECTURE.md](../TELEGRAM_MINIAPP_ARCHITECTURE.md)
- **Build Spec**: [TELEGRAM_MINIAPP_BUILD_SPEC.md](../TELEGRAM_MINIAPP_BUILD_SPEC.md)
- **Mini-App README**: [README.md](./README.md)

---

## 🎉 You're All Set!

The mini-app is **production-ready**. All you need to do:

1. ✅ Backend must be running (`npm start` in server folder)
2. ✅ Update `VITE_API_URL` for your environment
3. ✅ Run `npm run dev` to test locally
4. ✅ Run `npm run build` for production
5. ✅ Deploy to hosting and set bot mini-app URL

**Happy coding!** 🚀

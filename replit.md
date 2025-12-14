# Bantah - Social Betting Platform

## Overview
Bantah is a real-time social betting and challenge platform combining event prediction, peer-to-peer challenges, live chat, and gamification. It is a full-stack web application with a React frontend and Express.js backend, designed for the Nigerian market with integrated payment solutions. The platform aims to provide a comprehensive and engaging experience for users to predict outcomes, challenge friends, and interact in a social environment.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.4.19
- **Routing**: Wouter 3.3.5
- **UI Library**: Tailwind CSS 3.4.17 with shadcn/ui
- **State Management**: TanStack Query 5.60.5
- **Forms**: React Hook Form 7.55.0 with Zod validation
- **Real-time Communication**: WebSocket integration with Pusher-js 8.4.0
- **Animations**: Framer Motion 11.13.1
- **Icons**: Lucide React and React Icons
- **Theme**: Dark/light mode support
- **UI/UX Decisions**: Mobile-first design, compact authentication flows, SF Pro font, clean white/gray backgrounds with colorful icons, modern card designs, consolidated mobile navigation. Key features include mobile-optimized modals, consistent currency formatting (₦300k), enhanced chat reactions, and playful loading animations.

### Backend Architecture
- **Runtime**: Node.js with Express 4.21.2
- **Database**: PostgreSQL with Drizzle ORM 0.39.1
- **Database Connection**: Neon Database serverless with connection pooling
- **Authentication**: Replit Auth with Passport.js (OpenID Connect)
- **Session Management**: Express-session with PostgreSQL storage
- **Real-time**: Native WebSocket + Pusher 5.2.0
- **API**: RESTful architecture

### Key Components
- **Authentication System**: Replit Auth integration for user authentication, session management, and profile handling.
- **Database Schema**: 19 tables covering users, sessions, events, challenges, friends, notifications, achievements, transactions, escrow, referrals, messages, and gamification data.
- **Real-time Features**: Live chat (event/challenge) with typing indicators, real-time push notifications, and activity tracking via WebSockets and Pusher.
- **Payment Integration**: Paystack for Nigerian Naira (NGN) transactions, supporting deposits, withdrawals, and an escrow system.
- **Event Matching System**: FCFS (First Come, First Served) matching for event participants.
- **Gamification**: Level system (Beginner to Master), XP tracking, leaderboards (coins-based ranking), achievement badges, and daily login bonuses.
- **Admin Payout System**: Dedicated admin panel for managing event and challenge payouts with automated winner calculation.
- **Referral System**: Generates and tracks referral codes, awarding points for successful referrals.

## External Dependencies

- **Neon Database**: Serverless PostgreSQL hosting.
- **Pusher**: Real-time WebSocket service for live features and notifications.
- **Paystack**: Nigerian payment gateway for financial transactions.
- **Radix UI**: Accessible component primitives for UI development.
- **shadcn/ui**: Pre-built UI component library.
- **Tailwind CSS**: Utility-first CSS framework.
- **Telegram**: Webhook integration for messaging and user creation.
- **Google & Apple**: Social login integration.
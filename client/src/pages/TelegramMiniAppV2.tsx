import React, { useEffect, useState } from 'react';
import { TelegramClient, isTelegramUrl } from '@telegram-apps/sdk';
import { useInitData } from '@telegram-apps/sdk-react/dist/hooks/useInitData';
import axios from 'axios';

interface User {
  id: string;
  username: string;
  firstName: string;
  balance: string;
  coins: number;
  activeChallenges: number;
}

export default function TelegramMiniAppV2() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'wallet' | 'challenges' | 'profile'>('wallet');

  useEffect(() => {
    const initTelegramApp = async () => {
      try {
        // Get Telegram init data from URL hash or WebApp
        const initData = window.Telegram?.WebApp?.initData;
        
        if (!initData) {
          setError('Telegram WebApp not available');
          setLoading(false);
          return;
        }

        // Parse initData to get user ID
        const params = new URLSearchParams(initData);
        const userStr = params.get('user');
        
        if (!userStr) {
          setError('No user data in Telegram');
          setLoading(false);
          return;
        }

        const userData = JSON.parse(userStr);
        const telegramId = userData.id.toString();

        console.log('🔐 Telegram user:', telegramId);

        // Call main API to authenticate and get user data
        const response = await axios.post(
          '/api/telegram/mini-app/auth',
          {
            telegramId,
            initData,
            userName: userData.first_name,
          }
        );

        if (response.data.user) {
          setUser(response.data.user);
        } else {
          setError('Failed to authenticate');
        }
      } catch (err: any) {
        console.error('Auth error:', err);
        setError(err.message || 'Authentication failed');
      } finally {
        setLoading(false);
      }
    };

    initTelegramApp();
  }, []);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loader}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>❌ {error}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>No user data</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1>👋 {user.firstName}</h1>
        <p>@{user.username || 'user'}</p>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab('wallet')}
          style={{
            ...styles.tab,
            ...(activeTab === 'wallet' ? styles.tabActive : {}),
          }}
        >
          💰 Wallet
        </button>
        <button
          onClick={() => setActiveTab('challenges')}
          style={{
            ...styles.tab,
            ...(activeTab === 'challenges' ? styles.tabActive : {}),
          }}
        >
          ⚔️ Challenges
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            ...styles.tab,
            ...(activeTab === 'profile' ? styles.tabActive : {}),
          }}
        >
          👤 Profile
        </button>
      </div>

      {/* Tab Content */}
      <div style={styles.content}>
        {activeTab === 'wallet' && (
          <div>
            <h2>💰 Your Wallet</h2>
            <div style={styles.card}>
              <div style={styles.cardRow}>
                <span>Balance:</span>
                <strong>₦{parseInt(user.balance || '0').toLocaleString()}</strong>
              </div>
              <div style={styles.cardRow}>
                <span>Coins:</span>
                <strong>🪙 {user.coins}</strong>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'challenges' && (
          <div>
            <h2>⚔️ Challenges</h2>
            <div style={styles.card}>
              <div style={styles.cardRow}>
                <span>Active Challenges:</span>
                <strong>{user.activeChallenges}</strong>
              </div>
            </div>
            <div style={styles.emptyState}>
              {user.activeChallenges === 0 && (
                <>
                  <p>No active challenges yet</p>
                  <p>Create one to get started!</p>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div>
            <h2>👤 Profile</h2>
            <div style={styles.card}>
              <div style={styles.cardRow}>
                <span>Name:</span>
                <strong>{user.firstName}</strong>
              </div>
              <div style={styles.cardRow}>
                <span>Username:</span>
                <strong>@{user.username || 'N/A'}</strong>
              </div>
              <div style={styles.cardRow}>
                <span>User ID:</span>
                <code style={styles.code}>{user.id}</code>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    backgroundColor: 'white',
    padding: '20px',
    borderBottom: '1px solid #e0e0e0',
    textAlign: 'center',
  },
  tabs: {
    display: 'flex',
    backgroundColor: 'white',
    borderBottom: '1px solid #e0e0e0',
    gap: '0',
  },
  tab: {
    flex: 1,
    padding: '12px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    borderBottom: '3px solid transparent',
    transition: 'all 0.3s ease',
  },
  tabActive: {
    borderBottomColor: '#40a7e3',
    color: '#40a7e3',
    fontWeight: 'bold',
  },
  content: {
    padding: '20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '16px',
    marginTop: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  cardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  code: {
    fontFamily: 'monospace',
    fontSize: '12px',
    backgroundColor: '#f5f5f5',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#999',
  },
  loader: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '18px',
    color: '#666',
  },
  error: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '18px',
    color: '#d32f2f',
    backgroundColor: '#ffebee',
  },
};

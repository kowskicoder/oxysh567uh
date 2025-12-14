import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { apiClient } from './lib/api';
import { useAppStore } from './store/useAppStore';
import LoadingScreen from './components/LoadingScreen';
import AuthError from './components/AuthError';
import MainApp from './MainApp';
function App() {
    const { setUser, setAuthenticated, user } = useAppStore();
    const [initDataError, setInitDataError] = useState(null);
    useEffect(() => {
        const initializeTelegram = async () => {
            try {
                const tg = window.Telegram?.WebApp;
                const mockUser = {
                    id: 'dev-user-1',
                    telegramId: '123456789',
                    username: 'devuser',
                    firstName: 'Dev',
                    lastName: 'User',
                    balance: 50000,
                    coins: 5000,
                    level: 15,
                    xp: 5000,
                    points: 15000,
                    profileImageUrl: 'https://via.placeholder.com/150',
                };
                // In development, ALWAYS use mock user - never call backend
                if (import.meta.env.DEV) {
                    console.log('🧪 Development mode detected - loading mock user');
                    setUser(mockUser);
                    setAuthenticated(true);
                    console.log('✅ Dev mode: Mock user loaded successfully');
                    return;
                }
                // Production mode: require Telegram
                if (!tg) {
                    setInitDataError('Telegram WebApp not available. Please open from Telegram.');
                    return;
                }
                const initData = tg.initData || import.meta.env.VITE_TEST_INIT_DATA || '';
                if (!initData) {
                    setInitDataError('Unable to authenticate with Telegram.');
                    return;
                }
                const response = await apiClient.authenticate(initData);
                if (response.ok) {
                    setUser(response.user);
                    setAuthenticated(true);
                }
                else {
                    setInitDataError('Authentication failed. Please try again.');
                }
                tg?.ready?.();
            }
            catch (error) {
                const message = error instanceof Error ? error.message : 'Authentication error';
                setInitDataError(message);
            }
        };
        initializeTelegram();
    }, [setUser, setAuthenticated]);
    if (initDataError) {
        return _jsx(AuthError, { error: initDataError });
    }
    if (!user) {
        return _jsx(LoadingScreen, {});
    }
    return _jsx(MainApp, {});
}
export default App;

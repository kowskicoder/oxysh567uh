import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAppStore } from './store/useAppStore';
import WalletTab from './components/tabs/WalletTab';
import EventsTab from './components/tabs/EventsTab';
import ChallengesTab from './components/tabs/ChallengesTab';
import LeaderboardTab from './components/tabs/LeaderboardTab';
import ProfileTab from './components/tabs/ProfileTab';
import BottomNav from './components/BottomNav';
export default function MainApp() {
    const { activeTab, setActiveTab } = useAppStore();
    const renderTab = () => {
        switch (activeTab) {
            case 'wallet':
                return _jsx(WalletTab, {});
            case 'events':
                return _jsx(EventsTab, {});
            case 'challenges':
                return _jsx(ChallengesTab, {});
            case 'leaderboard':
                return _jsx(LeaderboardTab, {});
            case 'profile':
                return _jsx(ProfileTab, {});
            default:
                return _jsx(WalletTab, {});
        }
    };
    return (_jsxs("div", { className: "flex flex-col h-screen bg-dark-bg text-gray-100", children: [_jsx("div", { className: "flex-1 overflow-y-auto pb-20", children: renderTab() }), _jsx(BottomNav, { activeTab: activeTab, setActiveTab: setActiveTab })] }));
}

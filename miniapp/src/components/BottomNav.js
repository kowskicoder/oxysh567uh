import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Wallet, TrendingUp, Swords, User, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { cn } from '../utils/cn';
const tabs = [
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'events', label: 'Events', icon: TrendingUp },
    { id: 'challenges', label: 'Challenges', icon: Swords },
    { id: 'leaderboard', label: 'Leaderboard', icon: Zap },
    { id: 'profile', label: 'Profile', icon: User },
];
export default function BottomNav({ activeTab, setActiveTab }) {
    // Get badge counts
    const { data: stats } = useQuery({
        queryKey: ['stats'],
        queryFn: () => apiClient.getStats(),
    });
    const { data: challenges } = useQuery({
        queryKey: ['challenges'],
        queryFn: () => apiClient.getChallenges(),
    });
    const getEventsBadgeCount = () => {
        // Return count of unread or pending events
        return stats?.statsData?.unreadEvents || 0;
    };
    const getChallengesBadgeCount = () => {
        // Return count of pending challenges
        return (challenges?.accepted?.filter(c => c.status === 'pending')?.length || 0);
    };
    const eventsBadgeCount = getEventsBadgeCount();
    const challengesBadgeCount = getChallengesBadgeCount();
    return (_jsx("div", { className: "fixed bottom-0 left-0 right-0 bg-dark-card border-t border-dark-border z-50 shadow-lg", children: _jsx("div", { className: "flex items-center justify-around px-1 py-2", children: tabs.map(({ id, label, icon: Icon }) => {
                const isActive = activeTab === id;
                const hasBadge = (id === 'events' && eventsBadgeCount > 0) || (id === 'challenges' && challengesBadgeCount > 0);
                const badgeCount = id === 'events' ? eventsBadgeCount : (id === 'challenges' ? challengesBadgeCount : 0);
                return (_jsxs("button", { onClick: () => setActiveTab(id), className: cn("relative flex flex-col items-center justify-center p-1.5 rounded-lg transition-all duration-200 ease-in-out min-w-[50px]", "hover:bg-dark-hover dark:hover:bg-dark-hover active:scale-95", isActive
                        ? "text-primary bg-primary/10 scale-105"
                        : "text-gray-500 dark:text-gray-500 hover:text-gray-300 dark:hover:text-gray-300"), children: [_jsxs("div", { className: "relative", children: [_jsx(Icon, { size: 20, className: cn("mb-1 transition-transform duration-200", isActive && "scale-110", isActive ? "opacity-100" : "opacity-70") }), hasBadge && (_jsx("span", { className: "absolute -top-2 -right-2 w-4 h-4 flex items-center justify-center p-0 bg-red-500 text-white text-[8px] font-semibold rounded-full", children: badgeCount > 9 ? '9+' : badgeCount }))] }), _jsx("span", { className: cn("text-[10px] font-medium transition-all duration-200 leading-none", isActive && "font-semibold"), children: label }), isActive && (_jsx("div", { className: "absolute -top-1 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" }))] }, id));
            }) }) }));
}

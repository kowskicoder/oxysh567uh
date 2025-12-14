import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { Zap, Crown, Medal } from 'lucide-react';
export default function LeaderboardTab() {
    const { data: leaderboard, isLoading } = useQuery({
        queryKey: ['leaderboard'],
        queryFn: () => apiClient.getLeaderboard(100),
    });
    const getMedalColor = (rank) => {
        switch (rank) {
            case 1:
                return 'from-yellow-400 to-yellow-600';
            case 2:
                return 'from-gray-300 to-gray-500';
            case 3:
                return 'from-amber-400 to-amber-600';
            default:
                return 'from-slate-400 to-slate-600';
        }
    };
    const getMedalIcon = (rank) => {
        if (rank === 1)
            return '🥇';
        if (rank === 2)
            return '🥈';
        if (rank === 3)
            return '🥉';
        return null;
    };
    return (_jsx("div", { className: "min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition pb-[50px]", children: _jsxs("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [_jsxs("div", { className: "mb-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center", children: _jsx(Crown, { className: "w-6 h-6 text-yellow-600 dark:text-yellow-400" }) }), _jsx("h1", { className: "text-3xl font-bold text-slate-900 dark:text-white", children: "Global Leaderboard" })] }), _jsx("p", { className: "text-slate-600 dark:text-slate-400", children: "Top players by points" })] }), isLoading ? (_jsx("div", { className: "bg-white dark:bg-slate-800 rounded-2xl p-8 text-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700", children: "Loading leaderboard..." })) : leaderboard?.leaderboard?.length ? (_jsx("div", { className: "space-y-3", children: leaderboard.leaderboard.map((player, idx) => {
                        const rank = idx + 1;
                        const isMedal = rank <= 3;
                        const medalIcon = getMedalIcon(rank);
                        const medalColor = getMedalColor(rank);
                        return (_jsxs("div", { className: `bg-white dark:bg-slate-800 rounded-2xl p-4 border transition-all hover:shadow-lg dark:hover:shadow-lg ${isMedal
                                ? 'border-yellow-200 dark:border-yellow-800/50 shadow-md dark:shadow-md'
                                : 'border-slate-200 dark:border-slate-700'}`, children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4 flex-1", children: [_jsx("div", { className: `w-12 h-12 rounded-full bg-gradient-to-br ${medalColor} flex items-center justify-center flex-shrink-0`, children: medalIcon ? (_jsx("span", { className: "text-xl", children: medalIcon })) : (_jsxs("span", { className: "text-lg font-bold text-white", children: ["#", rank] })) }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-bold text-slate-900 dark:text-white text-lg", children: player.username }), _jsxs("div", { className: "flex items-center gap-2 mt-1", children: [_jsxs("span", { className: "inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold", children: ["Level ", player.level] }), player.isStreaming && (_jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-semibold", children: [_jsx("span", { className: "w-2 h-2 bg-red-500 rounded-full animate-pulse" }), "Live"] }))] })] })] }), _jsxs("div", { className: "text-right flex-shrink-0", children: [_jsxs("div", { className: "flex items-center gap-1 justify-end mb-1", children: [_jsx(Zap, { className: "w-4 h-4 text-yellow-500" }), _jsx("p", { className: "text-2xl font-bold text-slate-900 dark:text-white", children: player.points.toLocaleString() })] }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Points" })] })] }), idx === 0 && (_jsx("div", { className: "mt-3 w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full", style: { width: '100%' } }) })), idx === 1 && (_jsx("div", { className: "mt-3 w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-gradient-to-r from-gray-300 to-gray-500 rounded-full", style: {
                                            width: `${(player.points / leaderboard.leaderboard[0].points) * 100}%`
                                        } }) })), idx === 2 && (_jsx("div", { className: "mt-3 w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full", style: {
                                            width: `${(player.points / leaderboard.leaderboard[0].points) * 100}%`
                                        } }) }))] }, player.id));
                    }) })) : (_jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-2xl p-8 text-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700", children: [_jsx("p", { className: "mb-2", children: "No players yet" }), _jsx("p", { className: "text-sm", children: "Start playing to appear on the leaderboard!" })] })), _jsxs("div", { className: "mt-8 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700", children: [_jsxs("h3", { className: "font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2", children: [_jsx(Medal, { className: "w-5 h-5 text-amber-600 dark:text-amber-400" }), "About Rankings"] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-2xl mb-2", children: "\uD83E\uDD47" }), _jsx("p", { className: "text-sm font-semibold text-slate-900 dark:text-white", children: "1st Place" }), _jsx("p", { className: "text-sm text-slate-600 dark:text-slate-400", children: "Gold Badge" })] }), _jsxs("div", { children: [_jsx("p", { className: "text-2xl mb-2", children: "\uD83E\uDD48" }), _jsx("p", { className: "text-sm font-semibold text-slate-900 dark:text-white", children: "2nd Place" }), _jsx("p", { className: "text-sm text-slate-600 dark:text-slate-400", children: "Silver Badge" })] }), _jsxs("div", { children: [_jsx("p", { className: "text-2xl mb-2", children: "\uD83E\uDD49" }), _jsx("p", { className: "text-sm font-semibold text-slate-900 dark:text-white", children: "3rd Place" }), _jsx("p", { className: "text-sm text-slate-600 dark:text-slate-400", children: "Bronze Badge" })] })] })] })] }) }));
}

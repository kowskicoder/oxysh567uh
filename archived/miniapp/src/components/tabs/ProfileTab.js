import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../../store/useAppStore';
import { apiClient } from '../../lib/api';
import { Award, TrendingUp, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
export default function ProfileTab() {
    const { user } = useAppStore();
    const { data: stats } = useQuery({
        queryKey: ['stats'],
        queryFn: () => apiClient.getStats(),
    });
    const { data: achievements } = useQuery({
        queryKey: ['achievements'],
        queryFn: () => apiClient.getAchievements(),
    });
    const { data: leaderboard } = useQuery({
        queryKey: ['leaderboard'],
        queryFn: () => apiClient.getLeaderboard(10),
    });
    if (!user)
        return null;
    return (_jsxs("div", { className: "min-h-screen bg-dark-bg theme-transition pb-[100px]", children: [_jsx("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "bg-gradient-to-br from-blue-900/40 to-purple-900/40 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl p-6 border border-blue-800/30 dark:border-blue-700/20 mb-6 shadow-lg backdrop-blur", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx(motion.div, { whileHover: { scale: 1.05 }, className: "w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 shadow-lg", children: user.firstName?.[0] || '👤' }), _jsxs("div", { className: "flex-1", children: [_jsxs("h2", { className: "text-2xl font-bold text-white", children: [user.firstName, " ", user.lastName] }), _jsxs("p", { className: "text-blue-300 text-sm", children: ["@", user.username] }), _jsxs("div", { className: "flex items-center gap-2 mt-3 flex-wrap", children: [_jsxs("span", { className: "inline-block px-3 py-1 bg-blue-600/50 border border-blue-500/50 text-blue-200 rounded-full text-xs font-semibold", children: ["Level ", user.level] }), _jsxs("span", { className: "inline-block px-3 py-1 bg-amber-600/50 border border-amber-500/50 text-amber-200 rounded-full text-xs font-semibold", children: [_jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: idx * 0.1 }, whileHover: { scale: 1.05 }, className: `${stat.bg} rounded-2xl p-4 border border-slate-700/50 text-center backdrop-blur transition-all duration-300`, children: [_jsx(motion.div, { className: `w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-3 shadow-lg`, whileHover: { rotate: 10 }, children: _jsx(Icon, { className: "w-5 h-5 text-white" }) }), _jsx("p", { className: "text-slate-400 text-xs font-medium mb-2", children: stat.label }), _jsx("p", { className: `text-3xl font-bold ${stat.textColor}`, children: stat.value })] }, idx), ") })}"] })] }), stats && (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.2 }, className: "mb-6", children: [_jsxs("h3", { className: "text-lg font-bold text-white mb-4 flex items-center gap-2", children: [_jsx("div", { className: "w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/50 flex items-center justify-center", children: _jsx(TrendingUp, { size: 18, className: "text-blue-400" }) }), "Statistics"] }), _jsx("div", { className: "grid grid-cols-2 gap-3", children: [
                                                        { label: 'Participations', value: stats?.stats?.participationCount || 0, icon: '🎯' },
                                                        { label: 'Created', value: stats?.stats?.challengesCreated || 0, icon: '✏️' },
                                                        { label: 'Accepted', value: stats?.stats?.challengesAccepted || 0, icon: '🤝' },
                                                        { label: 'Win Rate', value: `${stats?.stats?.winRate || 0}%`, icon: '🏆' },
                                                    ].map((stat, idx) => (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.3 + idx * 0.05 }, whileHover: { scale: 1.02 }, className: "bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-slate-600/75 transition-colors", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-xs font-medium mb-1", children: stat.label }), _jsx("p", { className: "text-2xl font-bold text-white", children: stat.value })] }), _jsx("span", { className: "text-2xl", children: stat.icon })] }) }, idx))) })] })), achievements && (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.3 }, className: "mb-6", children: [_jsxs("h3", { className: "text-lg font-bold text-white mb-4 flex items-center gap-2", children: [_jsx("div", { className: "w-8 h-8 rounded-lg bg-amber-600/30 border border-amber-500/50 flex items-center justify-center", children: _jsx(Award, { size: 18, className: "text-amber-400" }) }), "Achievements"] }), _jsx("div", { className: "grid grid-cols-3 gap-3", children: _jsx(AnimatePresence, { children: achievements?.achievements?.slice(0, 6).map((achievement, idx) => (_jsxs(motion.div, { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 }, transition: { delay: 0.4 + idx * 0.05 }, whileHover: { scale: 1.05 }, className: `bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 text-center transition-all ${!achievement.unlocked ? 'opacity-40' : ''}`, children: [_jsx("div", { className: "text-4xl mb-2", children: achievement.icon || '🏆' }), _jsx("p", { className: "text-xs font-semibold text-white truncate", children: achievement.name })] }, idx))) }) })] })), leaderboard && (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.4 }, children: [_jsxs("h3", { className: "text-lg font-bold text-white mb-4 flex items-center gap-2", children: [_jsx("div", { className: "w-8 h-8 rounded-lg bg-yellow-600/30 border border-yellow-500/50 flex items-center justify-center", children: _jsx(Zap, { size: 18, className: "text-yellow-400" }) }), "Top Players"] }), _jsx("div", { className: "bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden backdrop-blur", children: _jsx("div", { className: "divide-y divide-slate-700/50", children: leaderboard?.leaderboard?.map((player, idx) => {
                                                            const medals = ['🥇', '🥈', '🥉'];
                                                            const medal = medals[idx] || null;
                                                            return (_jsxs(motion.div, { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, transition: { delay: 0.5 + idx * 0.05 }, whileHover: { backgroundColor: 'rgba(30,41,59,0.8)' }, className: "p-4 flex items-center justify-between transition-colors", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: `w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-lg ${idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                                                                                    idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500' :
                                                                                        idx === 2 ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                                                                                            'bg-slate-600'}`, children: medal || idx + 1 }), _jsxs("div", { children: [_jsx("p", { className: "text-white font-semibold text-sm", children: player.username }), _jsxs("p", { className: "text-slate-400 text-xs", children: ["Level ", player.level] })] })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-white font-bold", children: player.points }), _jsx("p", { className: "text-slate-400 text-xs", children: "\u2B50 pts" })] })] }, player.id));
                                                        }) }) })] }))] })] }), ") }", _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-slate-900 dark:text-white", children: player.username }), _jsxs("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: ["Level ", player.level] })] })] }) }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "font-bold text-slate-900 dark:text-white", children: player.points.toLocaleString() }), _jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Points" })] })] }));
}
div >
;
div >
;
div >
;
div >
;
div >
;

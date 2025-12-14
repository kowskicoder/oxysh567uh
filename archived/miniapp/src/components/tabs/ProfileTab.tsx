import { useQuery } from '@tanstack/react-query'
import { useAppStore } from '../../store/useAppStore'
import { apiClient } from '../../lib/api'
import { Award, TrendingUp, Zap, Star, Trophy, Flame, Send, Bookmark } from 'lucide-react'
import { formatBalance } from '../../utils/currencyUtils'
import { motion, AnimatePresence } from 'framer-motion'

export default function ProfileTab() {
  const { user } = useAppStore()

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => apiClient.getStats(),
  })

  const { data: achievements } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => apiClient.getAchievements(),
  })

  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => apiClient.getLeaderboard(10),
  })

  if (!user) return null

  return (
    <div className="min-h-screen bg-dark-bg theme-transition pb-[100px]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Profile Card with Gradient */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl p-6 border border-blue-800/30 dark:border-blue-700/20 mb-6 shadow-lg backdrop-blur"
        >
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 shadow-lg"
            >
              {user.firstName?.[0] || '👤'}
            </motion.div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-blue-300 text-sm">@{user.username}</p>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="inline-block px-3 py-1 bg-blue-600/50 border border-blue-500/50 text-blue-200 rounded-full text-xs font-semibold">
                  Level {user.level}
                </span>
                <span className="inline-block px-3 py-1 bg-amber-600/50 border border-amber-500/50 text-amber-200 rounded-full text-xs font-semibold">
                  {user.xp} XP
                </span>
                <span className="inline-block px-3 py-1 bg-emerald-600/50 border border-emerald-500/50 text-emerald-200 rounded-full text-xs font-semibold">
                  {user.points} Pts
                </span>
              </div>
            </div>
          </motion.div>

        {/* Stats Grid with Icons */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { icon: Trophy, label: 'Level', value: user.level, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-900/20', textColor: 'text-blue-400' },
            { icon: Flame, label: 'XP', value: user.xp, color: 'from-amber-500 to-orange-600', bg: 'bg-amber-900/20', textColor: 'text-amber-400' },
            { icon: Star, label: 'Points', value: user.points, color: 'from-emerald-500 to-green-600', bg: 'bg-emerald-900/20', textColor: 'text-emerald-400' },
          ].map((stat, idx) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className={`${stat.bg} rounded-2xl p-4 border border-slate-700/50 text-center backdrop-blur transition-all duration-300`}
              >
                <motion.div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-3 shadow-lg`}
                  whileHover={{ rotate: 10 }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </motion.div>
                <p className="text-slate-400 text-xs font-medium mb-2">{stat.label}</p>
                <p className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
              </motion.div>
            )
          })}
        </div>

        {/* Statistics Section */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/50 flex items-center justify-center">
                <TrendingUp size={18} className="text-blue-400" />
              </div>
              Statistics
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Participations', value: stats?.stats?.participationCount || 0, icon: '🎯' },
                { label: 'Created', value: stats?.stats?.challengesCreated || 0, icon: '✏️' },
                { label: 'Accepted', value: stats?.stats?.challengesAccepted || 0, icon: '🤝' },
                { label: 'Win Rate', value: `${(stats?.stats as any)?.winRate || 0}%`, icon: '🏆' },
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + idx * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-slate-600/75 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-xs font-medium mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                    </div>
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Achievements Section */}
        {achievements && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-600/30 border border-amber-500/50 flex items-center justify-center">
                <Award size={18} className="text-amber-400" />
              </div>
              Achievements
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <AnimatePresence>
                {achievements?.achievements?.slice(0, 6).map((achievement: any, idx: number) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + idx * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    className={`bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 text-center transition-all ${
                      !achievement.unlocked ? 'opacity-40' : ''
                    }`}
                  >
                    <div className="text-4xl mb-2">{achievement.icon || '🏆'}</div>
                    <p className="text-xs font-semibold text-white truncate">{achievement.name}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Top Players Leaderboard */}
        {leaderboard && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-yellow-600/30 border border-yellow-500/50 flex items-center justify-center">
                <Zap size={18} className="text-yellow-400" />
              </div>
              Top Players
            </h3>
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden backdrop-blur">
              <div className="divide-y divide-slate-700/50">
                {leaderboard?.leaderboard?.map((player: any, idx: number) => {
                  const medals = ['🥇', '🥈', '🥉']
                  const medal = medals[idx] || null

                  return (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + idx * 0.05 }}
                      whileHover={{ backgroundColor: 'rgba(30,41,59,0.8)' }}
                      className="p-4 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-lg ${
                            idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 
                            idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500' : 
                            idx === 2 ? 'bg-gradient-to-br from-amber-400 to-amber-600' : 
                            'bg-slate-600'
                          }`}
                        >
                          {medal || idx + 1}
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">{player.username}</p>
                          <p className="text-slate-400 text-xs">Level {player.level}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">{player.points}</p>
                        <p className="text-slate-400 text-xs">⭐ pts</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{player.username}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Level {player.level}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 dark:text-white">{player.points.toLocaleString()}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Points</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

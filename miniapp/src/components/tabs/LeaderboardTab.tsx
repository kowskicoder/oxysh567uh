import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../lib/api'
import { Zap, Crown, Medal } from 'lucide-react'

export default function LeaderboardTab() {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => apiClient.getLeaderboard(100),
  })

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-400 to-yellow-600'
      case 2:
        return 'from-gray-300 to-gray-500'
      case 3:
        return 'from-amber-400 to-amber-600'
      default:
        return 'from-slate-400 to-slate-600'
    }
  }

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition pb-[50px]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <Crown className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Global Leaderboard</h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">Top players by points</p>
        </div>

        {/* Leaderboard */}
        {isLoading ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            Loading leaderboard...
          </div>
        ) : leaderboard?.leaderboard?.length ? (
          <div className="space-y-3">
            {leaderboard.leaderboard.map((player: any, idx: number) => {
              const rank = idx + 1
              const isMedal = rank <= 3
              const medalIcon = getMedalIcon(rank)
              const medalColor = getMedalColor(rank)

              return (
                <div
                  key={player.id}
                  className={`bg-white dark:bg-slate-800 rounded-2xl p-4 border transition-all hover:shadow-lg dark:hover:shadow-lg ${
                    isMedal
                      ? 'border-yellow-200 dark:border-yellow-800/50 shadow-md dark:shadow-md'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {/* Rank & Player Info */}
                    <div className="flex items-center gap-4 flex-1">
                      {/* Rank Badge */}
                      <div
                        className={`w-12 h-12 rounded-full bg-gradient-to-br ${medalColor} flex items-center justify-center flex-shrink-0`}
                      >
                        {medalIcon ? (
                          <span className="text-xl">{medalIcon}</span>
                        ) : (
                          <span className="text-lg font-bold text-white">#{rank}</span>
                        )}
                      </div>

                      {/* Player Details */}
                      <div className="flex-1">
                        <p className="font-bold text-slate-900 dark:text-white text-lg">
                          {player.username}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold">
                            Level {player.level}
                          </span>
                          {player.isStreaming && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-semibold">
                              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                              Live
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Points */}
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1 justify-end mb-1">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                          {player.points.toLocaleString()}
                        </p>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Points</p>
                    </div>
                  </div>

                  {/* Progress Bar (optional visual) */}
                  {idx === 0 && (
                    <div className="mt-3 w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  )}
                  {idx === 1 && (
                    <div className="mt-3 w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-gray-300 to-gray-500 rounded-full"
                        style={{
                          width: `${(player.points / leaderboard.leaderboard[0].points) * 100}%`
                        }}
                      ></div>
                    </div>
                  )}
                  {idx === 2 && (
                    <div className="mt-3 w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"
                        style={{
                          width: `${(player.points / leaderboard.leaderboard[0].points) * 100}%`
                        }}
                      ></div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <p className="mb-2">No players yet</p>
            <p className="text-sm">Start playing to appear on the leaderboard!</p>
          </div>
        )}

        {/* Legend */}
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Medal className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            About Rankings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-2xl mb-2">🥇</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">1st Place</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Gold Badge</p>
            </div>
            <div>
              <p className="text-2xl mb-2">🥈</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">2nd Place</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Silver Badge</p>
            </div>
            <div>
              <p className="text-2xl mb-2">🥉</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">3rd Place</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Bronze Badge</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useQuery } from '@tanstack/react-query'
import { useAppStore } from '../../store/useAppStore'
import { apiClient } from '../../lib/api'
import { ArrowDownLeft, ArrowUpRight, Plus, Minus, ArrowLeftRight, Wallet, ShoppingCart, TrendingUp, Send, Download } from 'lucide-react'
import { useState } from 'react'
import DepositModal from '../modals/DepositModal'
import WithdrawModal from '../modals/WithdrawModal'
import { formatBalance } from '../../utils/currencyUtils'
import { formatDistanceToNow } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

export default function WalletTab() {
  const { user } = useAppStore()
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)

  const { data: wallet, isLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => apiClient.getWallet(),
  })

  if (!user) return null

  const currentBalance = wallet?.wallet?.balance || 0
  const currentCoins = wallet?.wallet?.coins || 0

  return (
    <div className="min-h-screen bg-dark-bg theme-transition pb-[100px]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Balance Cards Grid with Animations */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Main Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 rounded-2xl p-4 border border-emerald-800/30 shadow-lg backdrop-blur"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center gap-1 text-emerald-400">
                <TrendingUp className="w-3 h-3" />
                <span className="text-xs font-medium">Active</span>
              </div>
            </div>
            <p className="text-xs text-emerald-300 font-medium mb-1">Main Balance</p>
            <h3 className="text-2xl font-bold text-white">
              {formatBalance(currentBalance)}
            </h3>
          </motion.div>

          {/* Gaming Coins Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-amber-900/40 to-orange-900/40 rounded-2xl p-4 border border-amber-800/30 shadow-lg backdrop-blur"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <motion.div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                <span className="text-xs font-bold text-white">
                  {currentCoins > 999 ? "K+" : ""}
                </span>
              </motion.div>
            </div>
            <p className="text-xs text-amber-300 font-medium mb-1">Bantah Bucks</p>
            <h3 className="text-2xl font-bold text-white">
              {currentCoins.toLocaleString()}
            </h3>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 mb-6 backdrop-blur"
        >
          <h3 className="text-base font-bold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-3 gap-2">
            {/* Deposit Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowDepositModal(true)}
              className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 rounded-xl p-3 border border-blue-700/50 cursor-pointer hover:border-blue-600/75 transition-colors"
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center shadow-lg">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <h4 className="font-semibold text-blue-300 text-xs">Add Money</h4>
              </div>
            </motion.button>

            {/* Withdraw Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowWithdrawModal(true)}
              className="bg-gradient-to-br from-orange-900/40 to-orange-800/40 rounded-xl p-3 border border-orange-700/50 cursor-pointer hover:border-orange-600/75 transition-colors"
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-lg">
                  <Download className="w-4 h-4 text-white" />
                </div>
                <h4 className="font-semibold text-orange-300 text-xs">Withdraw</h4>
              </div>
            </motion.button>

            {/* Placeholder for future actions */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-slate-700/30 rounded-xl p-3 border border-slate-700/50 opacity-40 cursor-not-allowed"
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-8 h-8 rounded-xl bg-slate-600 flex items-center justify-center">
                  <ArrowLeftRight className="w-4 h-4 text-slate-400" />
                </div>
                <h4 className="font-semibold text-slate-400 text-xs">Swap</h4>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 rounded-2xl p-4 border border-emerald-800/30 backdrop-blur"
          >
            <p className="text-emerald-300 text-sm mb-2 font-medium">Total Earned</p>
            <p className="text-2xl font-bold text-emerald-100">
              {formatBalance(wallet?.wallet?.totalEarned || 0)}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-red-900/40 to-rose-900/40 rounded-2xl p-4 border border-red-800/30 backdrop-blur"
          >
            <p className="text-red-300 text-sm mb-2 font-medium">Total Spent</p>
            <p className="text-2xl font-bold text-red-100">
              {formatBalance(wallet?.wallet?.totalSpent || 0)}
            </p>
          </motion.div>
        </div>

        {/* Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600/30 border border-purple-500/50 flex items-center justify-center">
              <TrendingUp size={18} className="text-purple-400" />
            </div>
            Recent Transactions
          </h3>
          <div className="space-y-2">
            {isLoading ? (
              <div className="bg-slate-800/50 rounded-2xl p-6 text-center text-slate-400 border border-slate-700/50 backdrop-blur">
                Loading transactions...
              </div>
            ) : wallet?.recentTransactions?.length ? (
              <AnimatePresence>
                {wallet.recentTransactions.map((tx: any, idx: number) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + idx * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                    className={`rounded-xl p-4 border flex items-center justify-between backdrop-blur transition-colors ${
                      tx.type === 'deposit'
                        ? 'bg-green-900/20 border-green-800/30 hover:border-green-700/50'
                        : 'bg-red-900/20 border-red-800/30 hover:border-red-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <motion.div
                        whileHover={{ rotate: 10 }}
                        className={`p-3 rounded-lg ${
                          tx.type === 'deposit'
                            ? 'bg-green-900/40'
                            : 'bg-red-900/40'
                        }`}
                      >
                        {tx.type === 'deposit' ? (
                          <ArrowDownLeft className={`w-5 h-5 ${tx.type === 'deposit' ? 'text-green-400' : 'text-red-400'}`} />
                        ) : (
                          <ArrowUpRight className={`w-5 h-5 ${tx.type === 'deposit' ? 'text-green-400' : 'text-red-400'}`} />
                        )}
                      </motion.div>
                      <div>
                        <p className="font-semibold text-white capitalize">
                          {tx.type.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-slate-400">
                          {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.amount > 0 ? '+' : ''}{formatBalance(Math.abs(tx.amount))}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div className="bg-slate-800/50 rounded-2xl p-6 text-center text-slate-400 border border-slate-700/50 backdrop-blur">
                No transactions yet
              </div>
            )}
          </div>
        </motion.div>

        {/* Deposit Modal */}
        {showDepositModal && (
          <DepositModal onClose={() => setShowDepositModal(false)} />
        )}

        {/* Withdraw Modal */}
        {showWithdrawModal && (
          <WithdrawModal
            balance={currentBalance}
            onClose={() => setShowWithdrawModal(false)}
          />
        )}
      </div>
    </div>
  )
}


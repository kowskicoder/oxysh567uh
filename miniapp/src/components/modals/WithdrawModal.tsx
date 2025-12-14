import { useState } from 'react'
import { X } from 'lucide-react'
import { apiClient } from '../../lib/api'
import { useQueryClient } from '@tanstack/react-query'
import { formatBalance } from '../../utils/currencyUtils'

interface WithdrawModalProps {
  balance: number
  onClose: () => void
}

export default function WithdrawModal({ balance, onClose }: WithdrawModalProps) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const queryClient = useQueryClient()

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    const withdrawAmount = parseFloat(amount)
    if (withdrawAmount > balance) {
      setError(`Insufficient balance. Available: ${formatBalance(balance)}`)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.initiateWithdraw(withdrawAmount)
      
      if (response.success) {
        setSuccess(true)
        setAmount('')
        queryClient.invalidateQueries({ queryKey: ['wallet'] })
        
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        setError(response.message || 'Failed to process withdrawal')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process withdrawal')
    } finally {
      setLoading(false)
    }
  }

  const quickAmounts = [5000, 10000, 25000, 50000]

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end z-50">
        <div className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 rounded-t-3xl p-6 space-y-4">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Withdrawal Pending</h2>
            <p className="text-slate-600 dark:text-slate-400">Your withdrawal of {formatBalance(parseFloat(amount))} has been submitted.</p>
            <p className="text-sm text-slate-500 dark:text-slate-500">Processing typically takes 1-3 business days.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end z-50">
      <div className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 rounded-t-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Withdraw Funds</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
            <X size={24} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Available Balance */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 rounded-2xl p-4 border border-blue-200 dark:border-blue-800/30">
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Available Balance</p>
          <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{formatBalance(balance)}</p>
        </div>

        {/* Amount Input */}
        <div>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-3">Withdrawal Amount (₦)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            max={balance}
            className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>

        {/* Quick Amounts */}
        <div>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-3">Quick Select</label>
          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map((quickAmount) => (
              <button
                key={quickAmount}
                onClick={() => setAmount(Math.min(quickAmount, balance).toString())}
                disabled={quickAmount > balance}
                className={`py-2.5 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  amount === Math.min(quickAmount, balance).toString()
                    ? 'bg-orange-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:border-orange-500 dark:hover:border-orange-500 disabled:border-slate-200 dark:disabled:border-slate-700'
                }`}
              >
                ₦{(quickAmount / 1000).toFixed(0)}k
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-3 text-blue-700 dark:text-blue-400 text-sm">
          Withdrawals typically process within 1-3 business days to your registered bank account.
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-3 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white py-3 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleWithdraw}
            disabled={loading || !amount || parseFloat(amount) > balance}
            className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white py-3 rounded-xl font-semibold transition"
          >
            {loading ? 'Processing...' : 'Request Withdrawal'}
          </button>
        </div>
      </div>
    </div>
  )
}

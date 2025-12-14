import { useState } from 'react'
import { X } from 'lucide-react'
import { apiClient } from '../../lib/api'
import { useQueryClient } from '@tanstack/react-query'

interface DepositModalProps {
  onClose: () => void
}

interface PaystackResponse {
  status: boolean
  message: string
  data?: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

export default function DepositModal({ onClose }: DepositModalProps) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = (await apiClient.initiateDeposit(parseFloat(amount))) as PaystackResponse

      if (response.data?.authorization_url && response.data?.access_code) {
        // Use PaystackPop for inline payment
        const paystackHandler = (window as any).PaystackPop.setup({
          key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_e5b654238ec8b876522d3683df444025657d796f',
          email: 'user@bantah.app',
          amount: parseFloat(amount) * 100,
          currency: 'NGN',
          ref: response.data.reference,
          onClose: () => {
            setLoading(false)
          },
          callback: async (result: any) => {
            if (result.status === 'success') {
              // Payment successful - wallet will be updated by webhook
              queryClient.invalidateQueries({ queryKey: ['wallet'] })
              onClose()
            } else {
              setError('Payment verification failed')
            }
          }
        })
        
        paystackHandler.openIframe()
      } else if (response.data?.authorization_url) {
        // Fallback: redirect to Paystack hosted payment page
        window.location.href = response.data.authorization_url
      } else {
        setError('Failed to initialize payment')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate deposit')
    } finally {
      setLoading(false)
    }
  }

  const quickAmounts = [5000, 10000, 50000, 100000]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end z-50">
      <div className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 rounded-t-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Add Money</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
            <X size={24} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Amount Input */}
        <div>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-3">Amount (₦)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
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
                onClick={() => setAmount(quickAmount.toString())}
                className={`py-2.5 rounded-lg font-semibold transition ${
                  amount === quickAmount.toString()
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:border-blue-500 dark:hover:border-blue-500'
                }`}
              >
                ₦{(quickAmount / 1000).toFixed(0)}k
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-3 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-3 text-blue-700 dark:text-blue-400 text-sm">
          Secure payment powered by Paystack
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white py-3 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleDeposit}
            disabled={loading || !amount}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-xl font-semibold transition"
          >
            {loading ? 'Processing...' : 'Continue to Payment'}
          </button>
        </div>
      </div>
    </div>
  )
}

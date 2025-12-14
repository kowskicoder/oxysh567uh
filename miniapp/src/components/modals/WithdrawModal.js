import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { X } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { formatBalance } from '../../utils/currencyUtils';
export default function WithdrawModal({ balance, onClose }) {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const queryClient = useQueryClient();
    const handleWithdraw = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }
        const withdrawAmount = parseFloat(amount);
        if (withdrawAmount > balance) {
            setError(`Insufficient balance. Available: ${formatBalance(balance)}`);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.initiateWithdraw(withdrawAmount);
            if (response.success) {
                setSuccess(true);
                setAmount('');
                queryClient.invalidateQueries({ queryKey: ['wallet'] });
                setTimeout(() => {
                    onClose();
                }, 2000);
            }
            else {
                setError(response.message || 'Failed to process withdrawal');
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process withdrawal');
        }
        finally {
            setLoading(false);
        }
    };
    const quickAmounts = [5000, 10000, 25000, 50000];
    if (success) {
        return (_jsx("div", { className: "fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end z-50", children: _jsx("div", { className: "w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 rounded-t-3xl p-6 space-y-4", children: _jsxs("div", { className: "text-center space-y-4", children: [_jsx("div", { className: "w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto", children: _jsx("svg", { className: "w-8 h-8 text-green-600 dark:text-green-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }) }), _jsx("h2", { className: "text-2xl font-bold text-slate-900 dark:text-white", children: "Withdrawal Pending" }), _jsxs("p", { className: "text-slate-600 dark:text-slate-400", children: ["Your withdrawal of ", formatBalance(parseFloat(amount)), " has been submitted."] }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-500", children: "Processing typically takes 1-3 business days." })] }) }) }));
    }
    return (_jsx("div", { className: "fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end z-50", children: _jsxs("div", { className: "w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 rounded-t-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h2", { className: "text-2xl font-bold text-slate-900 dark:text-white", children: "Withdraw Funds" }), _jsx("button", { onClick: onClose, className: "p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition", children: _jsx(X, { size: 24, className: "text-slate-600 dark:text-slate-400" }) })] }), _jsxs("div", { className: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 rounded-2xl p-4 border border-blue-200 dark:border-blue-800/30", children: [_jsx("p", { className: "text-sm text-blue-600 dark:text-blue-400 font-medium mb-1", children: "Available Balance" }), _jsx("p", { className: "text-3xl font-bold text-blue-900 dark:text-blue-100", children: formatBalance(balance) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-3", children: "Withdrawal Amount (\u20A6)" }), _jsx("input", { type: "number", value: amount, onChange: (e) => setAmount(e.target.value), placeholder: "Enter amount", max: balance, className: "w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 placeholder-slate-400 dark:placeholder-slate-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-3", children: "Quick Select" }), _jsx("div", { className: "grid grid-cols-4 gap-2", children: quickAmounts.map((quickAmount) => (_jsxs("button", { onClick: () => setAmount(Math.min(quickAmount, balance).toString()), disabled: quickAmount > balance, className: `py-2.5 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${amount === Math.min(quickAmount, balance).toString()
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:border-orange-500 dark:hover:border-orange-500 disabled:border-slate-200 dark:disabled:border-slate-700'}`, children: ["\u20A6", (quickAmount / 1000).toFixed(0), "k"] }, quickAmount))) })] }), _jsx("div", { className: "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-3 text-blue-700 dark:text-blue-400 text-sm", children: "Withdrawals typically process within 1-3 business days to your registered bank account." }), error && (_jsx("div", { className: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-3 text-red-700 dark:text-red-400 text-sm", children: error })), _jsxs("div", { className: "flex gap-3 pt-4", children: [_jsx("button", { onClick: onClose, className: "flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white py-3 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition", children: "Cancel" }), _jsx("button", { onClick: handleWithdraw, disabled: loading || !amount || parseFloat(amount) > balance, className: "flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white py-3 rounded-xl font-semibold transition", children: loading ? 'Processing...' : 'Request Withdrawal' })] })] }) }));
}

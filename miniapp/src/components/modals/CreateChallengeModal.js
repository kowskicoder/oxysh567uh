import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { X } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useQueryClient } from '@tanstack/react-query';
export default function CreateChallengeModal({ onClose }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'gaming',
        wagerAmount: '',
        deadline: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const queryClient = useQueryClient();
    const categories = ['gaming', 'sports', 'crypto', 'skills', 'other'];
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.description || !formData.wagerAmount || !formData.deadline) {
            setError('Please fill in all fields');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await apiClient.createChallenge({
                ...formData,
                wagerAmount: parseFloat(formData.wagerAmount),
            });
            queryClient.invalidateQueries({ queryKey: ['challenges'] });
            onClose();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create challenge');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-end z-50", children: _jsxs("div", { className: "w-full bg-dark-card border-t border-dark-border rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h2", { className: "text-xl font-bold", children: "Create Challenge" }), _jsx("button", { onClick: onClose, className: "p-1 hover:bg-dark-bg rounded-lg", children: _jsx(X, { size: 24 }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-400 block mb-2", children: "Challenge Title" }), _jsx("input", { type: "text", name: "title", value: formData.title, onChange: handleChange, placeholder: "e.g., Beat me at FIFA 25", className: "w-full bg-dark-bg text-white rounded-lg px-4 py-3 border border-dark-border focus:outline-none focus:border-primary" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-400 block mb-2", children: "Description" }), _jsx("textarea", { name: "description", value: formData.description, onChange: handleChange, placeholder: "Describe the challenge...", rows: 3, className: "w-full bg-dark-bg text-white rounded-lg px-4 py-3 border border-dark-border focus:outline-none focus:border-primary resize-none" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-400 block mb-2", children: "Category" }), _jsx("select", { name: "category", value: formData.category, onChange: handleChange, className: "w-full bg-dark-bg text-white rounded-lg px-4 py-3 border border-dark-border focus:outline-none focus:border-primary", children: categories.map((cat) => (_jsx("option", { value: cat, children: cat.charAt(0).toUpperCase() + cat.slice(1) }, cat))) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-400 block mb-2", children: "Wager Amount (\u20A6)" }), _jsx("input", { type: "number", name: "wagerAmount", value: formData.wagerAmount, onChange: handleChange, placeholder: "1000", min: "1", className: "w-full bg-dark-bg text-white rounded-lg px-4 py-3 border border-dark-border focus:outline-none focus:border-primary" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-400 block mb-2", children: "Deadline" }), _jsx("input", { type: "datetime-local", name: "deadline", value: formData.deadline, onChange: handleChange, className: "w-full bg-dark-bg text-white rounded-lg px-4 py-3 border border-dark-border focus:outline-none focus:border-primary" })] }), error && (_jsx("div", { className: "bg-danger/20 border border-danger/50 rounded-lg p-3 text-danger text-sm", children: error })), _jsxs("div", { className: "flex gap-3 pt-4 pb-4", children: [_jsx("button", { type: "button", onClick: onClose, className: "flex-1 bg-dark-bg border border-dark-border text-white py-3 rounded-lg font-semibold hover:bg-dark-bg/80 transition", children: "Cancel" }), _jsx("button", { type: "submit", disabled: loading, className: "flex-1 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white py-3 rounded-lg font-semibold transition", children: loading ? 'Creating...' : 'Create Challenge' })] })] })] }) }));
}

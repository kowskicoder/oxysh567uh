import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
export default function CreateChallengeModal({ onClose }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'gaming',
        wagerAmount: '',
        deadline: '',
        acceptedUserId: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searching, setSearching] = useState(false);
    const queryClient = useQueryClient();
    // Fetch suggested users when component mounts
    const { data: suggestions } = useQuery({
        queryKey: ['suggested-users'],
        queryFn: () => apiClient.getSuggestedUsers(),
    });
    const categories = ['gaming', 'sports', 'crypto', 'skills', 'other'];
    // Search users with debounce
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.trim().length >= 2) {
                setSearching(true);
                try {
                    const result = await apiClient.searchUsers(searchQuery);
                    setSearchResults(result.users || []);
                }
                catch (err) {
                    console.error('Search error:', err);
                    setSearchResults([]);
                }
                finally {
                    setSearching(false);
                }
            }
            else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };
    const selectUser = (user) => {
        setSelectedUser(user);
        setFormData((prev) => ({
            ...prev,
            acceptedUserId: user.id,
        }));
        setShowSearch(false);
        setSearchQuery('');
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
    return (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-end z-50 backdrop-blur-sm", children: _jsxs(motion.div, { initial: { y: 500, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: 500, opacity: 0 }, className: "w-full bg-dark-card border-t border-dark-border rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h2", { className: "text-2xl font-bold text-white", children: "Create Challenge" }), _jsx("button", { onClick: onClose, className: "p-1 hover:bg-dark-bg rounded-lg transition", children: _jsx(X, { size: 24, className: "text-gray-400 hover:text-white" }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-400 block mb-2", children: "Challenge Title *" }), _jsx("input", { type: "text", name: "title", value: formData.title, onChange: handleChange, placeholder: "e.g., Beat me at FIFA 25", className: "w-full bg-dark-bg text-white rounded-lg px-4 py-3 border border-dark-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-400 block mb-2", children: "Description *" }), _jsx("textarea", { name: "description", value: formData.description, onChange: handleChange, placeholder: "Describe the challenge rules and details...", rows: 3, className: "w-full bg-dark-bg text-white rounded-lg px-4 py-3 border border-dark-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 resize-none" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-400 block mb-2", children: "Category *" }), _jsx("select", { name: "category", value: formData.category, onChange: handleChange, className: "w-full bg-dark-bg text-white rounded-lg px-4 py-3 border border-dark-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50", children: categories.map((cat) => (_jsx("option", { value: cat, children: cat.charAt(0).toUpperCase() + cat.slice(1) }, cat))) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-400 block mb-2", children: "Wager Amount (\u20A6) *" }), _jsx("input", { type: "number", name: "wagerAmount", value: formData.wagerAmount, onChange: handleChange, placeholder: "1000", min: "100", step: "100", className: "w-full bg-dark-bg text-white rounded-lg px-4 py-3 border border-dark-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Minimum: \u20A6100" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-400 block mb-2", children: "Deadline *" }), _jsx("input", { type: "datetime-local", name: "deadline", value: formData.deadline, onChange: handleChange, className: "w-full bg-dark-bg text-white rounded-lg px-4 py-3 border border-dark-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-400 block mb-2", children: "Challenge Specific User (Optional)" }), selectedUser ? (_jsxs(motion.div, { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, className: "bg-primary/10 border border-primary/30 rounded-lg p-3 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [selectedUser.profileImageUrl && (_jsx("img", { src: selectedUser.profileImageUrl, alt: selectedUser.username, className: "w-8 h-8 rounded-full" })), _jsxs("div", { children: [_jsx("p", { className: "text-white font-semibold text-sm", children: selectedUser.displayName }), _jsxs("p", { className: "text-gray-400 text-xs", children: ["@", selectedUser.username] })] })] }), _jsx("button", { type: "button", onClick: () => {
                                                setSelectedUser(null);
                                                setFormData((prev) => ({ ...prev, acceptedUserId: '' }));
                                            }, className: "text-gray-400 hover:text-white transition", children: _jsx(X, { size: 16 }) })] })) : (_jsxs("button", { type: "button", onClick: () => setShowSearch(!showSearch), className: "w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-white hover:border-primary/50 transition flex items-center justify-center gap-2", children: [_jsx(Search, { size: 18 }), "Search for a player..."] })), _jsx(AnimatePresence, { children: showSearch && (_jsxs(motion.div, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, className: "mt-3 space-y-3", children: [_jsx("input", { type: "text", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: "Search by name or username...", className: "w-full bg-dark-bg text-white rounded-lg px-4 py-3 border border-primary/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50", autoFocus: true }), searching ? (_jsx("div", { className: "text-center py-4 text-gray-400", children: "Searching..." })) : searchQuery.length >= 2 && searchResults.length > 0 ? (_jsx("div", { className: "bg-dark-bg rounded-lg border border-dark-border overflow-hidden max-h-60 overflow-y-auto", children: searchResults.map((user) => (_jsxs("button", { type: "button", onClick: () => selectUser(user), className: "w-full p-3 hover:bg-dark-hover transition flex items-center gap-3 border-b border-dark-border last:border-b-0", children: [user.profileImageUrl && (_jsx("img", { src: user.profileImageUrl, alt: user.username, className: "w-8 h-8 rounded-full flex-shrink-0" })), _jsxs("div", { className: "flex-1 text-left", children: [_jsx("p", { className: "text-white font-semibold text-sm", children: user.displayName }), _jsxs("p", { className: "text-gray-400 text-xs", children: ["@", user.username, " \u2022 Level ", user.level] })] }), _jsx("div", { className: "text-right", children: _jsxs("p", { className: "text-primary text-xs font-semibold", children: [user.points, " pts"] }) })] }, user.id))) })) : searchQuery.length >= 2 ? (_jsx("div", { className: "text-center py-4 text-gray-400 text-sm", children: "No users found" })) : null, !searchQuery && suggestions && (_jsx("div", { className: "space-y-2", children: suggestions.topPlayers?.length > 0 && (_jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-500 font-semibold mb-2", children: "\uD83C\uDFC6 Top Players" }), _jsx("div", { className: "space-y-1", children: suggestions.topPlayers.slice(0, 3).map((user) => (_jsxs("button", { type: "button", onClick: () => selectUser(user), className: "w-full p-2 hover:bg-dark-hover transition flex items-center gap-2 rounded-lg text-sm", children: [_jsx("img", { src: user.profileImageUrl, alt: user.username, className: "w-6 h-6 rounded-full flex-shrink-0" }), _jsx("span", { className: "text-white flex-1 text-left", children: user.displayName }), _jsxs("span", { className: "text-primary text-xs", children: [user.points, " pts"] })] }, user.id))) })] })) }))] })) })] }), error && (_jsx(motion.div, { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, className: "bg-danger/20 border border-danger/50 rounded-lg p-3 text-danger text-sm", children: error })), _jsxs("div", { className: "flex gap-3 pt-4 pb-2", children: [_jsx("button", { type: "button", onClick: onClose, className: "flex-1 bg-dark-bg border border-dark-border text-white py-3 rounded-lg font-semibold hover:border-dark-border/80 transition", children: "Cancel" }), _jsx("button", { type: "submit", disabled: loading, className: "flex-1 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white py-3 rounded-lg font-semibold transition", children: loading ? 'Creating...' : 'Create Challenge' })] })] })] }) }));
}

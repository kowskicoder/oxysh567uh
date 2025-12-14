import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import CreateChallengeModal from '../modals/CreateChallengeModal';
export default function ChallengesTab() {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const { data: challenges, isLoading } = useQuery({
        queryKey: ['challenges'],
        queryFn: () => apiClient.getChallenges(),
    });
    return (_jsxs("div", { className: "p-4 space-y-6", children: [_jsxs("button", { onClick: () => setShowCreateModal(true), className: "w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition", children: [_jsx(Plus, { size: 20 }), "Create Challenge"] }), (challenges?.created?.length || 0) > 0 && (_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold mb-3", children: "Your Challenges" }), _jsx("div", { className: "space-y-3", children: challenges?.created?.map((challenge) => (_jsx(ChallengeCard, { challenge: challenge }, challenge.id))) })] })), (challenges?.accepted?.length || 0) > 0 && (_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold mb-3", children: "Accepted Challenges" }), _jsx("div", { className: "space-y-3", children: challenges?.accepted?.map((challenge) => (_jsx(ChallengeCard, { challenge: challenge }, challenge.id))) })] })), isLoading ? (_jsx("div", { className: "text-center py-8 text-gray-500", children: "Loading challenges..." })) : !challenges?.created?.length && !challenges?.accepted?.length ? (_jsxs("div", { className: "text-center py-12", children: [_jsx("p", { className: "text-gray-500 mb-4", children: "No challenges yet" }), _jsx("p", { className: "text-sm text-gray-600", children: "Create one to get started!" })] })) : null, showCreateModal && (_jsx(CreateChallengeModal, { onClose: () => setShowCreateModal(false) }))] }));
}
function ChallengeCard({ challenge }) {
    return (_jsxs("div", { className: "bg-dark-card rounded-lg p-4 border border-dark-border", children: [_jsxs("div", { className: "flex justify-between items-start mb-2", children: [_jsx("h4", { className: "font-semibold text-white flex-1", children: challenge.title }), _jsx("span", { className: `text-xs px-2 py-1 rounded-full font-semibold ${challenge.status === 'pending'
                            ? 'bg-yellow-500/20 text-warning'
                            : challenge.status === 'matched'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-green-500/20 text-success'}`, children: challenge.status })] }), _jsx("p", { className: "text-sm text-gray-400 mb-3", children: challenge.description }), _jsxs("div", { className: "grid grid-cols-2 gap-2 mb-3 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-500", children: "Wager" }), _jsxs("p", { className: "font-semibold", children: ["\u20A6", challenge.wagerAmount.toLocaleString()] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-500", children: "Category" }), _jsx("p", { className: "font-semibold capitalize", children: challenge.category })] })] }), challenge.winner && (_jsx("div", { className: "bg-dark-bg rounded-lg p-2 mb-3", children: _jsxs("p", { className: "text-sm text-gray-400", children: ["Winner: ", _jsx("span", { className: "text-success font-semibold", children: challenge.winner })] }) })), _jsx("button", { className: "w-full bg-dark-bg hover:bg-dark-bg/80 text-white py-2 rounded-lg font-semibold transition border border-dark-border", children: "View Details" })] }));
}

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../lib/api'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import CreateChallengeModal from '../modals/CreateChallengeModal'

export default function ChallengesTab() {
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data: challenges, isLoading } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => apiClient.getChallenges(),
  })

  return (
    <div className="p-4 space-y-6">
      {/* Create Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
      >
        <Plus size={20} />
        Create Challenge
      </button>

      {/* Created Challenges */}
      {(challenges?.created?.length || 0) > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Your Challenges</h3>
          <div className="space-y-3">
            {challenges?.created?.map((challenge: any) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </div>
      )}

      {/* Accepted Challenges */}
      {(challenges?.accepted?.length || 0) > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Accepted Challenges</h3>
          <div className="space-y-3">
            {challenges?.accepted?.map((challenge: any) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading challenges...</div>
      ) : !challenges?.created?.length && !challenges?.accepted?.length ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No challenges yet</p>
          <p className="text-sm text-gray-600">Create one to get started!</p>
        </div>
      ) : null}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateChallengeModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}

interface ChallengeCardProps {
  challenge: any
}

function ChallengeCard({ challenge }: ChallengeCardProps) {
  return (
    <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-white flex-1">{challenge.title}</h4>
        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
          challenge.status === 'pending'
            ? 'bg-yellow-500/20 text-warning'
            : challenge.status === 'matched'
            ? 'bg-blue-500/20 text-blue-300'
            : 'bg-green-500/20 text-success'
        }`}>
          {challenge.status}
        </span>
      </div>
      <p className="text-sm text-gray-400 mb-3">{challenge.description}</p>
      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
        <div>
          <p className="text-gray-500">Wager</p>
          <p className="font-semibold">₦{challenge.wagerAmount.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-500">Category</p>
          <p className="font-semibold capitalize">{challenge.category}</p>
        </div>
      </div>
      {challenge.winner && (
        <div className="bg-dark-bg rounded-lg p-2 mb-3">
          <p className="text-sm text-gray-400">Winner: <span className="text-success font-semibold">{challenge.winner}</span></p>
        </div>
      )}
      <button className="w-full bg-dark-bg hover:bg-dark-bg/80 text-white py-2 rounded-lg font-semibold transition border border-dark-border">
        View Details
      </button>
    </div>
  )
}

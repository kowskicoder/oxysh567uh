import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../lib/api'
import { useState } from 'react'
import { ChevronDown, Filter } from 'lucide-react'

export default function EventsTab() {
  const [category, setCategory] = useState<string>('')
  const [status, setStatus] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)

  const { data: events, isLoading } = useQuery({
    queryKey: ['events', category, status],
    queryFn: () => apiClient.getEvents(20, 0, category || undefined, status || undefined),
  })

  const categories = ['crypto', 'sports', 'gaming', 'music', 'politics']
  const statuses = ['active', 'pending', 'completed']

  return (
    <div className="p-4 space-y-4">
      {/* Filter Button */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="w-full bg-dark-card hover:bg-dark-card/80 text-white py-3 rounded-lg font-semibold flex items-center justify-between transition border border-dark-border"
      >
        <span className="flex items-center gap-2">
          <Filter size={20} />
          Filters
        </span>
        <ChevronDown size={20} className={`transition ${showFilters ? 'rotate-180' : ''}`} />
      </button>

      {/* Filters */}
      {showFilters && (
        <div className="bg-dark-card rounded-lg p-4 border border-dark-border space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-dark-bg text-white rounded-lg px-3 py-2 border border-dark-border focus:outline-none focus:border-primary"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-dark-bg text-white rounded-lg px-3 py-2 border border-dark-border focus:outline-none focus:border-primary"
            >
              <option value="">All Status</option>
              {statuses.map((st) => (
                <option key={st} value={st}>
                  {st.charAt(0).toUpperCase() + st.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading events...</div>
        ) : events?.events?.length ? (
          events.events.map((event: any) => (
            <div
              key={event.id}
              className="bg-dark-card rounded-lg p-4 border border-dark-border hover:border-primary transition cursor-pointer"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-white flex-1">{event.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                  event.status === 'active'
                    ? 'bg-green-500/20 text-success'
                    : event.status === 'pending'
                    ? 'bg-yellow-500/20 text-warning'
                    : 'bg-gray-500/20 text-gray-300'
                }`}>
                  {event.status}
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-3">{event.description}</p>
              <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                <div>
                  <p className="text-gray-500">Entry Fee</p>
                  <p className="font-semibold">₦{event.entryFee.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Category</p>
                  <p className="font-semibold capitalize">{event.category}</p>
                </div>
                <div>
                  <p className="text-gray-500">Participants</p>
                  <p className="font-semibold">{event.participants}</p>
                </div>
              </div>
              <div className="flex gap-2 text-xs">
                <div className="flex-1 bg-dark-bg rounded-lg p-2 text-center">
                  <p className="text-gray-500">YES</p>
                  <p className="font-bold text-success">{event.yesVotes}</p>
                </div>
                <div className="flex-1 bg-dark-bg rounded-lg p-2 text-center">
                  <p className="text-gray-500">NO</p>
                  <p className="font-bold text-danger">{event.noVotes}</p>
                </div>
              </div>
              <button className="w-full mt-3 bg-primary hover:bg-primary/90 text-white py-2 rounded-lg font-semibold transition">
                View Details
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">No events found</div>
        )}
      </div>
    </div>
  )
}

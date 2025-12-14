import { useState, useEffect } from 'react'
import { X, Search } from 'lucide-react'
import { apiClient } from '../../lib/api'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'

interface CreateChallengeModalProps {
  onClose: () => void
}

export default function CreateChallengeModal({ onClose }: CreateChallengeModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'gaming',
    wagerAmount: '',
    deadline: '',
    acceptedUserId: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [searching, setSearching] = useState(false)

  const queryClient = useQueryClient()

  // Fetch suggested users when component mounts
  const { data: suggestions } = useQuery({
    queryKey: ['suggested-users'],
    queryFn: () => apiClient.getSuggestedUsers(),
  })

  const categories = ['gaming', 'sports', 'crypto', 'skills', 'other']

  // Search users with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setSearching(true)
        try {
          const result = await apiClient.searchUsers(searchQuery)
          setSearchResults(result.users || [])
        } catch (err) {
          console.error('Search error:', err)
          setSearchResults([])
        } finally {
          setSearching(false)
        }
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const selectUser = (user: any) => {
    setSelectedUser(user)
    setFormData((prev) => ({
      ...prev,
      acceptedUserId: user.id,
    }))
    setShowSearch(false)
    setSearchQuery('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.description || !formData.wagerAmount || !formData.deadline) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await apiClient.createChallenge({
        ...formData,
        wagerAmount: parseFloat(formData.wagerAmount),
      })
      queryClient.invalidateQueries({ queryKey: ['challenges'] })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create challenge')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50 backdrop-blur-sm">
      <motion.div
        initial={{ y: 500, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 500, opacity: 0 }}
        className="w-full bg-dark-card border-t border-dark-border rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Create Challenge</h2>
          <button onClick={onClose} className="p-1 hover:bg-dark-bg rounded-lg transition">
            <X size={24} className="text-gray-400 hover:text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Challenge Title */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">Challenge Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Beat me at FIFA 25"
              className="w-full bg-dark-bg text-white rounded-lg px-4 py-3 border border-dark-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the challenge rules and details..."
              rows={3}
              className="w-full bg-dark-bg text-white rounded-lg px-4 py-3 border border-dark-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full bg-dark-bg text-white rounded-lg px-4 py-3 border border-dark-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Wager Amount */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">Wager Amount (₦) *</label>
            <input
              type="number"
              name="wagerAmount"
              value={formData.wagerAmount}
              onChange={handleChange}
              placeholder="1000"
              min="100"
              step="100"
              className="w-full bg-dark-bg text-white rounded-lg px-4 py-3 border border-dark-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum: ₦100</p>
          </div>

          {/* Deadline */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">Deadline *</label>
            <input
              type="datetime-local"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              className="w-full bg-dark-bg text-white rounded-lg px-4 py-3 border border-dark-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
            />
          </div>

          {/* Challenge User Selection */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">Challenge Specific User (Optional)</label>
            {selectedUser ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-primary/10 border border-primary/30 rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {selectedUser.profileImageUrl && (
                    <img
                      src={selectedUser.profileImageUrl}
                      alt={selectedUser.username}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <div>
                    <p className="text-white font-semibold text-sm">{selectedUser.displayName}</p>
                    <p className="text-gray-400 text-xs">@{selectedUser.username}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUser(null)
                    setFormData((prev) => ({ ...prev, acceptedUserId: '' }))
                  }}
                  className="text-gray-400 hover:text-white transition"
                >
                  <X size={16} />
                </button>
              </motion.div>
            ) : (
              <button
                type="button"
                onClick={() => setShowSearch(!showSearch)}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-white hover:border-primary/50 transition flex items-center justify-center gap-2"
              >
                <Search size={18} />
                Search for a player...
              </button>
            )}

            {/* User Search & Suggestions */}
            <AnimatePresence>
              {showSearch && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-3 space-y-3"
                >
                  {/* Search Input */}
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or username..."
                    className="w-full bg-dark-bg text-white rounded-lg px-4 py-3 border border-primary/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
                    autoFocus
                  />

                  {/* Search Results */}
                  {searching ? (
                    <div className="text-center py-4 text-gray-400">Searching...</div>
                  ) : searchQuery.length >= 2 && searchResults.length > 0 ? (
                    <div className="bg-dark-bg rounded-lg border border-dark-border overflow-hidden max-h-60 overflow-y-auto">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => selectUser(user)}
                          className="w-full p-3 hover:bg-dark-hover transition flex items-center gap-3 border-b border-dark-border last:border-b-0"
                        >
                          {user.profileImageUrl && (
                            <img
                              src={user.profileImageUrl}
                              alt={user.username}
                              className="w-8 h-8 rounded-full flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 text-left">
                            <p className="text-white font-semibold text-sm">{user.displayName}</p>
                            <p className="text-gray-400 text-xs">@{user.username} • Level {user.level}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-primary text-xs font-semibold">{user.points} pts</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : searchQuery.length >= 2 ? (
                    <div className="text-center py-4 text-gray-400 text-sm">No users found</div>
                  ) : null}

                  {/* Suggested Users */}
                  {!searchQuery && suggestions && (
                    <div className="space-y-2">
                      {suggestions.topPlayers?.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 font-semibold mb-2">🏆 Top Players</p>
                          <div className="space-y-1">
                            {suggestions.topPlayers.slice(0, 3).map((user: any) => (
                              <button
                                key={user.id}
                                type="button"
                                onClick={() => selectUser(user)}
                                className="w-full p-2 hover:bg-dark-hover transition flex items-center gap-2 rounded-lg text-sm"
                              >
                                <img
                                  src={user.profileImageUrl}
                                  alt={user.username}
                                  className="w-6 h-6 rounded-full flex-shrink-0"
                                />
                                <span className="text-white flex-1 text-left">{user.displayName}</span>
                                <span className="text-primary text-xs">{user.points} pts</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-danger/20 border border-danger/50 rounded-lg p-3 text-danger text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-dark-bg border border-dark-border text-white py-3 rounded-lg font-semibold hover:border-dark-border/80 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white py-3 rounded-lg font-semibold transition"
            >
              {loading ? 'Creating...' : 'Create Challenge'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

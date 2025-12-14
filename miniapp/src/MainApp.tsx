import { useAppStore } from './store/useAppStore'
import WalletTab from './components/tabs/WalletTab'
import EventsTab from './components/tabs/EventsTab'
import ChallengesTab from './components/tabs/ChallengesTab'
import LeaderboardTab from './components/tabs/LeaderboardTab'
import ProfileTab from './components/tabs/ProfileTab'
import BottomNav from './components/BottomNav'

export default function MainApp() {
  const { activeTab, setActiveTab } = useAppStore()

  const renderTab = () => {
    switch (activeTab) {
      case 'wallet':
        return <WalletTab />
      case 'events':
        return <EventsTab />
      case 'challenges':
        return <ChallengesTab />
      case 'leaderboard':
        return <LeaderboardTab />
      case 'profile':
        return <ProfileTab />
      default:
        return <WalletTab />
    }
  }

  return (
    <div className="flex flex-col h-screen bg-dark-bg text-gray-100">
      {/* Main content area */}
      <div className="flex-1 overflow-y-auto pb-20">
        {renderTab()}
      </div>

      {/* Bottom navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )
}

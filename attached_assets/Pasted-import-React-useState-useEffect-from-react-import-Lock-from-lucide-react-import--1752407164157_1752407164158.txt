import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import JoinRequestModal from './JoinRequestModal';
import { useEventPoolRefresh } from '../hooks/useEventPoolRefresh';
import { useEventJoinRequest } from '../hooks/useEventJoinRequest';
import { formatCurrency } from '../utils/formatNumber';
import { supabase } from '../lib/supabase';

const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&auto=format&fit=crop';

interface Creator {
  id: string;
  name: string;
  avatar_url: string;
  avatar?: string;
  username?: string;
  stats: any;
}

interface Event {
  id: string;
  title: string;
  banner_url?: string;
  status?: string;
  start_time: string;
  end_time: string;
  is_private?: boolean;
  creator: Creator;
  pool?: {
    total_amount?: number;
    entry_amount?: number;
  };
  participants?: Array<{ avatar?: string }>;
  current_participants?: number;
  display_participant_boost?: number;
  max_participants: number;
  category: string;
}

interface EventCardProps {
  event: Event;
  onChatClick: (event: Event) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onChatClick }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const { requestToJoin, isProcessing } = useEventJoinRequest();

  // Use the custom hook to get the latest pool data
  const { poolData, loading: poolLoading } = useEventPoolRefresh(event.id);

  // Create a local copy of the event with updated pool data
  const [updatedEvent, setUpdatedEvent] = useState(event);

  // Update the event when pool data changes
  useEffect(() => {
    if (poolData) {
      setUpdatedEvent({
        ...event,
        pool: {
          ...event.pool,
          total_amount: poolData.total_amount
        }
      });
    }
  }, [event, poolData]);

  // Check if user has already sent a join request
  useEffect(() => {
    const checkExistingRequest = async () => {
      if (!currentUser || !event.is_private) return;

      try {
        const { data, error } = await supabase
          .from('event_join_requests')
          .select('status')
          .eq('event_id', event.id)
          .eq('user_id', currentUser.id)
          .maybeSingle();

        if (error) throw error;

        if (data && data.status === 'pending') {
          setRequestSent(true);
        }
      } catch (error) {
        console.error('Error checking join request status:', error);
      }
    };

    checkExistingRequest();
  }, [currentUser, event.id, event.is_private]);

  const getEventStatus = () => {
    const now = new Date();
    const startTime = new Date(event.start_time);
    const endTime = new Date(event.end_time);

    if (event.status === 'CANCELLED') {
      return {
        label: '',
        bg: 'bg-red-500',
        dot: 'bg-red',
        text: 'text-white',
        animate: false,
      };
    }

    if (now < startTime) {
      return {
        label: '',
        bg: 'bg-[#CCFF00]',
        dot: 'bg-[#CCFF00]',
        text: 'text-white',
        animate: true,
      };
    }

    if (now >= startTime && now <= endTime) {
      return {
        label: '',
        bg: 'bg-[#CCFF00]',
        dot: 'bg-red-500',
        text: 'text-black',
        animate: true,
      };
    }

    return {
      label: 'ENDED',
      bg: 'bg-gray-500',
      dot: 'bg-red-500',
      text: 'text-white',
      animate: false,
    };
  };

  const handleJoinClick = () => {
    if (!currentUser) {
      navigate('/signin');
      return;
    }

    if (event.is_private) {
      setShowJoinModal(true);
    } else {
      handleChatClick();
    }
  };

  const handleChatClick = () => {
    if (currentUser) {
      navigate(`/event/${event.id}/chat`);
    } else {
      navigate('/signin');
    }
  };

  const handleJoinRequestSubmit = async (message: string) => {
    try {
      const success = await requestToJoin(event.id, message);
      if (success) {
        setRequestSent(true);
        setShowJoinModal(false);

        // Show a more informative toast message
        toast.showSuccess(
          `Your request to join "${event.title}" has been sent to the event creator. You'll be notified when they respond.`,
          { duration: 5000 } // Show for 5 seconds
        );

        // Don't navigate to chat yet - wait for approval
      }
    } catch (error) {
      console.error('Error submitting join request:', error);
    }
  };

  return (
    <>
      <div className="bg-black rounded-3xl overflow-hidden relative">
        <div className="relative w-full aspect-video">
          <img
            src={event.banner_url || DEFAULT_BANNER}
            alt={event.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = DEFAULT_BANNER;
            }}
          />

          {/* Single header row with creator info, title, and status */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent pt-2 pb-1.5">
            <div className="px-3 grid grid-cols-[auto_1fr_auto] items-center w-full gap-2">
              {/* Creator info - Left side */}
              <div className="flex items-center flex-shrink-0">
                <div className="overflow-hidden rounded-full h-5 w-5 border border-white/50 flex-shrink-0">
                  <img
                    src={
                      event.creator.avatar_url
                      || event.creator.avatar
                      || `https://api.dicebear.com/7.x/avataaars/svg?seed=${event.creator.username || event.creator.id || 'user'}`
                    }
                    alt={event.creator.username}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-white/90 text-xs ml-1.5">
                  {event.creator.username || "mikki24"}
                </span>
              </div>

              {/* Centered title */}
              <h2 className="text-white text-lg font-bold leading-tight text-center mx-auto truncate px-2">
                {event.title}
              </h2>

              {/* Status icon - Right side */}
              <div className="flex-shrink-0">
                {event.status !== 'HIDDEN' && (
                  <div className={`${getEventStatus().bg} w-2.5 h-2.5 rounded-full shadow-sm relative`}>
                    {getEventStatus().animate && (
                      <div className={`absolute inset-0 ${getEventStatus().dot} rounded-full animate-ping opacity-75`} />
                    )}
                    <div className={`absolute inset-0 ${getEventStatus().dot} rounded-full`} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom section with adjusted padding and alignment */}
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
          {/* Event Pool section */}
          <div className="flex flex-col justify-end">
            <span className="text-white text-sm font-bold">Event Pool</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="bg-white rounded-lg px-2 py-1">
                <span className="text-black font-bold text-sm">
                  {formatCurrency(updatedEvent.pool?.total_amount || 0, '₦', true)}
                </span>
              </div>
              {/* Participation Avatar + Count */}
              <div className="flex items-center ml-[1rem]">
                <div className="relative">
                  <div className="overflow-hidden rounded-full h-5 w-5 border-2 border-white-200 flex items-center justify-center">
                  <img
  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${event.id}`}
  alt="Participant"
  className="w-full h-full object-cover"
/>
                  </div>
                </div>
                <div className="bg-white rounded-full min-w-[1.5rem] h-5 flex items-center justify-center text-black font-bold text-xs ml-[-0.2rem] pl-1 pr-1">
                  {(event.participants?.length || event.current_participants || 0) + (event.display_participant_boost || 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Join Button */}
          <button
            type="button"
            onClick={handleJoinClick}
            disabled={['CANCELLED', 'ENDED'].includes(updatedEvent.status || getEventStatus().label) || isProcessing || requestSent}
            className={`${
              ['CANCELLED', 'ENDED'].includes(updatedEvent.status || getEventStatus().label)
                ? 'bg-gray-500 cursor-not-allowed text-white'
                : requestSent
                  ? 'bg-[#CCFF00] text-black'
                  : isProcessing
                    ? 'bg-gray-400 text-white'
                    : 'btn-primary bg-[#ccff00] text-black'
            } h-10 flex items-center justify-center gap-1 px-4 rounded-3x1'`}
          >
            {updatedEvent.is_private && !requestSent && <Lock className="h-4 w-4" />}
            {['CANCELLED', 'ENDED'].includes(updatedEvent.status || getEventStatus().label)
              ? 'Closed'
              : isProcessing
                ? 'Processing...'
                : requestSent
                  ? 'Request Sent'
                  : updatedEvent.is_private
                    ? 'Request'
                    : 'Join'}
          </button>
        </div>
      </div>

      <JoinRequestModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onSubmit={handleJoinRequestSubmit}
        eventTitle={event.title}
        isLoading={isProcessing}
        creator={{
          id: event.creator.id || '',
          name: event.creator.name || '',
          avatar_url: event.creator.avatar_url || event.creator.avatar || '',
          stats: event.creator.stats || {},
        }}
        eventDetails={{
          currentParticipants: event.participants?.length || 0,
          display_participant_boost: event.display_participant_boost || 0,
          maxParticipants: event.max_participants,
          category: event.category,
          pool: [{
            entry_amount: event.pool?.entry_amount || 0
          }]
        }}
      />
    </>
  );
};

export default EventCard;
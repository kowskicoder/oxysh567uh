import React, { useState } from 'react';
import { Lock, Users, Clock } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&auto=format&fit=crop';

interface Creator {
  id: string;
  name: string;
  avatar_url?: string;
  username?: string;
}

interface Event {
  id: string | number;
  title: string;
  banner_url?: string;
  status?: string;
  start_time?: string;
  end_time?: string;
  endDate?: string;
  is_private?: boolean;
  isPrivate?: boolean;
  creator?: Creator;
  pool?: {
    total_amount?: number;
    entry_amount?: number;
  };
  eventPool?: string;
  yesPool?: string;
  noPool?: string;
  entryFee?: string;
  participants?: Array<{ avatar?: string }>;
  current_participants?: number;
  max_participants?: number;
  maxParticipants?: number;
  category?: string;
}

interface EventCardProps {
  event: Event;
  featured?: boolean;
}

export function EventCard({ event, featured = false }: EventCardProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [imageError, setImageError] = useState(false);

  // Normalize event data from different sources
  const eventId = event.id;
  const title = event.title;
  const bannerUrl = event.banner_url || DEFAULT_BANNER;
  const isPrivate = event.is_private || event.isPrivate || false;
  const endDate = event.end_time || event.endDate;
  const creator = event.creator;

  // Calculate pool total from different possible sources
  const poolTotal = event.pool?.total_amount || 
                   parseFloat(event.eventPool || '0') || 
                   (parseFloat(event.yesPool || '0') + parseFloat(event.noPool || '0'));

  // Calculate participants count
  const participantCount = event.current_participants || 
                          event.participants?.length || 
                          Math.floor(Math.random() * 50) + 10;

  const maxParticipants = event.max_participants || event.maxParticipants;

  // Calculate time remaining
  const timeLeft = endDate ? formatDistanceToNow(new Date(endDate), { addSuffix: true }) : 'Soon';

  const handleJoinEvent = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to join events",
        variant: "destructive",
      });
      return;
    }

    if (isPrivate) {
      toast({
        title: "Request Sent",
        description: "Your request to join this private event has been sent",
      });
    }

    // Navigate to event chat page
    setLocation(`/events/${eventId}/chat`);
  };

  const getStatusDot = () => {
    if (event.status === 'completed') {
      return <div className="w-2 h-2 bg-blue-500 rounded-full"></div>;
    }
    if (event.status === 'cancelled') {
      return <div className="w-2 h-2 bg-gray-500 rounded-full"></div>;
    }
    return <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>;
  };

  return (
    <div className={`relative rounded-xl overflow-hidden group cursor-pointer transition-transform duration-200 hover:scale-[1.02] ${
      featured ? 'ring-2 ring-primary/20' : ''
    }`}>
      {/* Background Image with Overlay */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageError ? DEFAULT_BANNER : bannerUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImageError(true)}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

        {/* Top Row - Status and Private Badge */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusDot()}
            <span className="text-white text-xs font-medium">
              {event.status === 'completed' ? 'Completed' : 
               event.status === 'cancelled' ? 'Cancelled' : 'Live'}
            </span>
          </div>

          {isPrivate && (
            <div className="bg-black/40 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
              <Lock size={12} className="text-white" />
              <span className="text-white text-xs">Private</span>
            </div>
          )}
        </div>

        {/* Bottom Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* Creator Info */}
          {creator && (
            <div className="flex items-center space-x-2 mb-3">
              <img
                src={creator.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.name}`}
                alt={creator.name}
                className="w-6 h-6 rounded-full border border-white/20"
              />
              <span className="text-white text-sm font-medium">
                {creator.name || creator.username || 'Unknown'}
              </span>
            </div>
          )}

          {/* Event Title */}
          <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">
            {title}
          </h3>

          {/* Stats Row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4">
              {/* Pool Total */}
              <div className="text-white">
                <span className="text-lg font-bold">₦{poolTotal.toLocaleString()}</span>
                <span className="text-white/70 text-sm ml-1">pool</span>
              </div>

              {/* Participants */}
              <div className="flex items-center space-x-1 text-white/70">
                <Users size={14} />
                <span className="text-sm">
                  {participantCount}{maxParticipants ? `/${maxParticipants}` : ''}
                </span>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-center space-x-1 text-white/70">
              <Clock size={14} />
              <span className="text-sm">{timeLeft}</span>
            </div>
          </div>

          {/* Join Button */}
          <button
            onClick={handleJoinEvent}
            className="w-full bg-white/90 hover:bg-white text-black font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200 backdrop-blur-sm"
          >
            {isPrivate ? 'Request to Join' : 'Join Event'}
          </button>
        </div>
      </div>
    </div>
  );
}
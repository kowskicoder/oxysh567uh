import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CreateEventForm from '../components/CreateEventForm';
import CreateChallengeForm from '../components/CreateChallengeForm';
import MobileFooterNav from '../components/MobileFooterNav';
import './Create.css'; // Import the CSS file

type EventType = 'public' | 'private' | 'challenge';

// Replace these with the actual URLs of your SVG icons
const globeIconUrl = 'public/publievents.svg';
const lockIconUrl = 'public/lockIcon.svg';
const gamepadIconUrl = '/public/versus.svg';

const Create: React.FC = () => {
  const navigate = useNavigate();
  const [eventType, setEventType] = useState<EventType>('public');

  return (
    <div className="min-h-screen bg-[#EDEDED] pb-[80px] create-page">
      {/* Header */}
      <div className="bg-[#EDEDED] text-black flex justify-center items-center relative p-4 sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="absolute left-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-medium">Create an Event</h1>
      </div>

      {/* Event Type Selection */}
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex overflow-x-auto gap-2 mb-4 pb-2 scrollbar-hide justify-center md:justify-start">
          {/* Public Event Button */}
          <button
            onClick={() => setEventType('public')}
            className={`flex-shrink-0 flex flex-col items-center justify-center p-1 rounded-lg transition-all duration-300 w-[90px] md:w-[120px] h-[65px] md:h-[80px]
              ${
                eventType === 'public'
                  ? 'bg-[#7440ff]/10 shadow-[0_0_10px_rgba(116,64,255,0.1)] border border-[#7440ff]'
                  : 'hover:border-gray-200 border border-transparent'
              }`}
          >
            <div className="w-6 h-6 md:w-7 md:h-7 rounded-full  flex items-center justify-center mb-0.5 md:mb-0">
              <img src={globeIconUrl} alt="Public Icon" className="w-8 h-8 md:w-5 md:h-5" />
            </div>
            <h3 className="font-medium text-black text-[0.7rem] md:text-xs text-center truncate">Public</h3>
            <p className="text-[0.6rem] md:text-[0.8rem] text-gray-600 text-center truncate">Anyone can join</p>
          </button>

          {/* Private Event Button */}
          <button
            onClick={() => setEventType('private')}
            className={`flex-shrink-0 flex flex-col items-center justify-center p-1 rounded-lg transition-all duration-300 w-[90px] md:w-[120px] h-[65px] md:h-[80px]
              ${
                eventType === 'private'
                  ? 'bg-[#7440ff]/10 shadow-[0_0_10px_rgba(116,64,255,0.1)] border border-[#7440ff]'
                  : 'hover:border-gray-200 border border-transparent'
              }`}
          >
            <div className="w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center mb-0.5 md:mb-0">
              <img src={lockIconUrl} alt="Private Icon" className="w-8 h-8 md:w-5 md:h-5" />
            </div>
            <h3 className="font-medium text-black text-[0.7rem] md:text-xs text-center truncate">Private</h3>
            <p className="text-[0.6rem] md:text-[0.8rem] text-gray-600 text-center truncate">Invite-only</p>
          </button>

          {/* Challenge Button */}
          <button
            onClick={() => setEventType('challenge')}
            className={`flex-shrink-0 flex flex-col items-center justify-center p-1 rounded-lg transition-all duration-300 w-[90px] md:w-[120px] h-[65px] md:h-[80px]
              ${
                eventType === 'challenge'
                  ? 'bg-[#7440ff]/10 shadow-[0_0_10px_rgba(116,64,255,0.1)] border border-[#7440ff]'
                  : 'hover:border-gray-200 border border-transparent'
              }`}
          >
            <div className="w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center mb-0.5 md:mb-0">
              <img src={gamepadIconUrl} alt="Challenge Icon" className="w-12 h-12 md:w-5 md:h-5" />
            </div>
            <h3 className="font-medium text-black text-[0.7rem] md:text-xs text-center truncate">Challenge</h3>
            <p className="text-[0.6rem] md:text-[0.8rem] text-gray-600 text-center truncate">Challenge a friend</p>
          </button>
        </div>

        {/* Form Container */}
        <div className="mt-6 mb-20">
          {eventType === 'challenge' ? (
            <CreateChallengeForm onClose={() => navigate(-1)} />
          ) : (
            <CreateEventForm onClose={() => navigate(-1)} eventType={eventType} />
          )}
        </div>
      </div>

      <MobileFooterNav />
    </div>
  );
};

export default Create;
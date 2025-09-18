import React, { useState } from 'react';
import { 
  HashtagIcon, 
  LockClosedIcon,
  UserGroupIcon,
  ChevronDownIcon,
  InformationCircleIcon,
  PhoneIcon,
  VideoCameraIcon,
  UserPlusIcon,
  StarIcon,
  BellIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import useStore from '../../store/useStore';
import HuddleButton from './HuddleButton';

const ChannelHeader: React.FC = () => {
  const { currentChannel, channels, users, toggleRightSidebar, activeHuddle } = useStore();
  const [isStarred, setIsStarred] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  if (!currentChannel) return null;
  
  const channelMembers = Array.from(users.values()).filter(user => 
    // In a real app, you'd filter based on actual channel membership
    true
  );
  
  const getChannelIcon = () => {
    if (currentChannel.is_direct) {
      return <UserGroupIcon className="w-4 h-4" />;
    } else if (currentChannel.is_private) {
      return <LockClosedIcon className="w-4 h-4" />;
    } else {
      return <HashtagIcon className="w-4 h-4" />;
    }
  };
  
  return (
    <div className="px-4 py-2 border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Channel Name */}
          <button className="flex items-center space-x-1 font-semibold text-gray-900 hover:text-gray-700">
            {getChannelIcon()}
            <span>{currentChannel.name}</span>
            <ChevronDownIcon className="w-4 h-4" />
          </button>
          
          {/* Star */}
          <button
            onClick={() => setIsStarred(!isStarred)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {isStarred ? (
              <StarIconSolid className="w-4 h-4 text-yellow-500" />
            ) : (
              <StarIcon className="w-4 h-4 text-gray-500" />
            )}
          </button>
        </div>
        
        <div className="flex items-center space-x-1">
          {/* Huddle Button */}
          <HuddleButton />
          
          {/* Member count */}
          <button className="flex items-center space-x-1 px-2 py-1 hover:bg-gray-100 rounded text-sm text-gray-600">
            <UserGroupIcon className="w-4 h-4" />
            <span>{channelMembers.length}</span>
          </button>
          
          {/* Add member */}
          <button className="p-1.5 hover:bg-gray-100 rounded text-gray-600">
            <UserPlusIcon className="w-4 h-4" />
          </button>
          
          {/* Notifications */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
          >
            <BellIcon className={`w-4 h-4 ${isMuted ? 'text-gray-400' : ''}`} />
            {isMuted && (
              <span className="sr-only">Muted</span>
            )}
          </button>
          
          {/* Search in channel */}
          <button className="p-1.5 hover:bg-gray-100 rounded text-gray-600">
            <MagnifyingGlassIcon className="w-4 h-4" />
          </button>
          
          {/* Channel info */}
          <button
            onClick={toggleRightSidebar}
            className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
          >
            <InformationCircleIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Channel description or topic */}
      {currentChannel.description && (
        <div className="mt-1 text-sm text-gray-500">
          {currentChannel.description}
        </div>
      )}
      
      {/* Active huddle indicator */}
      {activeHuddle && activeHuddle.channel_id === currentChannel.id && (
        <div className="mt-2 flex items-center space-x-2 text-sm">
          <div className="flex items-center space-x-1 px-2 py-1 bg-green-50 text-green-700 rounded">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Huddle in progress</span>
            <span className="font-medium">({activeHuddle.participants.length} participants)</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelHeader;

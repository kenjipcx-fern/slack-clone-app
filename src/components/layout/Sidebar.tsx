import React, { useState } from 'react';
import { 
  ChevronDownIcon, 
  ChevronRightIcon, 
  HashtagIcon, 
  LockClosedIcon, 
  PlusIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  BellIcon,
  BookmarkIcon,
  PaperAirplaneIcon,
  AtSymbolIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import useStore from '../../store/useStore';
import CreateChannelModal from '../modals/CreateChannelModal';

const Sidebar: React.FC = () => {
  const { 
    currentWorkspace, 
    channels, 
    currentChannel, 
    selectChannel, 
    user,
    onlineUsers,
    users
  } = useStore();
  
  const [showChannels, setShowChannels] = useState(true);
  const [showDirectMessages, setShowDirectMessages] = useState(true);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  
  const publicChannels = channels.filter(c => !c.is_private && !c.is_direct);
  const privateChannels = channels.filter(c => c.is_private && !c.is_direct);
  const directMessages = channels.filter(c => c.is_direct);
  
  return (
    <>
      <div className="w-64 bg-slack-sidebar flex flex-col h-full text-slack-text">
        {/* Workspace Header */}
        <div className="px-4 py-3 border-b border-slack-border hover:bg-slack-hover cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 bg-white rounded flex items-center justify-center text-slack-sidebar font-bold text-lg">
                {currentWorkspace?.name?.charAt(0).toUpperCase() || 'W'}
              </div>
              <div>
                <h2 className="font-bold text-white text-sm">{currentWorkspace?.name || 'Workspace'}</h2>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs">{user?.name}</span>
                </div>
              </div>
            </div>
            <ChevronDownIcon className="w-5 h-5 text-white" />
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="px-3 py-3 space-y-1 border-b border-slack-border">
          <button className="w-full text-left px-3 py-1.5 hover:bg-slack-hover rounded flex items-center space-x-3 text-sm">
            <ChatBubbleLeftRightIcon className="w-4 h-4" />
            <span>Threads</span>
          </button>
          <button className="w-full text-left px-3 py-1.5 hover:bg-slack-hover rounded flex items-center space-x-3 text-sm">
            <AtSymbolIcon className="w-4 h-4" />
            <span>Mentions & reactions</span>
          </button>
          <button className="w-full text-left px-3 py-1.5 hover:bg-slack-hover rounded flex items-center space-x-3 text-sm">
            <BookmarkIcon className="w-4 h-4" />
            <span>Saved items</span>
          </button>
          <button className="w-full text-left px-3 py-1.5 hover:bg-slack-hover rounded flex items-center space-x-3 text-sm">
            <PaperAirplaneIcon className="w-4 h-4" />
            <span>Drafts & sent</span>
          </button>
        </div>
        
        {/* Channels Section */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-3 py-2">
            <div className="flex items-center justify-between mb-1">
              <button
                onClick={() => setShowChannels(!showChannels)}
                className="flex items-center space-x-1 hover:text-white text-sm"
              >
                {showChannels ? (
                  <ChevronDownIcon className="w-3 h-3" />
                ) : (
                  <ChevronRightIcon className="w-3 h-3" />
                )}
                <span>Channels</span>
              </button>
              <button
                onClick={() => setShowCreateChannel(true)}
                className="hover:bg-slack-hover p-1 rounded"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
            
            {showChannels && (
              <div className="space-y-0.5">
                {publicChannels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => selectChannel(channel)}
                    className={`w-full text-left px-3 py-1 hover:bg-slack-hover rounded flex items-center space-x-2 text-sm ${
                      currentChannel?.id === channel.id ? 'bg-slack-active text-white' : ''
                    }`}
                  >
                    <HashtagIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{channel.name}</span>
                    {channel.unread_count && channel.unread_count > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {channel.unread_count}
                      </span>
                    )}
                  </button>
                ))}
                
                {privateChannels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => selectChannel(channel)}
                    className={`w-full text-left px-3 py-1 hover:bg-slack-hover rounded flex items-center space-x-2 text-sm ${
                      currentChannel?.id === channel.id ? 'bg-slack-active text-white' : ''
                    }`}
                  >
                    <LockClosedIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{channel.name}</span>
                    {channel.unread_count && channel.unread_count > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {channel.unread_count}
                      </span>
                    )}
                  </button>
                ))}
                
                <button className="w-full text-left px-3 py-1 hover:bg-slack-hover rounded flex items-center space-x-2 text-sm">
                  <PlusIcon className="w-4 h-4 flex-shrink-0" />
                  <span>Add channels</span>
                </button>
              </div>
            )}
          </div>
          
          {/* Direct Messages Section */}
          <div className="px-3 py-2">
            <div className="flex items-center justify-between mb-1">
              <button
                onClick={() => setShowDirectMessages(!showDirectMessages)}
                className="flex items-center space-x-1 hover:text-white text-sm"
              >
                {showDirectMessages ? (
                  <ChevronDownIcon className="w-3 h-3" />
                ) : (
                  <ChevronRightIcon className="w-3 h-3" />
                )}
                <span>Direct messages</span>
              </button>
              <button className="hover:bg-slack-hover p-1 rounded">
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
            
            {showDirectMessages && (
              <div className="space-y-0.5">
                {Array.from(users.values()).slice(0, 5).map((dmUser) => (
                  <button
                    key={dmUser.id}
                    className="w-full text-left px-3 py-1 hover:bg-slack-hover rounded flex items-center space-x-2 text-sm"
                  >
                    <div className="relative">
                      <div className="w-5 h-5 bg-gray-600 rounded flex items-center justify-center text-xs text-white">
                        {dmUser.name?.charAt(0).toUpperCase()}
                      </div>
                      {onlineUsers.has(dmUser.id) && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-slack-sidebar"></div>
                      )}
                    </div>
                    <span className="truncate">{dmUser.name}</span>
                  </button>
                ))}
                
                <button className="w-full text-left px-3 py-1 hover:bg-slack-hover rounded flex items-center space-x-2 text-sm">
                  <PlusIcon className="w-4 h-4 flex-shrink-0" />
                  <span>Add teammates</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {showCreateChannel && (
        <CreateChannelModal onClose={() => setShowCreateChannel(false)} />
      )}
    </>
  );
};

export default Sidebar;

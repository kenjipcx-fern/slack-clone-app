import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';
import ChannelView from './ChannelView';
import ThreadView from './ThreadView';
import HuddleBar from './HuddleBar';
import { Channel, Message, Huddle } from '../types';
import socketService from '../services/socket';
import { huddleAPI } from '../services/api';

const Main: React.FC = () => {
  const { currentWorkspace } = useAuth();
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [selectedThread, setSelectedThread] = useState<Message | null>(null);
  const [activeHuddle, setActiveHuddle] = useState<Huddle | null>(null);
  const [showThread, setShowThread] = useState(false);

  useEffect(() => {
    // Check for active huddles
    const checkActiveHuddle = async () => {
      try {
        const response = await huddleAPI.getActive();
        if (response.data && response.data.length > 0) {
          setActiveHuddle(response.data[0]);
        }
      } catch (error) {
        console.error('Error checking active huddle:', error);
      }
    };

    checkActiveHuddle();

    // Listen for huddle events
    const handleHuddleStarted = (data: any) => {
      setActiveHuddle(data.huddle);
    };

    const handleHuddleEnded = () => {
      setActiveHuddle(null);
    };

    socketService.on('huddle_started', handleHuddleStarted);
    socketService.on('huddle_ended', handleHuddleEnded);

    return () => {
      socketService.off('huddle_started', handleHuddleStarted);
      socketService.off('huddle_ended', handleHuddleEnded);
    };
  }, []);

  const handleSelectChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    setShowThread(false);
    setSelectedThread(null);
  };

  const handleSelectThread = (message: Message) => {
    setSelectedThread(message);
    setShowThread(true);
  };

  const handleCloseThread = () => {
    setShowThread(false);
    setSelectedThread(null);
  };

  if (!currentWorkspace) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top Bar */}
      <div className="h-12 bg-slack-purple flex items-center px-4 text-white">
        <div className="flex items-center space-x-4">
          <h1 className="font-bold text-lg">{currentWorkspace.name}</h1>
        </div>
      </div>

      {/* Huddle Bar */}
      {activeHuddle && (
        <HuddleBar huddle={activeHuddle} onEnd={() => setActiveHuddle(null)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          workspace={currentWorkspace}
          selectedChannel={selectedChannel}
          onSelectChannel={handleSelectChannel}
          activeHuddle={activeHuddle}
        />

        {/* Channel View */}
        <div className="flex-1 flex">
          {selectedChannel ? (
            <>
              <ChannelView
                channel={selectedChannel}
                onSelectThread={handleSelectThread}
                showThread={showThread}
                activeHuddle={activeHuddle}
              />
              {/* Thread View */}
              {showThread && selectedThread && (
                <ThreadView
                  message={selectedThread}
                  channel={selectedChannel}
                  onClose={handleCloseThread}
                />
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Welcome to {currentWorkspace.name}
                </h2>
                <p className="text-gray-500">Select a channel to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Main;

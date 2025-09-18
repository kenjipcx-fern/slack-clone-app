import React, { useState } from 'react';
import { 
  PhoneIcon, 
  PhoneXMarkIcon,
  MicrophoneIcon,
  VideoCameraIcon,
  ComputerDesktopIcon,
  SpeakerWaveIcon
} from '@heroicons/react/24/outline';
import { 
  MicrophoneIcon as MicrophoneSolidIcon,
  VideoCameraIcon as VideoCameraSolidIcon,
  ComputerDesktopIcon as ComputerDesktopSolidIcon
} from '@heroicons/react/24/solid';
import useStore from '../../store/useStore';
import toast from 'react-hot-toast';

const HuddleButton: React.FC = () => {
  const { 
    activeHuddle, 
    currentChannel, 
    startHuddle, 
    leaveHuddle, 
    updateHuddleSettings,
    user
  } = useStore();
  
  const [showControls, setShowControls] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  
  const isInHuddle = activeHuddle && activeHuddle.channel_id === currentChannel?.id;
  const currentParticipant = activeHuddle?.participants.find(p => p.user_id === user?.id);
  
  const handleStartHuddle = async () => {
    try {
      await startHuddle();
      toast.success('Huddle started!');
      setShowControls(true);
    } catch (error) {
      toast.error('Failed to start huddle');
    }
  };
  
  const handleLeaveHuddle = async () => {
    try {
      await leaveHuddle();
      toast.success('Left huddle');
      setShowControls(false);
      setAudioEnabled(true);
      setVideoEnabled(false);
      setScreenSharing(false);
    } catch (error) {
      toast.error('Failed to leave huddle');
    }
  };
  
  const toggleAudio = async () => {
    const newState = !audioEnabled;
    setAudioEnabled(newState);
    if (isInHuddle) {
      await updateHuddleSettings({ audio_enabled: newState });
    }
  };
  
  const toggleVideo = async () => {
    const newState = !videoEnabled;
    setVideoEnabled(newState);
    if (isInHuddle) {
      await updateHuddleSettings({ video_enabled: newState });
    }
  };
  
  const toggleScreenShare = async () => {
    const newState = !screenSharing;
    setScreenSharing(newState);
    if (isInHuddle) {
      await updateHuddleSettings({ screen_sharing: newState });
    }
  };
  
  if (isInHuddle) {
    return (
      <div className="flex items-center space-x-1">
        {showControls && (
          <>
            <button
              onClick={toggleAudio}
              className={`p-1.5 rounded ${
                audioEnabled 
                  ? 'hover:bg-gray-100 text-gray-600' 
                  : 'bg-red-100 text-red-600 hover:bg-red-200'
              }`}
              title={audioEnabled ? 'Mute microphone' : 'Unmute microphone'}
            >
              {audioEnabled ? (
                <MicrophoneIcon className="w-4 h-4" />
              ) : (
                <MicrophoneSolidIcon className="w-4 h-4" />
              )}
            </button>
            
            <button
              onClick={toggleVideo}
              className={`p-1.5 rounded ${
                videoEnabled 
                  ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {videoEnabled ? (
                <VideoCameraSolidIcon className="w-4 h-4" />
              ) : (
                <VideoCameraIcon className="w-4 h-4" />
              )}
            </button>
            
            <button
              onClick={toggleScreenShare}
              className={`p-1.5 rounded ${
                screenSharing 
                  ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              title={screenSharing ? 'Stop sharing screen' : 'Share screen'}
            >
              {screenSharing ? (
                <ComputerDesktopSolidIcon className="w-4 h-4" />
              ) : (
                <ComputerDesktopIcon className="w-4 h-4" />
              )}
            </button>
            
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
          </>
        )}
        
        <button
          onClick={handleLeaveHuddle}
          className="flex items-center space-x-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium"
        >
          <PhoneXMarkIcon className="w-4 h-4" />
          <span>Leave</span>
        </button>
      </div>
    );
  }
  
  return (
    <button
      onClick={handleStartHuddle}
      className="flex items-center space-x-1 px-3 py-1.5 hover:bg-gray-100 rounded text-gray-700 text-sm font-medium border border-gray-300"
    >
      <PhoneIcon className="w-4 h-4" />
      <span>Huddle</span>
    </button>
  );
};

export default HuddleButton;

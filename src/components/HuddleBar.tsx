import React, { useState, useEffect, useRef } from 'react';
import { Huddle } from '../types';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Users } from 'lucide-react';
import { huddleAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import SimplePeer from 'simple-peer';
import socketService from '../services/socket';

interface HuddleBarProps {
  huddle: Huddle;
  onEnd: () => void;
}

const HuddleBar: React.FC<HuddleBarProps> = ({ huddle, onEnd }) => {
  const { user } = useAuth();
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [duration, setDuration] = useState(0);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, SimplePeer.Instance>>(new Map());
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Start duration counter
    intervalRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);

    // Initialize WebRTC
    initializeMedia();

    // Socket event listeners for WebRTC signaling
    const handleOffer = ({ userId, offer }: any) => {
      handleReceiveOffer(userId, offer);
    };

    const handleAnswer = ({ userId, answer }: any) => {
      handleReceiveAnswer(userId, answer);
    };

    const handleIceCandidate = ({ userId, candidate }: any) => {
      handleReceiveIceCandidate(userId, candidate);
    };

    socketService.on('webrtc_offer', handleOffer);
    socketService.on('webrtc_answer', handleAnswer);
    socketService.on('webrtc_ice_candidate', handleIceCandidate);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      cleanupMedia();
      
      socketService.off('webrtc_offer', handleOffer);
      socketService.off('webrtc_answer', handleAnswer);
      socketService.off('webrtc_ice_candidate', handleIceCandidate);
    };
  }, []);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: isAudioEnabled,
        video: isVideoEnabled,
      });
      localStreamRef.current = stream;
      setIsConnected(true);
      
      // Create peer connections for existing participants
      huddle.participants.forEach(participant => {
        if (participant.userId !== user?.id) {
          createPeerConnection(participant.userId, true);
        }
      });
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast.error('Failed to access microphone/camera');
    }
  };

  const cleanupMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    peersRef.current.forEach(peer => peer.destroy());
    peersRef.current.clear();
  };

  const createPeerConnection = (targetUserId: string, initiator: boolean) => {
    if (!localStreamRef.current) return;
    
    const peer = new SimplePeer({
      initiator,
      stream: localStreamRef.current,
      trickle: true,
    });

    peer.on('signal', (data) => {
      if (data.type === 'offer') {
        socketService.sendOffer(targetUserId, data);
      } else if (data.type === 'answer') {
        socketService.sendAnswer(targetUserId, data);
      } else {
        socketService.sendIceCandidate(targetUserId, data);
      }
    });

    peer.on('stream', (remoteStream) => {
      // Handle remote stream (would normally display video/audio)
      console.log('Received remote stream from', targetUserId);
    });

    peer.on('error', (error) => {
      console.error('Peer connection error:', error);
    });

    peersRef.current.set(targetUserId, peer);
  };

  const handleReceiveOffer = (userId: string, offer: any) => {
    const peer = new SimplePeer({
      initiator: false,
      stream: localStreamRef.current || undefined,
      trickle: true,
    });

    peer.on('signal', (data) => {
      socketService.sendAnswer(userId, data);
    });

    peer.signal(offer);
    peersRef.current.set(userId, peer);
  };

  const handleReceiveAnswer = (userId: string, answer: any) => {
    const peer = peersRef.current.get(userId);
    if (peer) {
      peer.signal(answer);
    }
  };

  const handleReceiveIceCandidate = (userId: string, candidate: any) => {
    const peer = peersRef.current.get(userId);
    if (peer) {
      peer.signal(candidate);
    }
  };

  const toggleAudio = async () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
    
    try {
      await huddleAPI.updateSettings(huddle.id, { isAudioEnabled: !isAudioEnabled });
    } catch (error) {
      console.error('Error updating audio settings:', error);
    }
  };

  const toggleVideo = async () => {
    if (!isVideoEnabled && !localStreamRef.current?.getVideoTracks().length) {
      // Need to add video track
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = videoStream.getVideoTracks()[0];
        localStreamRef.current?.addTrack(videoTrack);
        
        // Update peers
        peersRef.current.forEach(peer => {
          peer.addStream(localStreamRef.current!);
        });
      } catch (error) {
        console.error('Error accessing camera:', error);
        toast.error('Failed to access camera');
        return;
      }
    } else if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
    
    try {
      await huddleAPI.updateSettings(huddle.id, { isVideoEnabled: !isVideoEnabled });
    } catch (error) {
      console.error('Error updating video settings:', error);
    }
  };

  const handleLeave = async () => {
    try {
      await huddleAPI.leave(huddle.id);
      cleanupMedia();
      onEnd();
      toast.success('Left huddle');
    } catch (error) {
      console.error('Error leaving huddle:', error);
      toast.error('Failed to leave huddle');
    }
  };

  const handleEnd = async () => {
    try {
      await huddleAPI.end(huddle.id);
      cleanupMedia();
      onEnd();
      toast.success('Huddle ended');
    } catch (error) {
      console.error('Error ending huddle:', error);
      toast.error('Failed to end huddle');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-green-50 border-b border-green-200 px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4 text-green-600 animate-pulse" />
            <span className="font-medium text-green-800">Huddle in #{huddle.channel?.name}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-green-700">
            <Users className="h-4 w-4" />
            <span>{huddle.participants.length} participant{huddle.participants.length !== 1 ? 's' : ''}</span>
          </div>
          
          <div className="text-sm text-green-700">
            {formatDuration(duration)}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleAudio}
            className={`p-2 rounded ${
              isAudioEnabled ? 'bg-green-100 hover:bg-green-200' : 'bg-red-100 hover:bg-red-200'
            }`}
            title={isAudioEnabled ? 'Mute' : 'Unmute'}
          >
            {isAudioEnabled ? (
              <Mic className="h-4 w-4 text-green-700" />
            ) : (
              <MicOff className="h-4 w-4 text-red-700" />
            )}
          </button>
          
          <button
            onClick={toggleVideo}
            className={`p-2 rounded ${
              isVideoEnabled ? 'bg-green-100 hover:bg-green-200' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            title={isVideoEnabled ? 'Turn off video' : 'Turn on video'}
          >
            {isVideoEnabled ? (
              <Video className="h-4 w-4 text-green-700" />
            ) : (
              <VideoOff className="h-4 w-4 text-gray-700" />
            )}
          </button>
          
          <button
            onClick={handleLeave}
            className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-medium"
          >
            Leave
          </button>
          
          {huddle.participants[0]?.userId === user?.id && (
            <button
              onClick={handleEnd}
              className="px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm font-medium"
            >
              End for all
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HuddleBar;

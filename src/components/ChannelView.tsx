import React, { useState, useEffect, useRef } from 'react';
import { Channel, Message, Huddle } from '../types';
import { messageAPI, reactionAPI, huddleAPI } from '../services/api';
import MessageList from './MessageList';
import MessageComposer from './MessageComposer';
import { Hash, Lock, Users, Phone, Video, Info, Search } from 'lucide-react';
import socketService from '../services/socket';
import toast from 'react-hot-toast';

interface ChannelViewProps {
  channel: Channel;
  onSelectThread: (message: Message) => void;
  showThread: boolean;
  activeHuddle: Huddle | null;
}

const ChannelView: React.FC<ChannelViewProps> = ({ 
  channel, 
  onSelectThread, 
  showThread,
  activeHuddle 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Map<string, any>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    loadMessages();
    socketService.joinChannel(channel.id);

    // Socket event listeners
    const handleNewMessage = (data: any) => {
      if (data.message.channelId === channel.id && !data.message.parentMessageId) {
        setMessages(prev => [...prev, data.message]);
        scrollToBottom();
      }
    };

    const handleMessageUpdated = (data: any) => {
      if (data.message.channelId === channel.id) {
        setMessages(prev => prev.map(msg => 
          msg.id === data.message.id ? data.message : msg
        ));
      }
    };

    const handleMessageDeleted = (data: any) => {
      setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
    };

    const handleReactionAdded = (data: any) => {
      setMessages(prev => prev.map(msg => {
        if (msg.id === data.messageId) {
          const reactions = msg.reactions || [];
          const existingReaction = reactions.find(r => r.emoji === data.emoji);
          
          if (existingReaction) {
            return {
              ...msg,
              reactions: reactions.map(r => 
                r.emoji === data.emoji 
                  ? { ...r, count: (r.count || 0) + 1 }
                  : r
              )
            };
          } else {
            return {
              ...msg,
              reactions: [...reactions, { 
                id: Date.now().toString(),
                emoji: data.emoji, 
                count: 1,
                messageId: data.messageId,
                userId: data.userId 
              }]
            };
          }
        }
        return msg;
      }));
    };

    const handleReactionRemoved = (data: any) => {
      setMessages(prev => prev.map(msg => {
        if (msg.id === data.messageId) {
          const reactions = msg.reactions || [];
          return {
            ...msg,
            reactions: reactions.map(r => 
              r.emoji === data.emoji 
                ? { ...r, count: Math.max(0, (r.count || 0) - 1) }
                : r
            ).filter(r => (r.count || 0) > 0)
          };
        }
        return msg;
      }));
    };

    const handleUserTyping = (data: any) => {
      if (data.channelId === channel.id && data.user) {
        setTypingUsers(prev => new Map(prev).set(data.user.id, data.user));
        
        // Clear existing timeout
        const existingTimeout = typingTimeouts.current.get(data.user.id);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }
        
        // Set new timeout to remove typing indicator
        const timeout = setTimeout(() => {
          setTypingUsers(prev => {
            const newMap = new Map(prev);
            newMap.delete(data.user.id);
            return newMap;
          });
        }, 3000);
        
        typingTimeouts.current.set(data.user.id, timeout);
      }
    };

    const handleUserStoppedTyping = (data: any) => {
      if (data.channelId === channel.id && data.user) {
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          newMap.delete(data.user.id);
          return newMap;
        });
        
        const timeout = typingTimeouts.current.get(data.user.id);
        if (timeout) {
          clearTimeout(timeout);
          typingTimeouts.current.delete(data.user.id);
        }
      }
    };

    socketService.on('new_message', handleNewMessage);
    socketService.on('message_updated', handleMessageUpdated);
    socketService.on('message_deleted', handleMessageDeleted);
    socketService.on('reaction_added', handleReactionAdded);
    socketService.on('reaction_removed', handleReactionRemoved);
    socketService.on('user_typing', handleUserTyping);
    socketService.on('user_stopped_typing', handleUserStoppedTyping);

    return () => {
      socketService.leaveChannel(channel.id);
      socketService.off('new_message', handleNewMessage);
      socketService.off('message_updated', handleMessageUpdated);
      socketService.off('message_deleted', handleMessageDeleted);
      socketService.off('reaction_added', handleReactionAdded);
      socketService.off('reaction_removed', handleReactionRemoved);
      socketService.off('user_typing', handleUserTyping);
      socketService.off('user_stopped_typing', handleUserStoppedTyping);
      
      // Clear all typing timeouts
      typingTimeouts.current.forEach(timeout => clearTimeout(timeout));
      typingTimeouts.current.clear();
    };
  }, [channel.id]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await messageAPI.getByChannel(channel.id);
      setMessages(response.data.reverse());
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content: string, attachments?: string[]) => {
    try {
      await messageAPI.send({
        channelId: channel.id,
        content,
        attachments,
      });
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleEditMessage = async (messageId: string, content: string) => {
    try {
      await messageAPI.update(messageId, content);
    } catch (error) {
      console.error('Error editing message:', error);
      toast.error('Failed to edit message');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await messageAPI.delete(messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      // Check if user already reacted with this emoji
      const message = messages.find(m => m.id === messageId);
      const existingReaction = message?.reactions?.find(r => r.emoji === emoji);
      
      if (existingReaction) {
        await reactionAPI.remove(messageId, emoji);
      } else {
        await reactionAPI.add(messageId, emoji);
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const handleStartHuddle = async () => {
    try {
      await huddleAPI.start(channel.id);
      toast.success('Huddle started!');
    } catch (error) {
      console.error('Error starting huddle:', error);
      toast.error('Failed to start huddle');
    }
  };

  const handleJoinHuddle = async () => {
    if (activeHuddle) {
      try {
        await huddleAPI.join(activeHuddle.id);
        toast.success('Joined huddle!');
      } catch (error) {
        console.error('Error joining huddle:', error);
        toast.error('Failed to join huddle');
      }
    }
  };

  return (
    <div className={`flex-1 flex flex-col bg-white ${showThread ? 'border-r border-gray-200' : ''}`}>
      {/* Channel Header */}
      <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          {channel.isPrivate ? (
            <Lock className="h-5 w-5 text-gray-500" />
          ) : (
            <Hash className="h-5 w-5 text-gray-500" />
          )}
          <h2 className="font-bold text-gray-900">{channel.name}</h2>
          {channel.memberCount && (
            <span className="text-sm text-gray-500 flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {channel.memberCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {activeHuddle?.channelId === channel.id ? (
            <button
              onClick={handleJoinHuddle}
              className="p-2 hover:bg-gray-100 rounded text-green-600"
              title="Join huddle"
            >
              <Phone className="h-5 w-5 animate-pulse" />
            </button>
          ) : (
            <button
              onClick={handleStartHuddle}
              className="p-2 hover:bg-gray-100 rounded"
              title="Start huddle"
            >
              <Phone className="h-5 w-5" />
            </button>
          )}
          <button className="p-2 hover:bg-gray-100 rounded">
            <Search className="h-5 w-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded">
            <Info className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading messages...</div>
          </div>
        ) : (
          <>
            <MessageList
              messages={messages}
              onSelectThread={onSelectThread}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
              onReaction={handleReaction}
            />
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Typing Indicators */}
      {typingUsers.size > 0 && (
        <div className="px-4 py-2 text-sm text-gray-500">
          {Array.from(typingUsers.values()).map(user => user.username).join(', ')} 
          {typingUsers.size === 1 ? ' is' : ' are'} typing...
        </div>
      )}

      {/* Message Composer */}
      <MessageComposer
        channel={channel}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};

export default ChannelView;

import React, { useState, useEffect } from 'react';
import { Channel, Message, User } from '../types';
import MessageList from './MessageList';
import MessageComposer from './MessageComposer';
import { Hash, Users, Phone, Settings } from 'lucide-react';

interface DemoChannelProps {
  onStartHuddle: () => void;
}

const DemoChannel: React.FC<DemoChannelProps> = ({ onStartHuddle }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Mock channel data
  const demoChannel: Channel = {
    id: 'demo-general',
    name: 'general',
    description: 'General discussion channel for the team',
    workspaceId: 'demo-workspace',
    isPrivate: false,
    isDm: false,
    memberCount: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Mock user data
  const currentUser: User = {
    id: 'demo-user',
    email: 'demo@slack.com',
    username: 'demo',
    fullName: 'Demo User',
    avatarUrl: null,
    status: 'online',
    statusMessage: null
  };

  // Mock demo messages
  useEffect(() => {
    const demoMessages: Message[] = [
      {
        id: '1',
        content: 'Welcome to the #general channel! 🎉',
        channelId: 'demo-general',
        userId: 'demo-user',
        user: currentUser,
        createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
        reactions: [
          {
            id: '1',
            emoji: '👍',
            userId: 'demo-user',
            messageId: '1',
            createdAt: new Date().toISOString()
          }
        ],
        attachments: [],
        threadCount: 0
      },
      {
        id: '2',
        content: 'This is a great place to share team updates and collaborate! Let\'s test some features:\n\n- **Bold text**\n- *Italic text* \n- `Code snippet`\n- @demo mentions work too!',
        channelId: 'demo-general',
        userId: 'demo-user',
        user: currentUser,
        createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        updatedAt: new Date(Date.now() - 1800000).toISOString(),
        reactions: [
          {
            id: '2',
            emoji: '🔥',
            userId: 'demo-user',
            messageId: '2',
            createdAt: new Date().toISOString()
          },
          {
            id: '3',
            emoji: '💯',
            userId: 'demo-user',
            messageId: '2',
            createdAt: new Date().toISOString()
          }
        ],
        attachments: [],
        threadCount: 2
      },
      {
        id: '3',
        content: 'You can also start a huddle for voice chat! 📞',
        channelId: 'demo-general',
        userId: 'demo-user',
        user: currentUser,
        createdAt: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
        updatedAt: new Date(Date.now() - 600000).toISOString(),
        reactions: [],
        attachments: [],
        threadCount: 0
      }
    ];
    setMessages(demoMessages);
  }, []);

  const handleSendMessage = (content: string, attachments?: string[]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      channelId: demoChannel.id,
      userId: currentUser.id,
      user: currentUser,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reactions: [],
      attachments: attachments || [],
      threadCount: 0
    };

    setMessages(prev => [...prev, newMessage]);
  };

  const handleReaction = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const existingReaction = msg.reactions.find(r => r.emoji === emoji && r.userId === currentUser.id);
        if (existingReaction) {
          // Remove reaction
          return {
            ...msg,
            reactions: msg.reactions.filter(r => r.id !== existingReaction.id)
          };
        } else {
          // Add reaction
          return {
            ...msg,
            reactions: [...msg.reactions, {
              id: Date.now().toString(),
              emoji,
              userId: currentUser.id,
              messageId,
              createdAt: new Date().toISOString()
            }]
          };
        }
      }
      return msg;
    }));
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Channel Header */}
      <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <Hash className="h-5 w-5 text-gray-600" />
          <h2 className="font-bold text-lg">{demoChannel.name}</h2>
          <span className="text-gray-500">|</span>
          <span className="text-sm text-gray-600">{demoChannel.description}</span>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={onStartHuddle}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-green-100 hover:bg-green-200 rounded-md text-green-800 transition-colors"
          >
            <Phone className="h-4 w-4" />
            <span>Start Huddle</span>
          </button>
          
          <button className="flex items-center space-x-1 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">
            <Users className="h-4 w-4" />
            <span>{demoChannel.memberCount}</span>
          </button>
          
          <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1">
        <MessageList 
          messages={messages}
          onReaction={handleReaction}
          onThreadStart={() => {}}
        />
      </div>

      {/* Message Composer */}
      <div className="border-t border-gray-200">
        <MessageComposer
          channel={demoChannel}
          onSendMessage={handleSendMessage}
          placeholder={`Message #${demoChannel.name}`}
        />
      </div>
    </div>
  );
};

export default DemoChannel;

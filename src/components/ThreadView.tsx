import React, { useState, useEffect } from 'react';
import { Message, Channel } from '../types';
import { messageAPI } from '../services/api';
import MessageList from './MessageList';
import MessageComposer from './MessageComposer';
import MessageItem from './MessageItem';
import { X } from 'lucide-react';
import socketService from '../services/socket';
import toast from 'react-hot-toast';

interface ThreadViewProps {
  message: Message;
  channel: Channel;
  onClose: () => void;
}

const ThreadView: React.FC<ThreadViewProps> = ({ message, channel, onClose }) => {
  const [replies, setReplies] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadThread();

    // Socket event listeners for thread updates
    const handleNewMessage = (data: any) => {
      if (data.message.parentMessageId === message.id) {
        setReplies(prev => [...prev, data.message]);
      }
    };

    const handleMessageUpdated = (data: any) => {
      if (data.message.parentMessageId === message.id) {
        setReplies(prev => prev.map(msg => 
          msg.id === data.message.id ? data.message : msg
        ));
      }
    };

    const handleMessageDeleted = (data: any) => {
      setReplies(prev => prev.filter(msg => msg.id !== data.messageId));
    };

    socketService.on('new_message', handleNewMessage);
    socketService.on('message_updated', handleMessageUpdated);
    socketService.on('message_deleted', handleMessageDeleted);

    return () => {
      socketService.off('new_message', handleNewMessage);
      socketService.off('message_updated', handleMessageUpdated);
      socketService.off('message_deleted', handleMessageDeleted);
    };
  }, [message.id]);

  const loadThread = async () => {
    setLoading(true);
    try {
      const response = await messageAPI.getThread(message.id);
      setReplies(response.data);
    } catch (error) {
      console.error('Error loading thread:', error);
      toast.error('Failed to load thread');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (content: string, attachments?: string[]) => {
    try {
      await messageAPI.create({
        channel_id: channel.id,
        content,
        parent_id: message.id,
      });
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
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
    // Handle reactions in thread
    console.log('React to message in thread:', messageId, emoji);
  };

  return (
    <div className="w-96 flex flex-col bg-white border-l border-gray-200">
      {/* Thread Header */}
      <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4">
        <h3 className="font-bold text-gray-900">Thread</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Thread Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading thread...</div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Original Message */}
            <div className="border-b border-gray-200 pb-4">
              <MessageItem
                message={message}
                onSelectThread={() => {}}
                onEdit={handleEditMessage}
                onDelete={handleDeleteMessage}
                onReaction={handleReaction}
              />
            </div>

            {/* Replies */}
            {replies.length > 0 ? (
              <div className="space-y-4">
                <div className="text-sm font-medium text-gray-500">
                  {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                </div>
                {replies.map((reply) => (
                  <MessageItem
                    key={reply.id}
                    message={reply}
                    onSelectThread={() => {}}
                    onEdit={handleEditMessage}
                    onDelete={handleDeleteMessage}
                    onReaction={handleReaction}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>No replies yet</p>
                <p className="text-sm mt-2">Be the first to reply!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reply Composer */}
      <MessageComposer
        channel={channel}
        onSendMessage={handleSendReply}
        placeholder={`Reply to thread...`}
      />
    </div>
  );
};

export default ThreadView;

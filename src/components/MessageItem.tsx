import React, { useState } from 'react';
import { Message } from '../types';
import { format } from 'date-fns';
import { 
  MessageSquare, 
  Edit2, 
  Trash2, 
  MoreHorizontal,
  Smile,
  Reply
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import EmojiPicker from './EmojiPicker';

interface MessageItemProps {
  message: Message;
  onSelectThread: (message: Message) => void;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
  onReaction: (messageId: string, emoji: string) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onSelectThread,
  onEdit,
  onDelete,
  onReaction,
}) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const isOwn = user?.id === message.userId;
  const userInitial = message.user?.username?.[0]?.toUpperCase() || 'U';

  const handleEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit(message.id, editContent);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const handleReaction = (emoji: string) => {
    onReaction(message.id, emoji);
    setShowEmojiPicker(false);
  };

  const formatTime = (date: string) => {
    return format(new Date(date), 'h:mm a');
  };

  const renderContent = () => {
    // Parse message content for formatting
    const lines = message.content.split('\n');
    return lines.map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < lines.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div
      className="group flex space-x-3 px-4 py-2 hover:bg-gray-50 relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowEmojiPicker(false);
      }}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-9 h-9 bg-gray-500 rounded flex items-center justify-center">
          <span className="text-white text-sm font-semibold">{userInitial}</span>
        </div>
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline space-x-2">
          <span className="font-semibold text-gray-900">
            {message.user?.username || 'Unknown User'}
          </span>
          <span className="text-xs text-gray-500">{formatTime(message.createdAt)}</span>
          {message.isEdited && (
            <span className="text-xs text-gray-400">(edited)</span>
          )}
        </div>

        {isEditing ? (
          <div className="mt-1">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-slack-purple"
              rows={3}
              autoFocus
            />
            <div className="mt-2 space-x-2">
              <button
                onClick={handleEdit}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-0.5 text-gray-800">{renderContent()}</div>
        )}

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment) => (
              <div key={attachment.id} className="border border-gray-200 rounded p-2">
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  📎 {attachment.filename}
                </a>
                <span className="text-xs text-gray-500 ml-2">
                  ({(attachment.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.reactions.map((reaction) => (
              <button
                key={`${reaction.emoji}-${reaction.id}`}
                onClick={() => onReaction(message.id, reaction.emoji)}
                className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm"
              >
                <span>{reaction.emoji}</span>
                <span className="text-gray-600">{reaction.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Thread Preview */}
        {message.replyCount && message.replyCount > 0 && (
          <button
            onClick={() => onSelectThread(message)}
            className="mt-2 flex items-center space-x-2 text-blue-600 hover:underline text-sm"
          >
            <Reply className="h-4 w-4" />
            <span>{message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}</span>
          </button>
        )}
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="absolute right-4 top-2 flex items-center space-x-1 bg-white border border-gray-200 rounded shadow-sm">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-1.5 hover:bg-gray-100 rounded"
            title="Add reaction"
          >
            <Smile className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={() => onSelectThread(message)}
            className="p-1.5 hover:bg-gray-100 rounded"
            title="Reply in thread"
          >
            <MessageSquare className="h-4 w-4 text-gray-600" />
          </button>
          {isOwn && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 hover:bg-gray-100 rounded"
                title="Edit message"
              >
                <Edit2 className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={() => onDelete(message.id)}
                className="p-1.5 hover:bg-gray-100 rounded"
                title="Delete message"
              >
                <Trash2 className="h-4 w-4 text-gray-600" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute right-4 top-10 z-50">
          <EmojiPicker onSelect={handleReaction} />
        </div>
      )}
    </div>
  );
};

export default MessageItem;

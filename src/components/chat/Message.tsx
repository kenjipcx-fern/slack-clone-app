import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  EllipsisHorizontalIcon,
  FaceSmileIcon,
  ChatBubbleLeftRightIcon,
  BookmarkIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { Menu } from '@headlessui/react';
import useStore from '../../store/useStore';
import EmojiPicker from 'emoji-picker-react';

interface MessageProps {
  message: any;
  isCompact?: boolean;
}

const Message: React.FC<MessageProps> = ({ message, isCompact = false }) => {
  const { user, users, deleteMessage, editMessage, addReaction, removeReaction, selectMessage } = useStore();
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  
  const messageUser = users.get(message.user_id) || message.user;
  const isOwnMessage = user?.id === message.user_id;
  
  const handleEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      editMessage(message.id, editContent);
    }
    setIsEditing(false);
  };
  
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      deleteMessage(message.id);
    }
  };
  
  const handleReaction = (emoji: string) => {
    const existingReaction = message.reactions?.find((r: any) => 
      r.emoji === emoji && r.users.includes(user?.id)
    );
    
    if (existingReaction) {
      removeReaction(message.id, emoji);
    } else {
      addReaction(message.id, emoji);
    }
    setShowEmojiPicker(false);
  };
  
  const handleThread = () => {
    selectMessage(message.id);
  };
  
  return (
    <div 
      className={`group flex space-x-3 py-1 px-4 hover:bg-gray-50 ${showActions ? 'bg-gray-50' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      {!isCompact && (
        <div className="flex-shrink-0">
          {messageUser?.avatar ? (
            <img 
              src={messageUser.avatar} 
              alt={messageUser.name} 
              className="w-9 h-9 rounded"
            />
          ) : (
            <div className="w-9 h-9 bg-gray-400 rounded flex items-center justify-center text-white text-sm font-medium">
              {messageUser?.name?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
        </div>
      )}
      
      {/* Message Content */}
      <div className="flex-1 min-w-0">
        {!isCompact && (
          <div className="flex items-baseline space-x-2">
            <span className="font-semibold text-gray-900">
              {messageUser?.name || 'Unknown User'}
            </span>
            <span className="text-xs text-gray-500">
              {format(new Date(message.created_at), 'h:mm a')}
            </span>
            {message.edited_at && (
              <span className="text-xs text-gray-400">(edited)</span>
            )}
          </div>
        )}
        
        {isEditing ? (
          <div className="mt-1">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleEdit();
                } else if (e.key === 'Escape') {
                  setIsEditing(false);
                  setEditContent(message.content);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-slack-purple focus:border-transparent outline-none resize-none"
              rows={2}
              autoFocus
            />
            <div className="flex space-x-2 mt-2">
              <button
                onClick={handleEdit}
                className="px-3 py-1 bg-slack-purple text-white rounded-md hover:bg-slack-hover text-sm"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(message.content);
                }}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-0.5 text-gray-900 whitespace-pre-wrap break-words">
            {message.content}
          </div>
        )}
        
        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment: any) => (
              <div key={attachment.id} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-md">
                <div className="flex-1">
                  <a 
                    href={attachment.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-slack-purple hover:underline"
                  >
                    {attachment.filename}
                  </a>
                  <p className="text-xs text-gray-500">
                    {(attachment.file_size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {message.reactions.map((reaction: any) => (
              <button
                key={reaction.emoji}
                onClick={() => handleReaction(reaction.emoji)}
                className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full border text-sm ${
                  reaction.users.includes(user?.id) 
                    ? 'bg-blue-50 border-blue-300 text-blue-700' 
                    : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>{reaction.emoji}</span>
                <span className="text-xs font-medium">{reaction.count}</span>
              </button>
            ))}
          </div>
        )}
        
        {/* Thread indicator */}
        {message.reply_count && message.reply_count > 0 && (
          <button
            onClick={handleThread}
            className="flex items-center space-x-2 mt-2 text-sm text-slack-active hover:underline"
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4" />
            <span>{message.reply_count} {message.reply_count === 1 ? 'reply' : 'replies'}</span>
          </button>
        )}
      </div>
      
      {/* Action buttons */}
      {showActions && (
        <div className="flex items-start space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-1 hover:bg-gray-200 rounded text-gray-600"
          >
            <FaceSmileIcon className="w-4 h-4" />
          </button>
          <button
            onClick={handleThread}
            className="p-1 hover:bg-gray-200 rounded text-gray-600"
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-gray-200 rounded text-gray-600">
            <ShareIcon className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-gray-200 rounded text-gray-600">
            <BookmarkIcon className="w-4 h-4" />
          </button>
          
          {isOwnMessage && (
            <Menu as="div" className="relative">
              <Menu.Button className="p-1 hover:bg-gray-200 rounded text-gray-600">
                <EllipsisHorizontalIcon className="w-4 h-4" />
              </Menu.Button>
              
              <Menu.Items className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setIsEditing(true)}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700`}
                    >
                      <PencilIcon className="w-4 h-4" />
                      <span>Edit message</span>
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleDelete}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600`}
                    >
                      <TrashIcon className="w-4 h-4" />
                      <span>Delete message</span>
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Menu>
          )}
        </div>
      )}
      
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute z-20">
          <div className="fixed inset-0" onClick={() => setShowEmojiPicker(false)} />
          <div className="relative">
            <EmojiPicker
              onEmojiClick={(emoji) => handleReaction(emoji.emoji)}
              width={350}
              height={400}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Message;

import React, { useState, useRef, useEffect } from 'react';
import { Channel } from '../types';
import { Send, Paperclip, Smile, AtSign, Hash } from 'lucide-react';
import socketService from '../services/socket';
import { uploadAPI } from '../services/api';
import EmojiPicker from './EmojiPicker';
import toast from 'react-hot-toast';

interface MessageComposerProps {
  channel: Channel;
  onSendMessage: (content: string, attachments?: string[]) => void;
  placeholder?: string;
}

const MessageComposer: React.FC<MessageComposerProps> = ({
  channel,
  onSendMessage,
  placeholder,
}) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Focus on mount
    textareaRef.current?.focus();
  }, [channel.id]);

  const handleTyping = () => {
    socketService.sendTyping(channel.id);
    
    // Clear existing timeout
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    
    // Set timeout to stop typing
    typingTimeout.current = setTimeout(() => {
      socketService.stopTyping(channel.id);
    }, 2000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    handleTyping();
    
    // Auto-resize textarea
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  const handleSend = () => {
    if (message.trim() || attachments.length > 0) {
      onSendMessage(message.trim(), attachments);
      setMessage('');
      setAttachments([]);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      
      // Stop typing
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
      socketService.stopTyping(channel.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = message.slice(0, start) + emoji + message.slice(end);
      setMessage(newMessage);
      
      // Set cursor position after emoji
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    }
    setShowEmojiPicker(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const response = await uploadAPI.uploadFiles(files);
      const urls = response.files.map((file: any) => file.url);
      setAttachments(prev => [...prev, ...urls]);
      toast.success(`${files.length} file(s) uploaded`);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    if (channel.isDm) {
      return `Message ${channel.dmUser?.username || 'user'}`;
    }
    return `Message #${channel.name}`;
  };

  return (
    <div className="px-4 pb-4">
      <div className="relative">
        <div className="border border-gray-300 rounded-lg focus-within:border-slack-purple focus-within:ring-1 focus-within:ring-slack-purple">
          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="px-3 pt-2 flex flex-wrap gap-2">
              {attachments.map((url, index) => (
                <div key={index} className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center">
                  📎 File {index + 1}
                  <button
                    onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                    className="ml-2 text-gray-500 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            className="w-full px-3 py-2 resize-none focus:outline-none rounded-lg"
            rows={1}
            style={{ minHeight: '38px', maxHeight: '200px' }}
          />

          {/* Action Buttons */}
          <div className="flex items-center justify-between px-3 pb-2">
            <div className="flex items-center space-x-1">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-50"
                title="Attach files"
              >
                <Paperclip className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1.5 hover:bg-gray-100 rounded relative"
                title="Add emoji"
              >
                <Smile className="h-4 w-4 text-gray-600" />
              </button>
              <button className="p-1.5 hover:bg-gray-100 rounded" title="Mention someone">
                <AtSign className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            <button
              onClick={handleSend}
              disabled={!message.trim() && attachments.length === 0}
              className="p-1.5 bg-slack-green text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="absolute bottom-full left-0 mb-2 z-50">
            <EmojiPicker onSelect={handleEmojiSelect} />
          </div>
        )}
      </div>

      {/* Helper Text */}
      <div className="mt-1 text-xs text-gray-500">
        <span className="font-semibold">Shift + Enter</span> to add a new line
      </div>
    </div>
  );
};

export default MessageComposer;

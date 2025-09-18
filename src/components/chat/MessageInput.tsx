import React, { useState, useRef, useEffect } from 'react';
import { 
  PaperClipIcon, 
  FaceSmileIcon, 
  AtSymbolIcon,
  BoltIcon,
  MicrophoneIcon,
  VideoCameraIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import EmojiPicker from 'emoji-picker-react';
import useStore from '../../store/useStore';

const MessageInput: React.FC = () => {
  const { currentChannel, sendMessage, startTyping, stopTyping } = useStore();
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    // Auto-focus on channel change
    textareaRef.current?.focus();
  }, [currentChannel]);
  
  const handleTyping = (value: string) => {
    setMessage(value);
    
    // Handle typing indicator
    if (!isTyping && value.length > 0) {
      setIsTyping(true);
      startTyping();
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        stopTyping();
      }
    }, 2000);
  };
  
  const handleSend = async () => {
    if (message.trim() && currentChannel) {
      await sendMessage(message.trim());
      setMessage('');
      
      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        stopTyping();
      }
      
      // Clear timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleEmojiClick = (emoji: any) => {
    const cursorPosition = textareaRef.current?.selectionStart || message.length;
    const newMessage = 
      message.slice(0, cursorPosition) + 
      emoji.emoji + 
      message.slice(cursorPosition);
    
    setMessage(newMessage);
    setShowEmojiPicker(false);
    
    // Refocus and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPosition = cursorPosition + emoji.emoji.length;
        textareaRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };
  
  const handleFileUpload = () => {
    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = (e: any) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        // Handle file upload
        console.log('Files to upload:', files);
        // TODO: Implement file upload
      }
    };
    input.click();
  };
  
  if (!currentChannel) return null;
  
  return (
    <div className="px-4 pb-4">
      <div className="border border-gray-300 rounded-lg focus-within:border-gray-400 focus-within:shadow-sm transition">
        <div className="flex items-start p-2">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${currentChannel.name}`}
            className="flex-1 resize-none outline-none px-2 py-1 min-h-[40px] max-h-[200px]"
            rows={1}
            style={{
              height: 'auto',
              overflowY: message.split('\n').length > 5 ? 'auto' : 'hidden'
            }}
          />
        </div>
        
        <div className="flex items-center justify-between px-2 pb-2 border-t border-gray-100">
          <div className="flex items-center space-x-1">
            <button
              type="button"
              className="p-1.5 hover:bg-gray-100 rounded transition"
              title="Bold"
            >
              <span className="font-bold text-gray-600 text-sm">B</span>
            </button>
            <button
              type="button"
              className="p-1.5 hover:bg-gray-100 rounded transition"
              title="Italic"
            >
              <span className="italic text-gray-600 text-sm">I</span>
            </button>
            <button
              type="button"
              className="p-1.5 hover:bg-gray-100 rounded transition"
              title="Strikethrough"
            >
              <span className="line-through text-gray-600 text-sm">S</span>
            </button>
            
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            
            <button
              type="button"
              onClick={handleFileUpload}
              className="p-1.5 hover:bg-gray-100 rounded transition"
              title="Attach files"
            >
              <PaperClipIcon className="w-4 h-4 text-gray-600" />
            </button>
            
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1.5 hover:bg-gray-100 rounded transition"
                title="Emoji"
              >
                <FaceSmileIcon className="w-4 h-4 text-gray-600" />
              </button>
              
              {showEmojiPicker && (
                <div className="absolute bottom-10 left-0 z-50">
                  <div className="fixed inset-0" onClick={() => setShowEmojiPicker(false)} />
                  <div className="relative">
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      width={350}
                      height={400}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <button
              type="button"
              className="p-1.5 hover:bg-gray-100 rounded transition"
              title="Mention someone"
            >
              <AtSymbolIcon className="w-4 h-4 text-gray-600" />
            </button>
            
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            
            <button
              type="button"
              className="p-1.5 hover:bg-gray-100 rounded transition"
              title="Record video"
            >
              <VideoCameraIcon className="w-4 h-4 text-gray-600" />
            </button>
            
            <button
              type="button"
              className="p-1.5 hover:bg-gray-100 rounded transition"
              title="Record audio"
            >
              <MicrophoneIcon className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleSend}
              disabled={!message.trim()}
              className={`px-3 py-1.5 rounded-md transition flex items-center space-x-1 ${
                message.trim() 
                  ? 'bg-slack-purple hover:bg-slack-hover text-white' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <PaperAirplaneIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;

import React, { useEffect, useRef, useState } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import useStore from '../../store/useStore';
import Message from './Message';
import MessageInput from './MessageInput';
import ChannelHeader from './ChannelHeader';
import TypingIndicator from './TypingIndicator';
import EmptyState from './EmptyState';

const ChatArea: React.FC = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { currentChannel, messages, typingUsers, isLoading } = useStore();
  const [isAtBottom, setIsAtBottom] = useState(true);
  
  const channelMessages = currentChannel ? messages.get(currentChannel.id) || [] : [];
  const channelTypingUsers = currentChannel ? typingUsers.get(currentChannel.id) || [] : [];
  
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [channelMessages, isAtBottom]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsAtBottom(atBottom);
  };
  
  const formatDateDivider = (date: string) => {
    const messageDate = new Date(date);
    if (isToday(messageDate)) {
      return 'Today';
    } else if (isYesterday(messageDate)) {
      return 'Yesterday';
    } else {
      return format(messageDate, 'EEEE, MMMM d');
    }
  };
  
  const shouldShowDateDivider = (current: string, previous?: string) => {
    if (!previous) return true;
    const currentDate = new Date(current).toDateString();
    const previousDate = new Date(previous).toDateString();
    return currentDate !== previousDate;
  };
  
  if (!currentChannel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <EmptyState message="Select a channel to start messaging" />
      </div>
    );
  }
  
  return (
    <div className="flex-1 flex flex-col bg-white">
      <ChannelHeader />
      
      <div 
        className="flex-1 overflow-y-auto px-4"
        onScroll={handleScroll}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slack-purple"></div>
          </div>
        ) : channelMessages.length === 0 ? (
          <EmptyState 
            message={`This is the beginning of #${currentChannel.name}`}
            description="Send a message to start the conversation"
          />
        ) : (
          <>
            {channelMessages.map((message, index) => (
              <React.Fragment key={message.id}>
                {shouldShowDateDivider(
                  message.created_at, 
                  channelMessages[index - 1]?.created_at
                ) && (
                  <div className="flex items-center my-4">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <div className="mx-4 text-xs font-medium text-gray-500">
                      {formatDateDivider(message.created_at)}
                    </div>
                    <div className="flex-1 border-t border-gray-300"></div>
                  </div>
                )}
                <Message message={message} />
              </React.Fragment>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
        
        {channelTypingUsers.length > 0 && (
          <TypingIndicator users={channelTypingUsers} />
        )}
      </div>
      
      <MessageInput />
      
      {!isAtBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-8 bg-white shadow-lg rounded-full p-3 hover:bg-gray-50 transition"
        >
          <svg className="w-5 h-5 text-slack-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ChatArea;

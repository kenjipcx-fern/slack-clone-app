import React from 'react';
import { Message } from '../types';
import MessageItem from './MessageItem';
import { format, isToday, isYesterday } from 'date-fns';

interface MessageListProps {
  messages: Message[];
  onSelectThread: (message: Message) => void;
  onEditMessage: (messageId: string, content: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onReaction: (messageId: string, emoji: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  onSelectThread,
  onEditMessage,
  onDeleteMessage,
  onReaction,
}) => {
  const getDateHeader = (date: string) => {
    const messageDate = new Date(date);
    
    if (isToday(messageDate)) {
      return 'Today';
    } else if (isYesterday(messageDate)) {
      return 'Yesterday';
    } else {
      return format(messageDate, 'EEEE, MMMM d');
    }
  };

  const shouldShowDateHeader = (currentMessage: Message, previousMessage?: Message) => {
    if (!previousMessage) return true;
    
    const currentDate = new Date(currentMessage.createdAt).toDateString();
    const previousDate = new Date(previousMessage.createdAt).toDateString();
    
    return currentDate !== previousDate;
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p>No messages yet</p>
          <p className="text-sm mt-2">Be the first to send a message!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      {messages.map((message, index) => {
        const previousMessage = index > 0 ? messages[index - 1] : undefined;
        const showDateHeader = shouldShowDateHeader(message, previousMessage);
        
        return (
          <React.Fragment key={message.id}>
            {showDateHeader && (
              <div className="flex items-center my-4">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="px-4 text-xs font-medium text-gray-500">
                  {getDateHeader(message.createdAt)}
                </span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
            )}
            <MessageItem
              message={message}
              onSelectThread={onSelectThread}
              onEdit={onEditMessage}
              onDelete={onDeleteMessage}
              onReaction={onReaction}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default MessageList;

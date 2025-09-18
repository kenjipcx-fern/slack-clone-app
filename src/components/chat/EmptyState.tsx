import React from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface EmptyStateProps {
  message: string;
  description?: string;
  icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message, description, icon }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12">
      <div className="mb-4 text-gray-400">
        {icon || <ChatBubbleLeftRightIcon className="w-16 h-16" />}
      </div>
      <h3 className="text-xl font-semibold text-gray-700 mb-2">{message}</h3>
      {description && (
        <p className="text-gray-500 text-center max-w-md">{description}</p>
      )}
    </div>
  );
};

export default EmptyState;

import React, { useState } from 'react';
import { X, Hash, Lock } from 'lucide-react';

interface CreateChannelModalProps {
  onClose: () => void;
  onCreate: (data: { name: string; description?: string; isPrivate: boolean }) => void;
}

const CreateChannelModal: React.FC<CreateChannelModalProps> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      await onCreate({
        name: name.trim().toLowerCase().replace(/\s+/g, '-'),
        description: description.trim(),
        isPrivate,
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">Create a channel</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="channel-name" className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {isPrivate ? (
                  <Lock className="h-4 w-4 text-gray-400" />
                ) : (
                  <Hash className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <input
                id="channel-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-slack-purple focus:border-slack-purple"
                placeholder="e.g. marketing"
                maxLength={80}
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Names must be lowercase, without spaces or periods
            </p>
          </div>

          <div>
            <label htmlFor="channel-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              id="channel-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-slack-purple focus:border-slack-purple"
              placeholder="What's this channel about?"
              rows={3}
            />
          </div>

          <div className="flex items-start">
            <input
              id="is-private"
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="mt-1 h-4 w-4 text-slack-purple focus:ring-slack-purple border-gray-300 rounded"
            />
            <label htmlFor="is-private" className="ml-3 text-sm text-gray-700">
              <span className="font-medium">Make private</span>
              <p className="text-gray-500">
                When a channel is set to private, it can only be viewed or joined by invitation.
              </p>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isCreating}
              className="px-4 py-2 text-white bg-slack-purple rounded-md hover:bg-slack-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChannelModal;

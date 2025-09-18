import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import useStore from '../../store/useStore';
import toast from 'react-hot-toast';

interface CreateChannelModalProps {
  onClose: () => void;
}

const CreateChannelModal: React.FC<CreateChannelModalProps> = ({ onClose }) => {
  const { createChannel, selectChannel } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Channel name is required');
      return;
    }
    
    setIsLoading(true);
    try {
      const channel = await createChannel(
        formData.name.toLowerCase().replace(/\s+/g, '-'),
        formData.description,
        formData.isPrivate
      );
      
      toast.success(`Channel #${channel.name} created!`);
      selectChannel(channel);
      onClose();
    } catch (error) {
      toast.error('Failed to create channel');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              Create a channel
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">#</span>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-slack-purple focus:border-transparent outline-none"
                  placeholder="e.g. marketing"
                  maxLength={80}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Names must be lowercase, without spaces or periods, and can't be longer than 80 characters.
              </p>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-slack-purple focus:border-transparent outline-none resize-none"
                placeholder="What's this channel about?"
                rows={3}
              />
            </div>
            
            <div>
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={formData.isPrivate}
                  onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                  className="mt-1 w-4 h-4 text-slack-purple border-gray-300 rounded focus:ring-slack-purple"
                />
                <div>
                  <p className="font-medium text-gray-900">Make private</p>
                  <p className="text-sm text-gray-500">
                    {formData.isPrivate
                      ? "Only specific people can view and join this channel"
                      : "Anyone in your workspace can view and join this channel"}
                  </p>
                </div>
              </label>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.name.trim()}
                className="px-4 py-2 bg-slack-purple hover:bg-slack-hover text-white rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default CreateChannelModal;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import toast from 'react-hot-toast';

const WorkspaceSetup: React.FC = () => {
  const navigate = useNavigate();
  const { createWorkspace, selectWorkspace, createChannel } = useStore();
  const [step, setStep] = useState(1);
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceDescription, setWorkspaceDescription] = useState('');
  const [channelNames, setChannelNames] = useState(['general', 'random']);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim()) {
      toast.error('Workspace name is required');
      return;
    }
    
    setIsLoading(true);
    try {
      // Create workspace
      const workspace = await createWorkspace(workspaceName, workspaceDescription);
      selectWorkspace(workspace);
      
      // Create default channels
      for (const channelName of channelNames) {
        if (channelName.trim()) {
          await createChannel(channelName.toLowerCase().replace(/\s+/g, '-'));
        }
      }
      
      toast.success('Workspace created successfully!');
      navigate('/workspace');
    } catch (error) {
      toast.error('Failed to create workspace');
    } finally {
      setIsLoading(false);
    }
  };
  
  const addChannel = () => {
    setChannelNames([...channelNames, '']);
  };
  
  const removeChannel = (index: number) => {
    setChannelNames(channelNames.filter((_, i) => i !== index));
  };
  
  const updateChannel = (index: number, value: string) => {
    const updated = [...channelNames];
    updated[index] = value;
    setChannelNames(updated);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slack-purple to-slack-hover flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Set up your workspace
          </h1>
          <p className="text-gray-600">
            Let's get your team connected and collaborating
          </p>
        </div>
        
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label htmlFor="workspace-name" className="block text-sm font-medium text-gray-700 mb-1">
                Workspace name
              </label>
              <input
                type="text"
                id="workspace-name"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slack-purple focus:border-transparent outline-none"
                placeholder="Acme Corp"
              />
              <p className="mt-1 text-sm text-gray-500">
                This is the name of your company or team
              </p>
            </div>
            
            <div>
              <label htmlFor="workspace-description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                id="workspace-description"
                value={workspaceDescription}
                onChange={(e) => setWorkspaceDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slack-purple focus:border-transparent outline-none resize-none"
                placeholder="What does your team do?"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!workspaceName.trim()}
                className="px-6 py-2 bg-slack-purple hover:bg-slack-hover text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
        
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Create channels for your team
              </label>
              <div className="space-y-2">
                {channelNames.map((channel, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-gray-500">#</span>
                    <input
                      type="text"
                      value={channel}
                      onChange={(e) => updateChannel(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slack-purple focus:border-transparent outline-none"
                      placeholder="e.g. marketing"
                    />
                    {channelNames.length > 1 && (
                      <button
                        onClick={() => removeChannel(index)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <button
                onClick={addChannel}
                className="mt-3 text-slack-purple hover:text-slack-hover font-medium text-sm"
              >
                + Add another channel
              </button>
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Back
              </button>
              <button
                onClick={handleCreateWorkspace}
                disabled={isLoading}
                className="px-6 py-2 bg-slack-purple hover:bg-slack-hover text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating...' : 'Create Workspace'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceSetup;

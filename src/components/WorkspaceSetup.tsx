import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { workspaceAPI, channelAPI } from '../services/api';
import { Hash, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const WorkspaceSetup: React.FC = () => {
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceDescription, setWorkspaceDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { refreshWorkspaces, selectWorkspace, workspaces } = useAuth();
  const navigate = useNavigate();

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) return;

    setIsLoading(true);
    try {
      // Create workspace
      const workspaceResponse = await workspaceAPI.create({
        name: workspaceName,
        description: workspaceDescription,
      });
      const newWorkspace = workspaceResponse.data;

      // Create default channels
      const defaultChannels = ['general', 'random', 'announcements'];
      for (const channelName of defaultChannels) {
        await channelAPI.create({
          name: channelName,
          workspace_id: newWorkspace.id,
          description: `Default ${channelName} channel`,
        });
      }

      // Refresh workspaces and select the new one
      await refreshWorkspaces();
      selectWorkspace(newWorkspace);
      
      toast.success('Workspace created successfully!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create workspace');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectWorkspace = (workspace: any) => {
    selectWorkspace(workspace);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center">
      <div className="mx-auto w-full max-w-2xl px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-slack-purple p-3 rounded-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Set up your workspace</h1>
          <p className="text-gray-600">Create a new workspace or select an existing one to get started.</p>
        </div>

        {workspaces.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Workspaces</h2>
            <div className="space-y-2">
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => handleSelectWorkspace(workspace)}
                  className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slack-purple"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-slack-purple p-2 rounded-md mr-3">
                        <Hash className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{workspace.name}</h3>
                        {workspace.description && (
                          <p className="text-sm text-gray-500">{workspace.description}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {workspace.role === 'owner' ? 'Owner' : workspace.role}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white px-8 py-8 shadow-lg rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Create a New Workspace</h2>
          <form onSubmit={handleCreateWorkspace} className="space-y-6">
            <div>
              <label htmlFor="workspace-name" className="block text-sm font-medium text-gray-700">
                Workspace name
              </label>
              <input
                id="workspace-name"
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-slack-purple focus:border-slack-purple"
                placeholder="My Team"
                required
              />
            </div>

            <div>
              <label htmlFor="workspace-description" className="block text-sm font-medium text-gray-700">
                Description (optional)
              </label>
              <textarea
                id="workspace-description"
                value={workspaceDescription}
                onChange={(e) => setWorkspaceDescription(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-slack-purple focus:border-slack-purple"
                placeholder="What's this workspace for?"
                rows={3}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-700">
                We'll automatically create #general, #random, and #announcements channels for your workspace.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slack-purple hover:bg-slack-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slack-purple disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating workspace...' : 'Create Workspace'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSetup;

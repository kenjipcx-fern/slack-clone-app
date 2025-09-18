import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  Hash, 
  Lock, 
  Plus, 
  MessageSquare,
  Phone,
  LogOut,
  Settings,
  Users,
  Search
} from 'lucide-react';
import { Workspace, Channel, Huddle } from '../types';
import { channelAPI, dmAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import CreateChannelModal from './CreateChannelModal';
import toast from 'react-hot-toast';

interface SidebarProps {
  workspace: Workspace;
  selectedChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  activeHuddle: Huddle | null;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  workspace, 
  selectedChannel, 
  onSelectChannel,
  activeHuddle 
}) => {
  const { user, logout } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [dms, setDms] = useState<Channel[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    channels: true,
    directMessages: true,
  });

  useEffect(() => {
    loadChannels();
    loadDMs();
  }, [workspace.id]);

  const loadChannels = async () => {
    try {
      const response = await channelAPI.list(workspace.id);
      setChannels(response.filter((ch: Channel) => !ch.isDm));
    } catch (error) {
      console.error('Error loading channels:', error);
    }
  };

  const loadDMs = async () => {
    try {
      const response = await dmAPI.list(workspace.id);
      setDms(response);
    } catch (error) {
      console.error('Error loading DMs:', error);
    }
  };

  const toggleSection = (section: 'channels' | 'directMessages') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleCreateChannel = async (channelData: any) => {
    try {
      await channelAPI.create({
        workspace_id: workspace.id,
        name: channelData.name,
        description: channelData.description,
        is_private: channelData.isPrivate,
      });
      await loadChannels();
      toast.success('Channel created successfully');
      setShowCreateModal(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create channel');
    }
  };

  return (
    <>
      <div className="w-64 bg-slack-sidebar text-slack-text flex flex-col">
        {/* Workspace Header */}
        <div className="p-4 hover:bg-slack-hover cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h2 className="text-white font-bold text-lg">{workspace.name}</h2>
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-2">
          <button className="w-full flex items-center space-x-2 px-3 py-1.5 bg-slack-border rounded text-sm hover:bg-opacity-80">
            <Search className="h-4 w-4" />
            <span>Search {workspace.name}</span>
          </button>
        </div>

        {/* Channels & DMs */}
        <div className="flex-1 overflow-y-auto px-2">
          {/* Channels Section */}
          <div className="mt-4">
            <button
              onClick={() => toggleSection('channels')}
              className="w-full flex items-center justify-between px-2 py-1 hover:bg-slack-hover rounded group"
            >
              <div className="flex items-center space-x-1">
                <ChevronDown 
                  className={`h-3 w-3 transition-transform ${!expandedSections.channels ? '-rotate-90' : ''}`} 
                />
                <span className="text-sm font-medium">Channels</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCreateModal(true);
                }}
                className="opacity-0 group-hover:opacity-100 hover:bg-slack-border rounded p-0.5"
              >
                <Plus className="h-4 w-4" />
              </button>
            </button>

            {expandedSections.channels && (
              <div className="mt-1 space-y-0.5">
                {channels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => onSelectChannel(channel)}
                    className={`w-full flex items-center space-x-2 px-7 py-1 rounded hover:bg-slack-hover ${
                      selectedChannel?.id === channel.id ? 'bg-slack-active text-white' : ''
                    }`}
                  >
                    {channel.isPrivate ? (
                      <Lock className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <Hash className="h-4 w-4 flex-shrink-0" />
                    )}
                    <span className="text-sm truncate">{channel.name}</span>
                    {activeHuddle?.channelId === channel.id && (
                      <Phone className="h-3 w-3 text-green-400 animate-pulse" />
                    )}
                  </button>
                ))}
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full flex items-center space-x-2 px-7 py-1 rounded hover:bg-slack-hover text-slack-text"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm">Add channel</span>
                </button>
              </div>
            )}
          </div>

          {/* Direct Messages Section */}
          <div className="mt-6">
            <button
              onClick={() => toggleSection('directMessages')}
              className="w-full flex items-center justify-between px-2 py-1 hover:bg-slack-hover rounded group"
            >
              <div className="flex items-center space-x-1">
                <ChevronDown 
                  className={`h-3 w-3 transition-transform ${!expandedSections.directMessages ? '-rotate-90' : ''}`} 
                />
                <span className="text-sm font-medium">Direct Messages</span>
              </div>
            </button>

            {expandedSections.directMessages && (
              <div className="mt-1 space-y-0.5">
                {dms.map((dm) => (
                  <button
                    key={dm.id}
                    onClick={() => onSelectChannel(dm)}
                    className={`w-full flex items-center space-x-2 px-7 py-1 rounded hover:bg-slack-hover ${
                      selectedChannel?.id === dm.id ? 'bg-slack-active text-white' : ''
                    }`}
                  >
                    <div className="relative">
                      <MessageSquare className="h-4 w-4" />
                      {dm.dmUser?.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-slack-sidebar"></div>
                      )}
                    </div>
                    <span className="text-sm truncate">
                      {dm.dmUser?.username || 'Unknown User'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-slack-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="w-8 h-8 bg-gray-600 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-slack-sidebar"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-white font-medium">{user?.username}</span>
                <span className="text-xs text-slack-text">{user?.email}</span>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 hover:bg-slack-hover rounded"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Create Channel Modal */}
      {showCreateModal && (
        <CreateChannelModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateChannel}
        />
      )}
    </>
  );
};

export default Sidebar;

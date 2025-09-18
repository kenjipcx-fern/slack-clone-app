import { create } from 'zustand';
import { authAPI, workspaceAPI, channelAPI, messageAPI, userAPI } from '../services/api';
import socketService from '../services/socket';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  status?: string;
  status_text?: string;
}

interface Workspace {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  owner_id: string;
}

interface Channel {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  is_private: boolean;
  is_direct: boolean;
  created_at: string;
  created_by: string;
  unread_count?: number;
  last_message?: Message;
}

interface Message {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  parent_id?: string;
  edited_at?: string;
  created_at: string;
  user?: User;
  reactions?: MessageReaction[];
  reply_count?: number;
  attachments?: Attachment[];
}

interface MessageReaction {
  emoji: string;
  users: string[];
  count: number;
}

interface Attachment {
  id: string;
  filename: string;
  file_size: number;
  file_type: string;
  url: string;
}

interface Huddle {
  id: string;
  channel_id: string;
  started_by: string;
  started_at: string;
  participants: HuddleParticipant[];
  is_active: boolean;
}

interface HuddleParticipant {
  user_id: string;
  user?: User;
  audio_enabled: boolean;
  video_enabled: boolean;
  screen_sharing: boolean;
  joined_at: string;
}

interface TypingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  // Workspaces
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  
  // Channels
  channels: Channel[];
  currentChannel: Channel | null;
  
  // Messages
  messages: Map<string, Message[]>;
  messageThreads: Map<string, Message[]>;
  
  // Users
  users: Map<string, User>;
  onlineUsers: Set<string>;
  
  // Typing indicators
  typingUsers: Map<string, TypingUser[]>;
  
  // Huddles
  activeHuddle: Huddle | null;
  
  // UI State
  isSidebarOpen: boolean;
  isRightSidebarOpen: boolean;
  selectedMessageId: string | null;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  
  // Workspace actions
  loadWorkspaces: () => Promise<void>;
  selectWorkspace: (workspace: Workspace) => void;
  createWorkspace: (name: string, description?: string) => Promise<Workspace>;
  
  // Channel actions
  loadChannels: (workspaceId: string) => Promise<void>;
  selectChannel: (channel: Channel) => void;
  createChannel: (name: string, description?: string, isPrivate?: boolean) => Promise<Channel>;
  joinChannel: (channelId: string) => Promise<void>;
  leaveChannel: (channelId: string) => Promise<void>;
  
  // Message actions
  loadMessages: (channelId: string) => Promise<void>;
  sendMessage: (content: string, parentId?: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
  loadThread: (messageId: string) => Promise<void>;
  
  // User actions
  loadUsers: (workspaceId?: string) => Promise<void>;
  updateUserStatus: (status: string, statusText?: string) => Promise<void>;
  
  // Typing actions
  startTyping: () => void;
  stopTyping: () => void;
  
  // Huddle actions
  startHuddle: () => Promise<void>;
  joinHuddle: (huddleId: string) => Promise<void>;
  leaveHuddle: () => Promise<void>;
  updateHuddleSettings: (settings: Partial<HuddleParticipant>) => Promise<void>;
  
  // UI actions
  toggleSidebar: () => void;
  toggleRightSidebar: () => void;
  selectMessage: (messageId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setError: (error: string | null) => void;
}

const useStore = create<AppState>((set, get) => ({
  // Initial state
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  
  workspaces: [],
  currentWorkspace: null,
  
  channels: [],
  currentChannel: null,
  
  messages: new Map(),
  messageThreads: new Map(),
  
  users: new Map(),
  onlineUsers: new Set(),
  
  typingUsers: new Map(),
  
  activeHuddle: null,
  
  isSidebarOpen: true,
  isRightSidebarOpen: false,
  selectedMessageId: null,
  searchQuery: '',
  isLoading: false,
  error: null,
  
  // Auth actions
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login({ email, password });
      const { token, user } = response;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Connect socket
      socketService.connect(token);
      
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
      
      // Load initial data
      await get().loadWorkspaces();
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },
  
  register: async (email: string, password: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.register({ email, password, name });
      const { token, user } = response;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Connect socket
      socketService.connect(token);
      
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Registration failed',
        isLoading: false,
      });
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    socketService.disconnect();
    
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      workspaces: [],
      currentWorkspace: null,
      channels: [],
      currentChannel: null,
      messages: new Map(),
      messageThreads: new Map(),
      users: new Map(),
      onlineUsers: new Set(),
      typingUsers: new Map(),
      activeHuddle: null,
    });
  },
  
  // Workspace actions
  loadWorkspaces: async () => {
    set({ isLoading: true });
    try {
      const workspaces = await workspaceAPI.list();
      set({ workspaces, isLoading: false });
      
      // Auto-select first workspace if none selected
      if (workspaces.length > 0 && !get().currentWorkspace) {
        get().selectWorkspace(workspaces[0]);
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to load workspaces',
        isLoading: false,
      });
    }
  },
  
  selectWorkspace: (workspace: Workspace) => {
    set({ currentWorkspace: workspace, currentChannel: null });
    get().loadChannels(workspace.id);
    get().loadUsers(workspace.id);
  },
  
  createWorkspace: async (name: string, description?: string) => {
    try {
      const workspace = await workspaceAPI.create({ name, description });
      set((state) => ({
        workspaces: [...state.workspaces, workspace],
      }));
      return workspace;
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to create workspace' });
      throw error;
    }
  },
  
  // Channel actions
  loadChannels: async (workspaceId: string) => {
    set({ isLoading: true });
    try {
      const channels = await channelAPI.list(workspaceId);
      set({ channels, isLoading: false });
      
      // Auto-select general channel or first channel
      if (channels.length > 0 && !get().currentChannel) {
        const generalChannel = channels.find((c: Channel) => c.name === 'general');
        get().selectChannel(generalChannel || channels[0]);
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to load channels',
        isLoading: false,
      });
    }
  },
  
  selectChannel: (channel: Channel) => {
    const currentChannel = get().currentChannel;
    
    // Leave previous channel
    if (currentChannel) {
      socketService.leaveChannel(currentChannel.id);
    }
    
    // Join new channel
    socketService.joinChannel(channel.id);
    
    set({ currentChannel: channel, selectedMessageId: null });
    get().loadMessages(channel.id);
  },
  
  createChannel: async (name: string, description?: string, isPrivate?: boolean) => {
    const workspace = get().currentWorkspace;
    if (!workspace) throw new Error('No workspace selected');
    
    try {
      const channel = await channelAPI.create({
        workspace_id: workspace.id,
        name,
        description,
        is_private: isPrivate,
      });
      
      set((state) => ({
        channels: [...state.channels, channel],
      }));
      
      return channel;
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to create channel' });
      throw error;
    }
  },
  
  joinChannel: async (channelId: string) => {
    try {
      await channelAPI.join(channelId);
      socketService.joinChannel(channelId);
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to join channel' });
      throw error;
    }
  },
  
  leaveChannel: async (channelId: string) => {
    try {
      await channelAPI.leave(channelId);
      socketService.leaveChannel(channelId);
      
      set((state) => ({
        channels: state.channels.filter((c) => c.id !== channelId),
        currentChannel: state.currentChannel?.id === channelId ? null : state.currentChannel,
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to leave channel' });
      throw error;
    }
  },
  
  // Message actions
  loadMessages: async (channelId: string) => {
    set({ isLoading: true });
    try {
      const messages = await messageAPI.list(channelId);
      
      set((state) => {
        const newMessages = new Map(state.messages);
        newMessages.set(channelId, messages);
        return { messages: newMessages, isLoading: false };
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to load messages',
        isLoading: false,
      });
    }
  },
  
  sendMessage: async (content: string, parentId?: string) => {
    const channel = get().currentChannel;
    if (!channel) return;
    
    try {
      const message = await messageAPI.create({
        channel_id: channel.id,
        content,
        parent_id: parentId,
      });
      
      // Message will be added via socket event
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to send message' });
      throw error;
    }
  },
  
  editMessage: async (messageId: string, content: string) => {
    try {
      await messageAPI.update(messageId, content);
      // Message will be updated via socket event
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to edit message' });
      throw error;
    }
  },
  
  deleteMessage: async (messageId: string) => {
    try {
      await messageAPI.delete(messageId);
      // Message will be removed via socket event
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to delete message' });
      throw error;
    }
  },
  
  addReaction: async (messageId: string, emoji: string) => {
    try {
      await messageAPI.addReaction(messageId, emoji);
      // Reaction will be added via socket event
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to add reaction' });
      throw error;
    }
  },
  
  removeReaction: async (messageId: string, emoji: string) => {
    try {
      await messageAPI.removeReaction(messageId, emoji);
      // Reaction will be removed via socket event
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to remove reaction' });
      throw error;
    }
  },
  
  loadThread: async (messageId: string) => {
    try {
      const thread = await messageAPI.getThread(messageId);
      
      set((state) => {
        const newThreads = new Map(state.messageThreads);
        newThreads.set(messageId, thread);
        return { messageThreads: newThreads };
      });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to load thread' });
    }
  },
  
  // User actions
  loadUsers: async (workspaceId?: string) => {
    try {
      const users = await userAPI.list(workspaceId);
      
      set((state) => {
        const newUsers = new Map(state.users);
        users.forEach((user: User) => {
          newUsers.set(user.id, user);
        });
        return { users: newUsers };
      });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to load users' });
    }
  },
  
  updateUserStatus: async (status: string, statusText?: string) => {
    try {
      await userAPI.updateStatus(status, statusText);
      
      set((state) => ({
        user: state.user ? { ...state.user, status, status_text: statusText } : null,
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to update status' });
      throw error;
    }
  },
  
  // Typing actions
  startTyping: () => {
    const channel = get().currentChannel;
    if (channel) {
      socketService.startTyping(channel.id);
    }
  },
  
  stopTyping: () => {
    const channel = get().currentChannel;
    if (channel) {
      socketService.stopTyping(channel.id);
    }
  },
  
  // Huddle actions
  startHuddle: async () => {
    const channel = get().currentChannel;
    if (!channel) return;
    
    try {
      const huddle = await huddleAPI.start(channel.id);
      set({ activeHuddle: huddle });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to start huddle' });
      throw error;
    }
  },
  
  joinHuddle: async (huddleId: string) => {
    try {
      const participant = await huddleAPI.join(huddleId);
      // Huddle state will be updated via socket event
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to join huddle' });
      throw error;
    }
  },
  
  leaveHuddle: async () => {
    const huddle = get().activeHuddle;
    if (!huddle) return;
    
    try {
      await huddleAPI.leave(huddle.id);
      set({ activeHuddle: null });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to leave huddle' });
      throw error;
    }
  },
  
  updateHuddleSettings: async (settings: Partial<HuddleParticipant>) => {
    const huddle = get().activeHuddle;
    if (!huddle) return;
    
    try {
      await huddleAPI.updateSettings(huddle.id, settings);
      // Settings will be updated via socket event
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to update huddle settings' });
      throw error;
    }
  },
  
  // UI actions
  toggleSidebar: () => {
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
  },
  
  toggleRightSidebar: () => {
    set((state) => ({ isRightSidebarOpen: !state.isRightSidebarOpen }));
  },
  
  selectMessage: (messageId: string | null) => {
    set({ selectedMessageId: messageId });
    
    if (messageId) {
      get().loadThread(messageId);
      set({ isRightSidebarOpen: true });
    }
  },
  
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },
  
  setError: (error: string | null) => {
    set({ error });
  },
}));

// Set up socket event listeners
const setupSocketListeners = () => {
  const state = useStore.getState();
  
  // Message events
  socketService.on('message:new', (data: any) => {
    useStore.setState((state) => {
      const messages = new Map(state.messages);
      const channelMessages = messages.get(data.channel_id) || [];
      messages.set(data.channel_id, [...channelMessages, data]);
      return { messages };
    });
  });
  
  socketService.on('message:updated', (data: any) => {
    useStore.setState((state) => {
      const messages = new Map(state.messages);
      const channelMessages = messages.get(data.channel_id) || [];
      const updatedMessages = channelMessages.map((msg) =>
        msg.id === data.id ? data : msg
      );
      messages.set(data.channel_id, updatedMessages);
      return { messages };
    });
  });
  
  socketService.on('message:deleted', (data: any) => {
    useStore.setState((state) => {
      const messages = new Map(state.messages);
      const channelMessages = messages.get(data.channel_id) || [];
      const filteredMessages = channelMessages.filter((msg) => msg.id !== data.id);
      messages.set(data.channel_id, filteredMessages);
      return { messages };
    });
  });
  
  // Typing events
  socketService.on('user:typing', (data: any) => {
    useStore.setState((state) => {
      const typingUsers = new Map(state.typingUsers);
      const channelTyping = typingUsers.get(data.channel_id) || [];
      
      const existingIndex = channelTyping.findIndex((u) => u.userId === data.user_id);
      if (existingIndex >= 0) {
        channelTyping[existingIndex] = {
          userId: data.user_id,
          userName: data.user_name,
          timestamp: Date.now(),
        };
      } else {
        channelTyping.push({
          userId: data.user_id,
          userName: data.user_name,
          timestamp: Date.now(),
        });
      }
      
      typingUsers.set(data.channel_id, channelTyping);
      return { typingUsers };
    });
    
    // Clear typing after 3 seconds
    setTimeout(() => {
      useStore.setState((state) => {
        const typingUsers = new Map(state.typingUsers);
        const channelTyping = typingUsers.get(data.channel_id) || [];
        const filtered = channelTyping.filter((u) => 
          u.userId !== data.user_id || Date.now() - u.timestamp < 3000
        );
        typingUsers.set(data.channel_id, filtered);
        return { typingUsers };
      });
    }, 3000);
  });
  
  // User presence events
  socketService.on('user:online', (data: any) => {
    useStore.setState((state) => {
      const onlineUsers = new Set(state.onlineUsers);
      onlineUsers.add(data.user_id);
      return { onlineUsers };
    });
  });
  
  socketService.on('user:offline', (data: any) => {
    useStore.setState((state) => {
      const onlineUsers = new Set(state.onlineUsers);
      onlineUsers.delete(data.user_id);
      return { onlineUsers };
    });
  });
};

// Initialize socket listeners when store is created
if (typeof window !== 'undefined') {
  setupSocketListeners();
  
  // Auto-connect socket if token exists
  const token = localStorage.getItem('token');
  if (token) {
    socketService.connect(token);
  }
}

export default useStore;

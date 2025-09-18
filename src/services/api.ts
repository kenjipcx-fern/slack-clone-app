import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: async (data: { email: string; password: string; name: string }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  
  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
  
  updateProfile: async (data: Partial<{ name: string; avatar: string; status: string }>) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },
};

// Workspace endpoints
export const workspaceAPI = {
  list: async () => {
    const response = await api.get('/workspaces');
    return response.data;
  },
  
  create: async (data: { name: string; description?: string }) => {
    const response = await api.post('/workspaces', data);
    return response.data;
  },
  
  get: async (id: string) => {
    const response = await api.get(`/workspaces/${id}`);
    return response.data;
  },
  
  update: async (id: string, data: { name?: string; description?: string }) => {
    const response = await api.put(`/workspaces/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/workspaces/${id}`);
    return response.data;
  },
  
  getMembers: async (id: string) => {
    const response = await api.get(`/workspaces/${id}/members`);
    return response.data;
  },
  
  inviteMember: async (id: string, email: string, role: string = 'member') => {
    const response = await api.post(`/workspaces/${id}/members`, { email, role });
    return response.data;
  },
  
  removeMember: async (workspaceId: string, userId: string) => {
    const response = await api.delete(`/workspaces/${workspaceId}/members/${userId}`);
    return response.data;
  },
};

// Channel endpoints
export const channelAPI = {
  list: async (workspaceId: string) => {
    const response = await api.get(`/channels?workspace_id=${workspaceId}`);
    return response.data;
  },
  
  create: async (data: {
    workspace_id: string;
    name: string;
    description?: string;
    is_private?: boolean;
    is_direct?: boolean;
  }) => {
    const response = await api.post('/channels', data);
    return response.data;
  },
  
  get: async (id: string) => {
    const response = await api.get(`/channels/${id}`);
    return response.data;
  },
  
  update: async (id: string, data: { name?: string; description?: string }) => {
    const response = await api.put(`/channels/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/channels/${id}`);
    return response.data;
  },
  
  getMembers: async (id: string) => {
    const response = await api.get(`/channels/${id}/members`);
    return response.data;
  },
  
  join: async (id: string) => {
    const response = await api.post(`/channels/${id}/join`);
    return response.data;
  },
  
  leave: async (id: string) => {
    const response = await api.post(`/channels/${id}/leave`);
    return response.data;
  },
  
  addMember: async (id: string, userId: string) => {
    const response = await api.post(`/channels/${id}/members`, { user_id: userId });
    return response.data;
  },
  
  removeMember: async (channelId: string, userId: string) => {
    const response = await api.delete(`/channels/${channelId}/members/${userId}`);
    return response.data;
  },
};

// Message endpoints
export const messageAPI = {
  list: async (channelId: string, limit: number = 50, before?: string) => {
    let url = `/messages?channel_id=${channelId}&limit=${limit}`;
    if (before) url += `&before=${before}`;
    const response = await api.get(url);
    return response.data;
  },
  
  create: async (data: {
    channel_id: string;
    content: string;
    parent_id?: string;
  }) => {
    const response = await api.post('/messages', data);
    return response.data;
  },
  
  update: async (id: string, content: string) => {
    const response = await api.put(`/messages/${id}`, { content });
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/messages/${id}`);
    return response.data;
  },
  
  getThread: async (parentId: string) => {
    const response = await api.get(`/messages/${parentId}/thread`);
    return response.data;
  },
  
  addReaction: async (messageId: string, emoji: string) => {
    const response = await api.post(`/messages/${messageId}/reactions`, { emoji });
    return response.data;
  },
  
  removeReaction: async (messageId: string, emoji: string) => {
    const response = await api.delete(`/messages/${messageId}/reactions/${emoji}`);
    return response.data;
  },
  
  uploadFile: async (channelId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('channel_id', channelId);
    
    const response = await api.post('/messages/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// User endpoints
export const userAPI = {
  list: async (workspaceId?: string) => {
    let url = '/users';
    if (workspaceId) url += `?workspace_id=${workspaceId}`;
    const response = await api.get(url);
    return response.data;
  },
  
  get: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  
  updateStatus: async (status: string, statusText?: string) => {
    const response = await api.put('/users/status', { status, status_text: statusText });
    return response.data;
  },
  
  search: async (query: string, workspaceId?: string) => {
    let url = `/users/search?q=${query}`;
    if (workspaceId) url += `&workspace_id=${workspaceId}`;
    const response = await api.get(url);
    return response.data;
  },
};

// Huddle endpoints
export const huddleAPI = {
  start: async (channelId: string) => {
    const response = await api.post('/huddles/start', { channel_id: channelId });
    return response.data;
  },
  
  join: async (huddleId: string, settings?: {
    audio_enabled?: boolean;
    video_enabled?: boolean;
    screen_sharing?: boolean;
  }) => {
    const response = await api.post(`/huddles/${huddleId}/join`, settings);
    return response.data;
  },
  
  leave: async (huddleId: string) => {
    const response = await api.post(`/huddles/${huddleId}/leave`);
    return response.data;
  },
  
  end: async (huddleId: string) => {
    const response = await api.post(`/huddles/${huddleId}/end`);
    return response.data;
  },
  
  updateSettings: async (huddleId: string, settings: {
    audio_enabled?: boolean;
    video_enabled?: boolean;
    screen_sharing?: boolean;
  }) => {
    const response = await api.put(`/huddles/${huddleId}/settings`, settings);
    return response.data;
  },
  
  getActive: async (channelId: string) => {
    const response = await api.get(`/huddles/active?channel_id=${channelId}`);
    return response.data;
  },
};

export default api;
